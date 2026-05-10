// proxy.ts – Deploy to Deno Deploy
// Environment variables required:
//   - API_KEY   : your Play.Hosting Client API key (starts with ptlc_)
//   - SERVER_ID : your server's UUID (long string from debug info)

const PLAY_HOSTING_API_BASE = "https://panel.play.hosting/api/client";
const API_KEY = Deno.env.get("API_KEY");
const SERVER_ID = Deno.env.get("SERVER_ID");

if (!API_KEY || !SERVER_ID) {
  console.error("Missing env: API_KEY, SERVER_ID");
  Deno.exit(1);
}

// CORS headers – replace with your actual frontend domain
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://pagesoftwo.xyz", // Change this to your domain
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
  "Access-Control-Allow-Credentials": "false",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  // Root path – return simple status
  if (path === "/" || path === "") {
    return new Response(
      JSON.stringify({ status: "Proxy is running", serverIdConfigured: !!SERVER_ID }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  // Only forward paths that start with /api
  if (!path.startsWith("/api")) {
    return new Response(JSON.stringify({ error: "Not found. Use /api/..." }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Remove /api prefix to get the actual API endpoint
  const endpoint = path.slice(4); // removes "/api"
  const targetUrl = `${PLAY_HOSTING_API_BASE}${endpoint}`;

  console.log(`Proxying ${req.method} request to: ${targetUrl}`);

  try {
    const proxyReq = new Request(targetUrl, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "Application/vnd.pterodactyl.v1+json",
      },
      body: req.body,
    });

    const response = await fetch(proxyReq);
    const responseBody = await response.text();

    console.log(`Response status from Play.Hosting: ${response.status}`);

    // ✅ Handle 204 No Content (success with no body – used by join-queue)
    if (response.status === 204) {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // For other responses, check if they are JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error(`Received non-JSON response. Status: ${response.status}, Body preview: ${responseBody.substring(0, 200)}`);
      return new Response(
        JSON.stringify({ error: `API returned an error (Status: ${response.status})` }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Forward successful JSON response
    return new Response(responseBody, {
      status: response.status,
      headers: { "Content-Type": contentType, ...corsHeaders },
    });
  } catch (error) {
    console.error("Proxy network error:", error);
    return new Response(
      JSON.stringify({ error: "Proxy network failure", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});