/**
 * Custom Sucrette - Gallery Worker
 * Cloudflare Worker : proxy sécurisé entre le site et l'API GitHub Issues
 *
 * Variables d'environnement à configurer dans Cloudflare :
 *   GITHUB_TOKEN  → ton Personal Access Token GitHub (scope: public_repo)
 *   GITHUB_OWNER  → ton username GitHub (ex: monpseudo)
 *   GITHUB_REPO   → nom du repo (ex: custom-sucrette)
 *   ALLOWED_ORIGIN → URL de ton site déployé (ex: https://monsite.com)
 */

// ─── Rate limiting simple (par IP, en mémoire) ────────────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 3; // max soumissions
const RATE_LIMIT_WINDOW = 60000; // par minute (ms)

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.firstRequest > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, firstRequest: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) return true;

  entry.count++;
  return false;
}

// ─── CORS headers ─────────────────────────────────────────────────────────────
function corsHeaders(env, requestOrigin) {
  const allowed = env.ALLOWED_ORIGIN || "*";
  // Accepte l'origine exacte ou * en dev
  const origin =
    allowed === "*" || requestOrigin === allowed ? requestOrigin || "*" : allowed;

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

// ─── Validation du contenu ────────────────────────────────────────────────────
function validate(body) {
  const { pseudo, code, message = "" } = body;

  if (!pseudo || typeof pseudo !== "string" || pseudo.trim().length === 0)
    return "Le pseudo est requis.";
  if (pseudo.trim().length > 30) return "Le pseudo ne peut pas dépasser 30 caractères.";
  if (!code || typeof code !== "string" || code.trim().length < 5)
    return "Le code de tenue est invalide.";
  if (code.trim().length > 500) return "Le code est trop long.";
  if (typeof message !== "string" || message.length > 200)
    return "Le message ne peut pas dépasser 200 caractères.";

  // Vérification basique que ça ressemble à un code de tenue
  const codeClean = code.trim();
  if (!/^[123]i/.test(codeClean))
    return "Le code ne semble pas être un code de tenue valide (doit commencer par 1i, 2i ou 3i).";

  return null;
}

// ─── Handler principal ────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(env, origin);

    // Preflight CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    // ── GET /outfits ── Récupérer les tenues ──────────────────────────────────
    if (request.method === "GET" && url.pathname === "/outfits") {
      const page = parseInt(url.searchParams.get("page") || "1");
      const perPage = 32;

      const ghRes = await fetch(
        `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/issues?state=open&labels=tenue&per_page=${perPage}&page=${page}&sort=created&direction=desc`,
        {
          headers: {
            Authorization: `Bearer ${env.GITHUB_TOKEN}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "CustomSucrette-Gallery",
          },
        },
      );

      if (!ghRes.ok) {
        return json({ error: "Erreur lors de la récupération des tenues." }, 502, cors);
      }

      const issues = await ghRes.json();

      // Transformer les issues en tenues
      const outfits = issues.map((issue) => {
        let data = {};
        try {
          // Le body de l'issue contient le JSON de la tenue
          data = JSON.parse(issue.body);
        } catch (e) {}

        return {
          id: issue.number,
          pseudo: data.pseudo || issue.title,
          code: data.code || "",
          message: data.message || "",
          date: issue.created_at,
        };
      });

      // Récupérer le total pour la pagination (header Link de GitHub)
      const linkHeader = ghRes.headers.get("Link") || "";
      const lastMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
      const totalPages = lastMatch ? parseInt(lastMatch[1]) : page;

      return json({ outfits, totalPages, currentPage: page }, 200, cors);
    }

    // ── POST /submit ── Soumettre une tenue ───────────────────────────────────
    if (request.method === "POST" && url.pathname === "/submit") {
      // Rate limiting
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      if (isRateLimited(ip)) {
        return json({ error: "Trop de soumissions. Réessaie dans une minute." }, 429, cors);
      }

      let body;
      try {
        body = await request.json();
      } catch (e) {
        return json({ error: "Corps de requête invalide." }, 400, cors);
      }

      // Validation
      const validationError = validate(body);
      if (validationError) {
        return json({ error: validationError }, 400, cors);
      }

      const { pseudo, code, message = "" } = body;

      // Créer l'issue GitHub
      const issueBody = JSON.stringify({
        pseudo: pseudo.trim(),
        code: code.trim(),
        message: message.trim(),
      });

      const ghRes = await fetch(
        `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/issues`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.GITHUB_TOKEN}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "CustomSucrette-Gallery",
          },
          body: JSON.stringify({
            title: `[Tenue] ${pseudo.trim()}`,
            body: issueBody,
            labels: ["tenue"],
          }),
        },
      );

      if (!ghRes.ok) {
        const err = await ghRes.json().catch(() => ({}));
        console.error("GitHub error:", err);
        return json({ error: "Erreur lors de la publication. Réessaie plus tard." }, 502, cors);
      }

      const issue = await ghRes.json();
      return json({ success: true, id: issue.number }, 201, cors);
    }

    // 404 pour tout le reste
    return json({ error: "Route introuvable." }, 404, cors);
  },
};
