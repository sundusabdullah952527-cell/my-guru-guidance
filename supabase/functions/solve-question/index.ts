import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert teacher for Indian students (Class 9 to College level).

Your task is to solve the given problem clearly and step-by-step.

Rules:
1. First, rewrite the question clearly under a "## Question" heading.
2. Identify the subject and topic under "## Subject & Topic".
3. Solve it step by step under "## Step-by-Step Solution".
4. Show all formulas used in bold or code blocks.
5. Explain each step in simple language.
6. If it is math, show calculations line by line.
7. If it is physics/chemistry, mention given values and required value clearly.
8. If it is coding, explain the logic and provide corrected/working code.
9. Highlight the final answer clearly under "## Final Answer" using bold text.
10. Keep explanation simple enough for a Class 9 student to understand.
11. Use markdown formatting extensively for readability.

If the question is unclear or incomplete, politely say:
"The question is unclear. Please try rephrasing or uploading a clearer photo."`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, subject, level, image } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build messages
    const userContent: any[] = [];
    
    if (image) {
      userContent.push({
        type: "image_url",
        image_url: { url: image },
      });
      userContent.push({
        type: "text",
        text: question
          ? `The student uploaded this image of a question. Additional context: "${question}". Subject: ${subject || "Auto-detect"}. Level: ${level || "Auto-detect"}.`
          : `The student uploaded this image of a question. Please read it and solve it. Subject: ${subject || "Auto-detect"}. Level: ${level || "Auto-detect"}.`,
      });
    } else {
      userContent.push({
        type: "text",
        text: `Subject: ${subject || "Auto-detect"}\nLevel: ${level || "Auto-detect"}\n\nQuestion:\n${question}`,
      });
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userContent },
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Failed to get solution. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("solve-question error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
