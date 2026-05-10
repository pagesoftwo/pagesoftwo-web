// proxy.ts - Deploy this to Deno Deploy
// Environment variables required:
//   - PLAY_HOSTING_API_KEY : your Pterodactyl client API key
//   - SERVER_ID            : your Play.Hosting server ID

const PLAY_HOSTING_API_BASE = "https://play.hosting/api/client";
const API_KEY = Deno.env.get("PLAY_HOSTING_API_KEY");
const SERVER_ID = Deno.env.get("SERVER_ID");

if (!API_KEY || !SERVER_ID) {
  console.error("Missing required environment variables: PLAY_HOSTING_API_KEY, SERVER_ID");
  Deno.exit(1);
}

// CORS headers to allow your frontend (GitHub Pages) to call this proxy
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Restrict to your domain in production, e.g. "https://yourname.github.io"
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Allow-Credentials": "false",
};

Deno.serve(async (req: Request) => {
  // Handle preflight (OPTIONS) requests for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  // Extract the path after /api/... e.g., /servers/123/power
  const endpoint = url.pathname.replace(/^\/api/, "");
  const targetUrl = `${PLAY_HOSTING_API_BASE}${endpoint}`;

  // Forward the original request body (if any) and method
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${API_KEY}`);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  const proxyReq = new Request(targetUrl, {
    method: req.method,
    headers: headers,
    body: req.body,
  });

  try {
    const response = await fetch(proxyReq);
    const responseBody = await response.text();

    // Return the proxied response with CORS headers
    const responseHeaders = new Headers({
      "Content-Type": response.headers.get("Content-Type") || "application/json",
      ...corsHeaders,
    });

    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return new Response(JSON.stringify({ error: "Proxy failed", details: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});