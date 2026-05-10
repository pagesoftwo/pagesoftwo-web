// proxy.ts – with corrected Accept header and logging
const PLAY_HOSTING_API_BASE = "https://panel.play.hosting/api/client";
const API_KEY = Deno.env.get("API_KEY");
const SERVER_ID = Deno.env.get("SERVER_ID");

if (!API_KEY || !SERVER_ID) {
  console.error("Missing env: API_KEY, SERVER_ID");
  Deno.exit(1);
}

// CORS headers – Replace this with your actual GitHub Pages URL
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://pagesoftwo.xyz",
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

  // Respond with a simple status for the root path
  if (path === "/" || path === "") {
    return new Response(
      JSON.stringify({ status: "Proxy is running", serverIdConfigured: !!SERVER_ID }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  // Only handle requests starting with /api
  if (!path.startsWith("/api")) {
    return new Response(JSON.stringify({ error: "Not found. Use /api/..." }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Build the destination URL for Play.Hosting
  const endpoint = path.slice(4); // Remove the "/api" prefix
  const targetUrl = `${PLAY_HOSTING_API_BASE}${endpoint}`;

  // Log the request for debugging
  console.log(`Proxying ${req.method} request to: ${targetUrl}`);

  try {
    const proxyReq = new Request(targetUrl, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        // 🔑 THE CRITICAL FIX: This is the Accept header the API expects for a proper JSON response.
        "Accept": "Application/vnd.pterodactyl.v1+json", 
      },
      body: req.body,
    });

    const response = await fetch(proxyReq);
    const responseBody = await response.text();

    // Log the response status for debugging
    console.log(`Response status from Play.Hosting: ${response.status}`);

    // Forward the response regardless of content type, but log if it's not JSON.
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error(`Received non-JSON response. Status: ${response.status}, Body: ${responseBody.substring(0, 500)}`);
      // Return a clean error to your frontend
      return new Response(
        JSON.stringify({ error: `API returned an error (Status: ${response.status})` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(responseBody, {
      status: response.status,
      headers: { "Content-Type": contentType, ...corsHeaders },
    });
  } catch (error) {
    console.error("Proxy network error:", error);
    return new Response(JSON.stringify({ error: "Proxy network failure", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});