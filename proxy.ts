// proxy.ts - Deploy to Deno Deploy
const PLAY_HOSTING_API = "https://play.hosting/api/client";
const API_KEY = Deno.env.get("API_KEY");
const SERVER_ID = Deno.env.get("SERVER_ID");

if (!API_KEY || !SERVER_ID) {
  console.error("Missing env: API_KEY, SERVER_ID");
  Deno.exit(1);
}

// CORS headers – allow your GitHub Pages domain (replace with your actual URL)
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://pagesoftwo.github.io", // CHANGE THIS
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
  "Access-Control-Allow-Credentials": "false",
};

Deno.serve(async (req: Request) => {
  // Handle preflight (OPTIONS) requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  // If it's the root path, return a simple status (no forwarding to Play.Hosting)
  if (path === "/" || path === "") {
    return new Response(
      JSON.stringify({ status: "Proxy is running", serverId: SERVER_ID ? "configured" : "missing" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // Only forward paths that start with /api
  if (!path.startsWith("/api")) {
    return new Response(JSON.stringify({ error: "Not found. Use /api/..." }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Extract endpoint after /api (e.g., /api/servers/123 -> /servers/123)
  const endpoint = path.replace(/^\/api/, "");
  const targetUrl = `${PLAY_HOSTING_API}${endpoint}`;

  // Forward the request to Play.Hosting
  try {
    const proxyReq = new Request(targetUrl, {
      method: req.method,
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: req.body,
    });

    const response = await fetch(proxyReq);
    const responseBody = await response.text();
    const contentType = response.headers.get("content-type") || "application/json";

    return new Response(responseBody, {
      status: response.status,
      headers: { "Content-Type": contentType, ...corsHeaders },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(JSON.stringify({ error: "Proxy failed", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});