import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, content, context, documentTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "chat":
        systemPrompt = `You are a helpful academic assistant for college students. You help them understand their course materials, answer questions, and explain concepts clearly.
        
When answering:
- Be clear and educational
- Use examples when helpful
- Reference the provided document context when relevant
- If the question isn't related to the provided materials, still try to be helpful but mention that you're providing general knowledge

Document Context:
${context || "No document context provided."}`;
        userPrompt = content;
        break;

      case "summarize":
        systemPrompt = `You are an expert at creating concise, well-structured summaries of academic content. 
        
Create a summary that:
- Captures the main points and key concepts
- Uses bullet points for easy reading
- Highlights important definitions or formulas
- Is organized logically
- Is suitable for quick review before exams`;
        userPrompt = `Please summarize the following document titled "${documentTitle || 'Untitled'}":\n\n${content}`;
        break;

      case "quiz":
        systemPrompt = `You are an expert educator who creates effective practice quizzes to test knowledge retention.

Create a quiz with exactly 5 questions based on the provided content. Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation of why this answer is correct"
    }
  ]
}

Make sure:
- Questions test understanding, not just memorization
- Options are plausible but only one is clearly correct
- Explanations are educational
- Return ONLY the JSON, no markdown code blocks`;
        userPrompt = `Create a practice quiz based on this document titled "${documentTitle || 'Untitled'}":\n\n${content}`;
        break;

      default:
        throw new Error("Invalid action");
    }

    console.log("Calling Lovable AI with action:", action);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";

    console.log("AI response received, length:", result.length);

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-assistant function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
