import OpenAI from "openai";

export default async (req) => {
  try {
    const body = await req.json();

    const client = new OpenAI();

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: body.message }
      ]
    });

    return new Response(
      JSON.stringify({ reply: response.choices[0].message.content }),
      { status: 200 }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500 }
    );
  }
};
