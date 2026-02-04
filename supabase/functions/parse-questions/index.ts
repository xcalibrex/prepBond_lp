import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("Hello from Functions!")

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Ensure "Content-Type" header is present if needed, though usually standard fetch handles it.
        // We will return corsHeaders on all responses.

        const { rawText } = await req.json()

        if (!rawText) {
            throw new Error('Missing rawText in request body')
        }

        const openAiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openAiKey) {
            console.error('Missing OPENAI_API_KEY')
            // Return a distinct error we can ask the user about
            throw new Error('OPENAI_API_KEY is not set in Supabase Secrets')
        }

        // Call OpenAI
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openAiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful assistant that parses raw text into valid JSON for a practice test app.
            
            Output a JSON object with a single key "questions" containing an array of question objects.
            
            The schema for each question object is:
            {
              "question_text": string,
              "type": "MCQ" | "SCENARIO" | "EMOTION_ORDER" | "LIKERT_GRID" | "SLIDING_SCALE",
              "scenario_context": string | null,
              "scenario_image_url": string | null,
              "explanation": string | null,
              "options": [
                { "label": "A", "value": string },
                { "label": "B", "value": string },
                ...
              ],
              "correct_option_label": "A" | "B" | "C" | "D" | "E" | null,
              "correct_answer": string | null
            }

            Parsing Rules:
            1. **type**:
               - If the text mentions "Scenario" or has a long story context, use "SCENARIO".
               - If the text starts with "Item X: Simple" or just a question, use "MCQ".
            2. **scenario_image_url**:
               - Look for lines starting with "Image:", "Image Prompt:", or "URL:". Extract the URL.
            3. **options**:
               - Parse options like "A) ...", "B) ...". 
               - **Handle options listed on a single line** (e.g. "A) Apple B) Banana") or multiple lines.
               - If options are not explicitly labeled A/B, generate labels.
            4. **correct_answer**:
               - If the answer is given (e.g. "Correct Answer: B"), map it to "correct_option_label" if it matches an option context.
            
            Example Input:
            Item 1: Simple (Sadness)
            Question: ...
            Image: https://...
            Answer Options: A) ... B) ...
            Correct Answer: B) Sadness
            
            Output:
            {
              "type": "MCQ",
              "question_text": "...",
              "scenario_image_url": "https://...",
              "options": [{ "label": "A", "value": "..." }, { "label": "B", "value": "Sadness" }],
              "correct_option_label": "B"
            }
            `
                    },
                    {
                        role: 'user',
                        content: rawText
                    }
                ],
                temperature: 0.1
            })
        })

        const aiData = await response.json()

        if (aiData.error) {
            console.error('OpenAI API Error:', JSON.stringify(aiData.error))
            throw new Error(`OpenAI Error: ${aiData.error.message}`)
        }

        // Verify content existence
        if (!aiData.choices || !aiData.choices[0] || !aiData.choices[0].message) {
            console.error('Unexpected OpenAI Response:', JSON.stringify(aiData))
            throw new Error('OpenAI returned an unexpected response structure')
        }

        const content = aiData.choices[0].message.content
        let parsed
        try {
            parsed = JSON.parse(content)
        } catch (e) {
            console.error("JSON Parse Error. Content:", content)
            throw new Error("Failed to parse AI response as JSON")
        }

        if (!parsed.questions || !Array.isArray(parsed.questions)) {
            console.error("Invalid Structure:", parsed)
            throw new Error("AI returned invalid structure (missing questions array)")
        }

        return new Response(JSON.stringify({ questions: parsed.questions }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error("Function Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
