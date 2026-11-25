"""Outils partagés par les deux agents.

Aucun agent ne pousse sur `main` : ils travaillent sur une branche, ouvrent une
pull request et ne la fusionnent que si ses contrôles passent. Les seuils et les
interdictions restent dans le module de chaque agent, pour qu'on les lise à
l'endroit où ils s'appliquent.
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
# tout de suite au suivant quand il y en a un. Les erreurs serveur (500/502/503)
# en font partie : un incident passager chez le principal ne doit pas coûter une
# marque alors qu'un repli est configuré. Sans repli (dernier fournisseur), le
# réessai sur place reste la seule chance et `_appeler` s'en charge. Une panne de
# transport (timeout, DNS, connexion coupée) n'a pas de statut HTTP : `_appeler`
# la marque `Echec.reseau` et elle bascule de la même façon.
BASCULE = (400, 401, 403, 404, 429, 500, 502, 503)

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


# Fournisseur qui a répondu au dernier appel réussi, pour le résumé du passage.
_dernier = {}


def dernier_appel():
    return dict(_dernier)


def oublier_dernier_appel():
    """À appeler avant une nouvelle marque : le fournisseur affiché sera le sien."""
    _dernier.clear()


def a_une_cle():
    """Vrai dès qu'un fournisseur a une clé : principal ou secours.

    Un dépôt peut n'avoir que `AI_API_KEY_BACKUP` (Gemini sans clé Z.ai) ; les
    scripts ne doivent pas se croire sans clé pour autant.
    """
    return any(f["cle"] for f in fournisseurs())


def log(*args):
    print(*args, flush=True)


def resumer(markdown):
    """Ajoute un bloc au résumé du run (l'onglet Summary d'GitHub).

    Hors Actions, `GITHUB_STEP_SUMMARY` n'existe pas : le texte part alors
    seulement dans le journal, pour que les tests et un run local restent
    lisibles.
    """
    chemin = os.environ.get("GITHUB_STEP_SUMMARY")
    if chemin:
        with open(chemin, "a", encoding="utf-8") as f:
            f.write(markdown.rstrip() + "\n")
    else:
        log(markdown.rstrip())


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
    """Un fournisseur a échoué ; `code` porte le statut HTTP s'il y en a un.

    `reseau` distingue une panne de transport (timeout, DNS, connexion coupée,
    réponse illisible) d'une réponse vide : la première n'a aucun statut HTTP et
    doit basculer vers le repli comme une erreur serveur.
    """

    def __init__(self, message, code=None, reseau=False):
        super().__init__(message)
        self.code = code
        self.reseau = reseau


def appeler(system, utilisateur, temperature=0.3, max_tokens=1600, essais=2, json_mode=False):
    """Un tour de conversation, avec repli automatique. Lève RuntimeError à la fin.

    Le principal (`AI_API_*`) répond en premier. S'il refuse pour clé (401/403),
    quota (429), route ou modèle inconnu (400/404), s'il répond par une erreur
    serveur (500/502/503) ou si le transport casse (timeout, DNS, connexion
    coupée : aucun statut HTTP) et qu'un repli est configuré
    (`AI_API_KEY_BACKUP`), la main passe au suivant sans attendre les réessais —
    inutiles quand la limite est journalière, et risqués quand le service est
    momentanément en panne. Le journal nomme chaque fournisseur essayé et celui
    qui a répondu, pour qu'un run vert ne laisse rien deviner.
    """
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": utilisateur},
    ]
    liste = fournisseurs()
    problemes = []
    dernier_code, dernier_reseau = None, False
    for i, f in enumerate(liste):
        dernier = i + 1 == len(liste)
        try:
            texte = _appeler(f, messages, temperature, max_tokens, essais, json_mode,
                             abandonner_sur=() if dernier else BASCULE)
        except Echec as e:
            problemes.append("%s : %s" % (f["nom"], e))
            dernier_code, dernier_reseau = e.code, e.reseau
            # Une panne de transport n'a pas de statut : elle compte comme une
            # erreur serveur, sinon un simple timeout perdrait la marque alors
            # qu'un repli est configuré.
            if not dernier and (e.reseau or e.code in BASCULE):
                log("%s indisponible (%s) → repli sur %s." % (f["nom"], e, liste[i + 1]["nom"]))
                continue
            # `Echec` est un `RuntimeError` : les appelants qui attrapent
            # RuntimeError continuent de fonctionner, et `code` reste lisible.
            raise Echec("appel au modèle impossible (%s)" % " ; ".join(problemes),
                        dernier_code, reseau=dernier_reseau)
        if i:
            log("Réponse de %s (%s), après l'échec de %s." % (f["nom"], f["modele"], liste[0]["nom"]))
        else:
            log("Réponse de %s (%s)." % (f["nom"], f["modele"]))
        _dernier.update(nom=f["nom"], modele=f["modele"])
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
    derniere, code, reseau = "inconnue", None, False
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
                break  # quota, clé ou serveur en panne : le repli prend le relais
            if e.code in (429, 500, 502, 503) and tentatives > 0:
                # Dernier fournisseur seulement : sans repli, réessayer est la
                # seule chance que la marque ne soit pas perdue.
                time.sleep(10)
                continue
            break
        except (urllib.error.URLError, TimeoutError, OSError, ValueError) as e:
            # Timeout, DNS, connexion coupée ou réponse illisible : aucun statut
            # HTTP, mais rien ne dit que le fournisseur de secours échouera.
            derniere, code, reseau = str(e), None, True
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
    raise Echec(derniere, code, reseau=reseau)


def diagnostic_fournisseurs():
    """Un appel minimal par fournisseur : qui répond, et en combien de temps.

    Une photo, pas une bataille : un seul essai par fournisseur, pour que le
    diagnostic dure quelques secondes même quand tout est à terre. Un
    fournisseur sans clé est signalé sans être appelé (un 401 ne dirait rien
    de plus).
    """
    messages = [
        {"role": "system", "content": "Réponds par un seul mot, sans phrase."},
        {"role": "user", "content": "Écris : ok"},
    ]
    resultats = []
    for f in fournisseurs():
        depart = time.monotonic()
        if not f["cle"]:
            resultats.append({"nom": f["nom"], "modele": f["modele"], "ok": False,
                              "detail": "aucune clé configurée", "duree": 0.0})
            continue
        try:
            _appeler(f, messages, temperature=0, max_tokens=16, essais=1,
                     json_mode=False, abandonner_sur=BASCULE)
            ok, detail = True, "—"
        except Echec as e:
            ok, detail = False, str(e)
        resultats.append({"nom": f["nom"], "modele": f["modele"], "ok": ok,
                          "detail": detail, "duree": time.monotonic() - depart})
    return resultats


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


def pousser_branche(branche, essais=2):
    """Pousse la branche, en ne forçant que sur une distante réellement lue.

    `--force-with-lease` compare la distante à la référence de suivi locale :
    dans un clone superficiel (celui d'`actions/checkout`) cette référence
    n'existe pas, et git refuse alors le push en « stale info » dès qu'une
    exécution précédente a déjà poussé la branche du jour. On récupère donc la
    distante avant chaque essai et on donne le commit attendu explicitement.
    Sans distante, le push est ordinaire : rien à écraser, et il échoue plutôt
    que d'écraser une branche créée entre-temps par une autre exécution.
    """
    suivi = "refs/remotes/origin/" + branche
    for essai in range(essais):
        git("fetch", "--depth=1", "origin",
            "+refs/heads/%s:%s" % (branche, suivi), verifier=False)
        lue = git("rev-parse", "--verify", "--quiet", suivi, verifier=False)
        args = ["push", "-u", "origin", branche]
        if lue.returncode == 0 and lue.stdout.strip():
            args.append("--force-with-lease=refs/heads/%s:%s" % (branche, lue.stdout.strip()))
        try:
            git(*args)
            return
        except RuntimeError:
            if essai + 1 >= essais:
                raise
            log("Push refusé sur %s, nouvelle tentative après relecture de la distante." % branche)


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
    pousser_branche(branche)
    corps_path = RACINE / ".pr-corps.md"
    corps_path.write_text(corps, encoding="utf-8")
    try:
        code, sortie = lancer([
            "gh", "pr", "create",
            "--base", base,
            "--head", branche,
            "--title", titre,
            "--body-file", str(corps_path),
        ])
        if not code:
            log("Pull request :", sortie.strip())
            return sortie.strip()
        return actualiser_pr(branche, corps_path, sortie.strip())
    finally:
        try:
            corps_path.unlink()
        except OSError:
            pass


def actualiser_pr(branche, corps_path, echec=""):
    """PR déjà ouverte : son corps reçoit le texte du passage, pas celui d'avant.

    `gh pr create` échoue quand la branche du jour a déjà sa pull request ;
    sans cette mise à jour, le corps restait celui de la première exécution et
    pouvait annoncer « aucune fiche » alors que les suivantes en ont produit.
    Une PR déjà fusionnée ou fermée n'est pas retouchée : son corps appartient
    à l'historique. Retourne l'URL, ou None si la branche n'a pas de pull request.
    """
    code, sortie = lancer(["gh", "pr", "view", branche, "--json", "state,url",
                           "-q", '.state + " " + .url'])
    etat, _, url = sortie.strip().partition(" ")
    url = url.strip()
    if code or not url:
        log("Échec de la pull request :", (echec or url)[:600])
        return None
    if etat.upper() != "OPEN":
        log("Pull request déjà %s, corps laissé tel quel : %s"
            % ("fusionnée" if etat.upper() == "MERGED" else "fermée", url))
        return url
    code, sortie = lancer(["gh", "pr", "edit", branche, "--body-file", str(corps_path)])
    if code:
        log("Pull request déjà ouverte, corps non mis à jour :", url)
        log(sortie.strip()[:600])
    else:
        log("Pull request déjà ouverte, corps mis à jour :", url)
    return url


def etat_pr(branche):
    """État de la PR ouverte sur cette branche : « OPEN », « MERGED », « CLOSED ».

    None quand il n'y a pas de PR — ou quand `gh` ne répond pas (poste local
    sans authentification) : on ne bloque pas un run pour ça.
    """
    code, sortie = lancer(["gh", "pr", "view", branche, "--json", "state",
                           "-q", ".state"])
    etat = sortie.strip().upper()
    if code or etat not in ("OPEN", "MERGED", "CLOSED"):
        return None
    return etat


def branche_libre(base, essais=9):
    """La branche du jour, ou la première variante dont la PR est encore utile.

    Une PR fusionnée (ou fermée) garde son nom : repousser dessus ne créerait
    pas de nouvelle PR — `gh pr create` refuse, et le corps d'une PR morte
    serait réécrit. On prend donc `base-2`, `base-3`… pour une PR neuve.
    Après une fusion avec suppression de branche, le nom de base est libre et
    `gh` ne retrouve plus la PR : la première exécution d'une journée le réutilise.
    """
    nom = base
    for n in range(2, essais + 2):
        etat = etat_pr(nom)
        if etat not in ("MERGED", "CLOSED"):
            return nom
        nom = "%s-%d" % (base, n)
        log("PR de %s déjà %s : nouvelle branche %s pour une PR neuve."
            % (base, "fusionnée" if etat == "MERGED" else "fermée", nom))
    return nom


def controles(rollup):
    """(contrôles en attente, contrôles en échec) d'un `statusCheckRollup`.

    Un contrôle peut être un check run (statut + conclusion) ou un statut
    d'ancienne génération (`state`). Un `SKIPPED` ou un `NEUTRAL` ne bloque pas.
    """
    en_attente, echecs = [], []
    for ctl in rollup or []:
        if not isinstance(ctl, dict):
            continue
        nom = ctl.get("name") or ctl.get("context") or "contrôle"
        if "status" in ctl or "conclusion" in ctl:
            if (ctl.get("status") or "").upper() not in ("", "COMPLETED"):
                en_attente.append(nom)
            elif (ctl.get("conclusion") or "").upper() not in (
                    "", "SUCCESS", "NEUTRAL", "SKIPPED"):
                echecs.append(nom)
        else:
            etat = (ctl.get("state") or "").upper()
            if etat in ("", "PENDING", "EXPECTED"):
                en_attente.append(nom)
            elif etat != "SUCCESS":
                echecs.append(nom)
    return en_attente, echecs


def fusionner_pr(branche, attente=900, pause=20):
    """Fusionne la PR en squash dès que ses contrôles sont verts.

    Les contrôles peuvent n'arriver qu'après la création de la PR : on attend,
    sans dépasser `attente` secondes. Un contrôle en échec arrête tout de suite —
    fusionner malgré un rouge serait justement ce qu'on veut éviter. Sans aucun
    contrôle (le cas de ce dépôt), la fusion part immédiatement, avec quelques
    réessais le temps que GitHub calcule la fusionnabilité.

    Retourne un état lisible : « fusionnée », « contrôles en échec : … »,
    « contrôles toujours en attente : … », « fusion refusée : … », « PR fermée
    sans fusion » ou « PR illisible : … ». L'appelant en fait un succès ou un
    échec du run, plutôt que de laisser croire que `main` a reçu les données.
    """
    echeance = time.monotonic() + attente
    refus = ""
    while True:
        code, sortie = lancer(["gh", "pr", "view", branche, "--json",
                               "state,statusCheckRollup"])
        try:
            info = None if code else json.loads(sortie)
        except ValueError:
            info = None
        if not isinstance(info, dict):
            return "PR illisible : %s" % ((sortie.strip() or "aucune réponse de gh")[:200])
        etat = (info.get("state") or "").upper()
        if etat == "MERGED":
            return "fusionnée"
        if etat == "CLOSED":
            return "PR fermée sans fusion"
        en_attente, echecs = controles(info.get("statusCheckRollup"))
        if echecs:
            return "contrôles en échec : %s" % ", ".join(echecs[:5])
        if not en_attente:
            code, sortie = lancer(["gh", "pr", "merge", branche, "--squash",
                                   "--delete-branch"])
            if not code:
                log("Pull request fusionnée dans main :", branche)
                return "fusionnée"
            refus = ((sortie.strip().splitlines() or [""])[-1])[:200]
            log("Fusion refusée pour l'instant :", refus or "raison inconnue")
        if time.monotonic() >= echeance:
            if en_attente:
                return "contrôles toujours en attente : %s" % ", ".join(en_attente[:5])
            return "fusion refusée : %s" % (refus or "raison inconnue")
        if en_attente:
            log("Contrôles en attente (%s) : nouvelle vérification dans %d s."
                % (", ".join(en_attente[:5]), pause))
        time.sleep(pause)


def titre_date(prefixe):
    return "%s %s" % (prefixe, time.strftime("%Y-%m-%d %H:%M"))
