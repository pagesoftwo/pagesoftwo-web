// proxy.ts – Corrected and Secured
const PLAY_HOSTING_API_BASE = "https://play.hosting/api/client"; // The endpoint for the Client API
const API_KEY = Deno.env.get("API_KEY");
const SERVER_ID = Deno.env.get("SERVER_ID");

if (!API_KEY || !SERVER_ID) {
  console.error("Missing env: API_KEY, SERVER_ID");
  Deno.exit(1);
}

// CORS headers – Replace this with your actual GitHub Pages URL
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://pagesoftwo.github.io",
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

  // 🔧 THE CRITICAL FIX: Build the destination URL for Play.Hosting
  // This removes the leading "/api" and correctly appends the rest of the path.
  const endpoint = path.slice(4); // Remove the "/api" prefix
  const targetUrl = `${PLAY_HOSTING_API_BASE}${endpoint}`;

  // Log the request for debugging (these logs will appear in your Deno Deploy's "View Logs" section)
  console.log(`Proxying ${req.method} request to: ${targetUrl}`);

  try {
    const proxyReq = new Request(targetUrl, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: req.body,
    });

    const response = await fetch(proxyReq);
    const responseBody = await response.text();

    // Log the response status for debugging
    console.log(`Response status from Play.Hosting: ${response.status}`);

    // Determine the content type to return correctly
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error(`Received non-JSON response. Status: ${response.status}, Body: ${responseBody}`);
      // Forward the error status but provide a cleaner error message to your frontend
      return new Response(
        JSON.stringify({ error: `API returned an error (Status: ${response.status})` }),
        {
          status: response.status,
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