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


def appeler(system, utilisateur, temperature=0.3, max_tokens=1600, essais=2, json_mode=False):
    """Un tour de conversation. Lève RuntimeError après le dernier échec.

    La réflexion est désactivée : les modèles GLM récents raisonnent avant de
    répondre, et cette réflexion peut manger tout `max_tokens` au point de
    renvoyer un `content` vide. `json_mode` demande en plus une sortie JSON.
    """
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": utilisateur},
    ]
    options = {"thinking": {"type": "disabled"}}
    if json_mode:
        options["response_format"] = {"type": "json_object"}

    def corps():
        charge = {
            "model": modele(),
            "temperature": temperature,
            "max_tokens": max_tokens,
            "messages": messages,
        }
        charge.update(options)
        return json.dumps(charge).encode("utf-8")

    url = base_api().rstrip("/") + "/chat/completions"
    derniere = "inconnue"
    tentatives = essais
    while tentatives > 0:
        tentatives -= 1
        req = urllib.request.Request(
            url,
            data=corps(),
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer " + cle_api(),
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
            # répond 400 : on réessaie sans elles au lieu d'abandonner.
            if e.code == 400 and options and any(
                    m in detail for m in ("thinking", "response_format", "json_object")):
                options = {}
                tentatives += 1
                continue
            derniere = "HTTP %s%s" % (e.code, " : " + detail.strip()[:200] if detail.strip() else "")
            if e.code in (429, 500, 502, 503) and tentatives > 0:
                time.sleep(10)
                continue
            break
        except (urllib.error.URLError, TimeoutError, OSError, ValueError) as e:
            derniere = str(e)
            break
        choix = (j.get("choices") or [{}])[0] if isinstance(j, dict) else {}
        texte = ((choix.get("message") or {}).get("content") or "").strip()
        if texte:
            return texte
        fin = choix.get("finish_reason") or "inconnu"
        derniere = "réponse vide (finish_reason=%s)" % fin
        if tentatives > 0 and fin == "length":
            max_tokens *= 2  # budget mangé par la réflexion : on en redonne
            continue
        if tentatives > 0:
            time.sleep(5)
            continue
        break
    raise RuntimeError("appel au modèle impossible (%s)" % derniere)


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
