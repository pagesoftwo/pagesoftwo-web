import fetch from "node-fetch";

export const handler = async (event) => {
  try {
    const prompt = event.queryStringParameters.prompt || "Hello!";

    const apiKey = process.env.OPENAI_API_KEY; // 🔐 secret key stays hidden!

    // Create the request to OpenAI (using gpt-4.1-mini or 5.1 if you prefer)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: data.choices?.[0]?.message?.content || "No response"
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err) })
    };
  }
};
