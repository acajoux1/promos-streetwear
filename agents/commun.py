"""Outils partagés par les deux agents.

Aucun agent ne pousse sur `main` : ils travaillent sur une branche et ouvrent
une pull request. Les seuils et les interdictions restent dans le module de
chaque agent, pour qu'on les lise à l'endroit où ils s'appliquent.
"""
import json
import os
import re
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent


def env(nom, defaut=""):
    # Une valeur vide ou faite d'espaces (secret non rempli) doit valoir le défaut.
    return (os.environ.get(nom) or "").strip() or defaut


def cle_api():
    return env("AI_API_KEY")


def base_api():
    return env("AI_API_BASE", "https://api.z.ai/api/paas/v4")


def modele():
    return env("AI_MODEL", "glm-4-flash")


# Repli quand le fournisseur principal refuse : clé refusée (401/403), quota
# épuisé (429), modèle ou route disparue (404/400). Gemini par défaut : offre
# gratuite sans carte bancaire, et la même API compatible OpenAI (endpoint
# `/v1beta/openai/chat/completions`). Une clé se crée sur aistudio.google.com.
BASE_REPLI = "https://generativelanguage.googleapis.com/v1beta/openai"
MODELE_REPLI = "gemini-3.8-flash"

# Statuts qui ne valent pas un réessai sur le même fournisseur : la main passe
# tout de suite au suivant quand il y en a un. Un 500/502/503 garde l'ancien
# comportement (réessai sur place, pas de bascule).
BASCULE = (400, 401, 403, 404, 429)

# Noms lisibles dans le journal du workflow : on lit l'hôte, pas une étiquette
# recopiée à la main qui finirait par mentir.
HOTES = {
    "api.z.ai": "Z.ai",
    "api.groq.com": "Groq",
    "api.openai.com": "OpenAI",
    "openrouter.ai": "OpenRouter",
    "generativelanguage.googleapis.com": "Gemini",
    "api.mistral.ai": "Mistral",
    "api.cerebras.ai": "Cerebras",
    "integrate.api.nvidia.com": "NVIDIA",
    "api.cohere.ai": "Cohere",
}


def nom_fournisseur(base):
    hote = re.sub(r"^https?://", "", (base or "").strip()).split("/")[0].lower()
    hote = hote.split(":")[0]  # sans le port, sinon la table ne reconnaît rien
    return HOTES.get(hote) or hote or "fournisseur inconnu"


def _liste(nom):
    """Une variable peut porter plusieurs valeurs, séparées par des virgules."""
    return [v.strip() for v in env(nom).split(",") if v.strip()]


def _valeur(nom, rang, defaut):
    """La n-ième valeur, sinon la dernière, sinon le défaut.

    Ainsi une seule base (ou un seul modèle) vaut pour toutes les clés d'un
    coup, et deux clés de fournisseurs différents peuvent avoir chacune la leur.
    """
    valeurs = _liste(nom)
    if not valeurs:
        return defaut
    return valeurs[rang] if rang < len(valeurs) else valeurs[-1]


def fournisseurs():
    """Le principal, puis chaque clé de secours dans l'ordre.

    `AI_API_KEY_BACKUP` peut contenir plusieurs clés séparées par des virgules ;
    `AI_API_BASE_BACKUP` et `AI_MODEL_BACKUP` les suivent dans le même ordre.
    Sans clé de secours, il n'y a que le principal, comme avant.
    """
    liste = [{
        "nom": nom_fournisseur(base_api()),
        "base": base_api(),
        "modele": modele(),
        "cle": cle_api(),
    }]
    for rang, cle in enumerate(_liste("AI_API_KEY_BACKUP")):
        base = _valeur("AI_API_BASE_BACKUP", rang, BASE_REPLI)
        liste.append({
            "nom": nom_fournisseur(base),
            "base": base,
            "modele": _valeur("AI_MODEL_BACKUP", rang, MODELE_REPLI),
            "cle": cle,
        })
    return liste


def a_une_cle():
    """Vrai dès qu'un fournisseur a une clé : principal ou secours.

    Un dépôt peut n'avoir que `AI_API_KEY_BACKUP` (Gemini sans clé Z.ai) ; les
    scripts ne doivent pas se croire sans clé pour autant.
    """
    return any(f["cle"] for f in fournisseurs())


def log(*args):
    print(*args, flush=True)


def lire_json(chemin, defaut=None):
    try:
        with open(RACINE / chemin, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return defaut


def ecrire_json(chemin, obj):
    p = RACINE / chemin
    p.parent.mkdir(parents=True, exist_ok=True)
    tmp = p.with_suffix(p.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write("\n")
    tmp.replace(p)


def cles_histoires():
    """Les clés du bloc HISTOIRES, alias compris (app.js ne les regroupe pas)."""
    try:
        src = lire_texte("app.js")
        bloc = src[src.index("var HISTOIRES={"):src.index("function histoireOf")]
    except (OSError, ValueError):
        return set()
    cles = set(re.findall(r'"([^"]+)"\s*:\s*\{', bloc))
    cles |= set(re.findall(r'HISTOIRES\["([^"]+)"\]', bloc))
    return cles


def marque_valide(k):
    """Une clé de marque plausible : ni URL, ni valeur d'import cassée."""
    return bool(re.fullmatch(r"[a-z0-9][a-z0-9 .'&+\-]{1,40}", k or ""))


def lire_texte(chemin):
    return (RACINE / chemin).read_text(encoding="utf-8")


def ecrire_texte(chemin, texte):
    (RACINE / chemin).write_text(texte, encoding="utf-8")


class Echec(RuntimeError):
    """Un fournisseur a échoué ; `code` porte le statut HTTP s'il y en a un."""

    def __init__(self, message, code=None):
        super().__init__(message)
        self.code = code


def appeler(system, utilisateur, temperature=0.3, max_tokens=1600, essais=2, json_mode=False):
    """Un tour de conversation, avec repli automatique. Lève RuntimeError à la fin.

    Le principal (`AI_API_*`) répond en premier. S'il refuse pour clé (401/403),
    quota (429), route ou modèle inconnu (400/404) et qu'un repli est configuré
    (`AI_API_KEY_BACKUP`), la main passe au suivant sans attendre les réessais —
    inutiles quand la limite est journalière. Le journal nomme chaque fournisseur
    essayé et celui qui a répondu, pour qu'un run vert ne laisse rien deviner.
    """
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": utilisateur},
    ]
    liste = fournisseurs()
    problemes = []
    dernier_code = None
    for i, f in enumerate(liste):
        dernier = i + 1 == len(liste)
        try:
            texte = _appeler(f, messages, temperature, max_tokens, essais, json_mode,
                             abandonner_sur=() if dernier else BASCULE)
        except Echec as e:
            problemes.append("%s : %s" % (f["nom"], e))
            dernier_code = e.code
            if not dernier and e.code in BASCULE:
                log("%s indisponible (%s) → repli sur %s." % (f["nom"], e, liste[i + 1]["nom"]))
                continue
            # `Echec` est un `RuntimeError` : les appelants qui attrapent
            # RuntimeError continuent de fonctionner, et `code` reste lisible.
            raise Echec("appel au modèle impossible (%s)" % " ; ".join(problemes), dernier_code)
        if i:
            log("Réponse de %s (%s), après l'échec de %s." % (f["nom"], f["modele"], liste[0]["nom"]))
        else:
            log("Réponse de %s (%s)." % (f["nom"], f["modele"]))
        return texte
    # Inatteignable : la dernière tentative lève toujours.
    raise Echec("appel au modèle impossible (%s)" % " ; ".join(problemes), dernier_code)


def _appeler(f, messages, temperature, max_tokens, essais, json_mode, abandonner_sur=()):
    """Un seul fournisseur, avec ses réessais. Lève Echec en cas d'échec.

    La réflexion est désactivée : les modèles GLM récents raisonnent avant de
    répondre, et cette réflexion peut manger tout `max_tokens` au point de
    renvoyer un `content` vide. `json_mode` demande en plus une sortie JSON.
    """
    options = {"thinking": {"type": "disabled"}}
    if json_mode:
        options["response_format"] = {"type": "json_object"}

    def corps():
        charge = {
            "model": f["modele"],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "messages": messages,
        }
        charge.update(options)
        return json.dumps(charge).encode("utf-8")

    url = f["base"].rstrip("/") + "/chat/completions"
    derniere, code = "inconnue", None
    tentatives = essais
    while tentatives > 0:
        tentatives -= 1
        req = urllib.request.Request(
            url,
            data=corps(),
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer " + f["cle"],
                "User-Agent": "promos-agents/1.0",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                j = json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            detail = ""
            try:
                detail = e.read().decode("utf-8", "ignore")[:300]
            except OSError:
                pass
            # Un point d'accès compatible OpenAI qui ne connaît pas ces options
            # répond 400 (le message ne dit pas toujours laquelle) : on réessaie
            # une fois sans elles au lieu d'abandonner.
            if e.code == 400 and options:
                options = {}
                tentatives += 1
                continue
            derniere, code = "HTTP %s%s" % (
                e.code, " : " + detail.strip()[:200] if detail.strip() else ""), e.code
            if e.code in abandonner_sur:
                break  # quota ou clé : un réessai ne changerait rien, le repli prend le relais
            if e.code in (429, 500, 502, 503) and tentatives > 0:
                time.sleep(10)
                continue
            break
        except (urllib.error.URLError, TimeoutError, OSError, ValueError) as e:
            derniere, code = str(e), None
            break
        choix = (j.get("choices") or [{}])[0] if isinstance(j, dict) else {}
        texte = ((choix.get("message") or {}).get("content") or "").strip()
        if texte:
            return texte
        fin = choix.get("finish_reason") or "inconnu"
        derniere, code = "réponse vide (finish_reason=%s)" % fin, None
        if tentatives > 0 and fin == "length":
            max_tokens *= 2  # budget mangé par la réflexion : on en redonne
            continue
        if tentatives > 0:
            time.sleep(5)
            continue
        break
    raise Echec(derniere, code)


def extraire_json(texte):
    """Premier objet JSON lisible dans une réponse, même entourée de texte."""
    dec = json.JSONDecoder()
    for i, c in enumerate(texte):
        if c != "{":
            continue
        try:
            obj, _ = dec.raw_decode(texte[i:])
            return obj
        except ValueError:
            continue
    raise ValueError("aucun objet JSON dans la réponse : %r" % ((texte or "")[:160],))


def telecharger(url, timeout=20, limite=400_000):
    """(code, texte) ; le texte est vide en cas d'échec réseau."""
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; promos-agents/1.0)",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            brut = r.read(limite)
            code = r.getcode()
    except urllib.error.HTTPError as e:
        return e.code, ""
    except (urllib.error.URLError, TimeoutError, OSError, ValueError):
        return 0, ""
    return code, brut.decode("utf-8", "ignore")


def lancer(args, timeout=300):
    r = subprocess.run(args, cwd=RACINE, capture_output=True, text=True, timeout=timeout)
    return r.returncode, (r.stdout or "") + (r.stderr or "")


def git(*args, verifier=True):
    r = subprocess.run(["git", *args], cwd=RACINE, capture_output=True, text=True)
    if verifier and r.returncode:
        raise RuntimeError("git %s : %s" % (" ".join(args), r.stderr.strip()))
    return r


def creer_pr(titre, corps, branche, base="main"):
    """Commit, push et pull request. Retourne l'URL, ou None s'il n'y a rien."""
    git("config", "user.name", "agents-promos")
    git("config", "user.email", "agents@users.noreply.github.com")
    git("add", "-A")
    if git("diff", "--cached", "--quiet", verifier=False).returncode == 0:
        log("Rien à proposer : pas de pull request.")
        return None
    if git("rev-parse", "--verify", branche, verifier=False).returncode == 0:
        git("branch", "-D", branche)
    git("checkout", "-b", branche)
    git("commit", "-m", titre)
    # Branche de l'agent uniquement : une réexécution le même jour la remplace.
    git("push", "-u", "origin", branche, "--force-with-lease")
    corps_path = RACINE / ".pr-corps.md"
    corps_path.write_text(corps, encoding="utf-8")
    code, sortie = lancer([
        "gh", "pr", "create",
        "--base", base,
        "--head", branche,
        "--title", titre,
        "--body-file", str(corps_path),
    ])
    try:
        corps_path.unlink()
    except OSError:
        pass
    if code:
        code2, url = lancer(["gh", "pr", "view", branche, "--json", "url", "-q", ".url"])
        if code2 == 0 and url.strip():
            log("Pull request déjà ouverte :", url.strip())
            return url.strip()
        log("Échec de la pull request :", sortie.strip()[:600])
        return None
    log("Pull request :", sortie.strip())
    return sortie.strip()


def titre_date(prefixe):
    return "%s %s" % (prefixe, time.strftime("%Y-%m-%d %H:%M"))
