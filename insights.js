// Vercel serverless function.
// Keeps your Anthropic API key on the server — never sent to the browser.
// Set ANTHROPIC_API_KEY in your Vercel project's Environment Variables.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not set on the server" });
  }

  const snapshot = req.body;

  const systemPrompt = `You are an Indian personal finance coach ("Personal CFO"). Given a JSON financial snapshot, respond with STRICT JSON only, no markdown fences, no preamble, matching exactly this shape:
{"verdict": "WEALTH_BUILDING" | "WEALTH_LEAKING" | "SALARY_ROTATING", "summary": "2-3 punchy Hinglish sentences in an Indian financial coach tone", "recommendations": ["imperative action item under 20 words in Hinglish", "..." ]}
Give 3 to 5 recommendations. Base the verdict on the numbers, not just the red flags list.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: JSON.stringify(snapshot) }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: "Anthropic API error", detail: errText });
    }

    const json = await response.json();
    const textBlocks = (json.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const cleaned = textBlocks.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: "Failed to generate insights", detail: String(e) });
  }
}
