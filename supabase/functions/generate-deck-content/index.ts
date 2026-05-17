// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4";

type GenerateRequestBody = {
  deck_id?: string;
};

type GeneratedCard = {
  front: string;
  back: string;
  explanation: string;
  difficulty: number;
  tags: string[];
};

type GeneratedQuestion = {
  type: "mcq" | "fill_in_the_blank" | "true_false" | "short_answer";
  question: string;
  correct_answer: string | string[];
  wrong_answers: string[];
  difficulty: number;
  time_limit: number;
};

type GeneratedDeckContent = {
  cards: GeneratedCard[];
  questions: GeneratedQuestion[];
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function getOptionalEnv(name: string, fallback: string) {
  return Deno.env.get(name) || fallback;
}

function asNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Generated ${field} must be a non-empty string.`);
  }
  return value.trim();
}

function asDifficulty(value: unknown): number {
  if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 5) {
    throw new Error("Generated difficulty must be an integer from 1 to 5.");
  }
  return value as number;
}

function asTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new Error("Generated card tags must be an array.");
  }
  return value
    .map((tag) => asNonEmptyString(tag, "tag").toLowerCase())
    .filter((tag, index, tags) => tags.indexOf(tag) === index)
    .slice(0, 8);
}

function asCorrectAnswer(value: unknown): string | string[] {
  if (typeof value === "string") return asNonEmptyString(value, "correct_answer");
  if (Array.isArray(value)) {
    const answers = value.map((a) => asNonEmptyString(a, "correct_answer"));
    if (!answers.length) throw new Error("Generated correct_answer array cannot be empty.");
    return answers;
  }
  throw new Error("Generated correct_answer must be a string or string array.");
}

function parseJsonContent(content: string): unknown {
  const trimmed = content.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(withoutFence);
}

function getDefaultTimeLimit(type: string): number {
  switch (type) {
    case "true_false": return 10;
    case "mcq": return 15;
    case "fill_in_the_blank": return 20;
    case "short_answer": return 30;
    default: return 15;
  }
}

// Normalize common AI type alias mistakes
function normalizeType(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (lower === "mcp" || lower === "multiple_choice" || lower === "multiple-choice") return "mcq";
  return lower;
}

// Convert booleans and casing variants to "True" / "False"
function normalizeTrueFalseAnswer(value: unknown): "True" | "False" | null {
  if (value === true || value === "true" || value === "True" || value === "TRUE" || value === "T" || value === "yes") return "True";
  if (value === false || value === "false" || value === "False" || value === "FALSE" || value === "F" || value === "no") return "False";
  return null;
}

function validateGeneratedContent(value: unknown): GeneratedDeckContent {
  if (!value || typeof value !== "object") {
    throw new Error("AI response must be a JSON object.");
  }

  const obj = value as Record<string, unknown>;
  const cardsInput = obj.cards;
  const questionsInput = obj.questions;

  if (!Array.isArray(cardsInput) || cardsInput.length < 1 || cardsInput.length > 30) {
    throw new Error("AI response must include 1 to 30 cards.");
  }
  if (!Array.isArray(questionsInput) || questionsInput.length < 1 || questionsInput.length > 20) {
    throw new Error("AI response must include 1 to 20 questions.");
  }

  const cards = cardsInput.map((card: unknown) => {
    const c = card as Record<string, unknown>;
    return {
      front: asNonEmptyString(c?.front, "card.front"),
      back: asNonEmptyString(c?.back, "card.back"),
      explanation: asNonEmptyString(c?.explanation, "card.explanation"),
      difficulty: asDifficulty(c?.difficulty),
      tags: asTags(c?.tags),
    };
  });

  const VALID_TYPES = ["mcq", "fill_in_the_blank", "true_false", "short_answer"] as const;

  const questions = questionsInput.map((question: unknown, i: number) => {
    const q = question as Record<string, unknown>;

    const rawType = asNonEmptyString(q?.type, `question[${i}].type`);
    const type = normalizeType(rawType);

    if (!VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
      throw new Error(`Unsupported question type: "${type}" (question ${i + 1}).`);
    }

    const questionText = asNonEmptyString(q?.question, `question[${i}].question`);
    const difficulty = asDifficulty(q?.difficulty);

    // Time limit: use type-appropriate default, clamp to 5–90 s
    const rawTL = q?.time_limit;
    const defaultTL = getDefaultTimeLimit(type);
    const time_limit = (Number.isInteger(rawTL) && (rawTL as number) > 0)
      ? Math.max(5, Math.min(90, rawTL as number))
      : defaultTL;

    let correct_answer: string | string[];
    let wrong_answers: string[];

    if (type === "true_false") {
      const normalized = normalizeTrueFalseAnswer(q?.correct_answer);
      if (!normalized) {
        throw new Error(
          `true_false correct_answer must be "True" or "False" (question ${i + 1}, got: ${JSON.stringify(q?.correct_answer)}).`,
        );
      }
      correct_answer = normalized;
      // Auto-fill the opposite value regardless of what AI sent
      wrong_answers = [normalized === "True" ? "False" : "True"];

    } else if (type === "mcq") {
      if (typeof q?.correct_answer !== "string" || !q.correct_answer.trim()) {
        throw new Error(`MCQ correct_answer must be a non-empty string (question ${i + 1}).`);
      }
      correct_answer = (q.correct_answer as string).trim();
      const correctNorm = correct_answer.toLowerCase();

      const rawWrong = Array.isArray(q?.wrong_answers)
        ? (q.wrong_answers as unknown[]).map((w) => asNonEmptyString(w, "wrong_answer"))
        : [];

      // Dedup; exclude anything that matches the correct answer
      const seen = new Set<string>();
      wrong_answers = [];
      for (const w of rawWrong) {
        const key = w.toLowerCase();
        if (key !== correctNorm && !seen.has(key)) {
          seen.add(key);
          wrong_answers.push(w);
        }
      }

      if (wrong_answers.length !== 3) {
        throw new Error(
          `MCQ must have exactly 3 distinct wrong answers (question ${i + 1}, found ${wrong_answers.length}).`,
        );
      }

    } else {
      // fill_in_the_blank or short_answer
      if (type === "fill_in_the_blank" && !/_{2,}/.test(questionText)) {
        throw new Error(
          `fill_in_the_blank question must contain "____" as a blank marker (question ${i + 1}).`,
        );
      }
      correct_answer = asCorrectAnswer(q?.correct_answer);
      wrong_answers = []; // always empty for text-input types
    }

    return {
      type: type as typeof VALID_TYPES[number],
      question: questionText,
      correct_answer,
      wrong_answers,
      difficulty,
      time_limit,
    };
  });

  return { cards, questions };
}

function buildPrompt(
  deck: { title: string; description: string | null; source_text: string },
  isRetry = false,
): string {
  const sourceLength = deck.source_text.length;
  const cardTarget = sourceLength > 5000 ? "20 to 30" : sourceLength > 1500 ? "12 to 20" : "10 to 14";
  const questionTarget = sourceLength > 5000 ? "12 to 20" : sourceLength > 1500 ? "8 to 14" : "5 to 8";

  let diversityRule: string;
  if (sourceLength <= 1500) {
    diversityRule = `- Generate ${questionTarget} questions.
- Use at least 2 different question types.
- Include at least 1 MCQ, 1 true_false, and 1 fill_in_the_blank or short_answer.
- No single type should make up more than 50% of the total.`;
  } else if (sourceLength <= 5000) {
    diversityRule = `- Generate ${questionTarget} questions.
- Include all 4 question types if the content supports it.
- Aim for: MCQ ~30%, true_false ~25%, fill_in_the_blank ~25%, short_answer ~20%.
- No single type should exceed 40% of the total.`;
  } else {
    diversityRule = `- Generate ${questionTarget} questions.
- Include all 4 question types.
- Aim for equal distribution: ~25% each type.
- No single type should exceed 35% of the total.`;
  }

  const retryWarning = isRetry
    ? `\n⚠️ CRITICAL: Your previous attempt produced only MCQ questions, which is rejected.
You MUST include true_false, fill_in_the_blank, and short_answer questions.
Outputting only MCQ will cause this generation to fail entirely.\n`
    : "";

  return `You are a quiz content generator for a mobile study app.
${retryWarning}
Deck title: ${deck.title}
Deck description: ${deck.description ?? "None"}

Source material:
${deck.source_text}

Return ONLY a valid JSON object — no markdown, no code fences, no extra text.

JSON shape:
{
  "cards": [
    {
      "front": "Short question or prompt",
      "back": "Concise answer",
      "explanation": "Why this answer is correct",
      "difficulty": 2,
      "tags": ["tag1", "tag2"]
    }
  ],
  "questions": [
    {
      "type": "mcq",
      "question": "Which organelle is the powerhouse of the cell?",
      "correct_answer": "Mitochondria",
      "wrong_answers": ["Nucleus", "Ribosome", "Golgi apparatus"],
      "difficulty": 1,
      "time_limit": 15
    },
    {
      "type": "true_false",
      "question": "DNA is stored in the nucleus of eukaryotic cells.",
      "correct_answer": "True",
      "wrong_answers": ["False"],
      "difficulty": 1,
      "time_limit": 10
    },
    {
      "type": "fill_in_the_blank",
      "question": "The ____ is responsible for producing ATP in the cell.",
      "correct_answer": ["mitochondria", "mitochondrion"],
      "wrong_answers": [],
      "difficulty": 2,
      "time_limit": 20
    },
    {
      "type": "short_answer",
      "question": "Briefly explain what DNA replication is.",
      "correct_answer": ["copying DNA to create two identical strands", "duplicating the DNA double helix before cell division"],
      "wrong_answers": [],
      "difficulty": 3,
      "time_limit": 30
    }
  ]
}

RULES:

1. CARDS — Generate ${cardTarget} flashcards.
   - front: short question or term.
   - back: concise answer.
   - explanation: 1–2 clear sentences.
   - difficulty: integer 1–5.
   - tags: lowercase strings, max 8.

2. QUESTION DIVERSITY
${diversityRule}

3. QUESTION FORMAT (follow exactly for each type):

   mcq
   - Concept recognition or comparison.
   - correct_answer: single string.
   - wrong_answers: exactly 3 plausible but wrong options (no duplicates, none equal correct_answer).
   - time_limit: 15.

   true_false
   - A factual statement (not a question) that is clearly true or false.
   - correct_answer: must be exactly "True" or "False" (capital T or F, string).
   - wrong_answers: ["False"] if correct is True, else ["True"].
   - time_limit: 10.

   fill_in_the_blank
   - A sentence with a key term replaced by ____ (exactly four underscores).
   - The question string MUST contain ____.
   - correct_answer: array of accepted answers/synonyms.
   - wrong_answers: [] (empty).
   - time_limit: 20.

   short_answer
   - Open-ended recall or brief explanation.
   - correct_answer: array of 1–3 accepted phrasings (concise, 1 sentence each).
   - wrong_answers: [] (empty).
   - time_limit: 30.

4. Spell "mcq" exactly — never "mcp" or "multiple_choice".
5. No duplicate cards or questions.
6. Return valid JSON only.`.trim();
}

async function generateWithGroq(
  deck: { title: string; description: string | null; source_text: string },
  isRetry = false,
): Promise<GeneratedDeckContent> {
  const apiKey = getRequiredEnv("GROQ_API_KEY");
  const model = getOptionalEnv("GROQ_MODEL", "llama-3.1-8b-instant");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You generate strict JSON study content for a mobile learning app. Return valid JSON only. Never use markdown or code fences.",
        },
        {
          role: "user",
          content: buildPrompt(deck, isRetry),
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof payload?.error?.message === "string"
        ? payload.error.message
        : "Groq generation failed.";
    throw new Error(message);
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Groq response did not include message content.");
  }

  const generated = validateGeneratedContent(parseJsonContent(content));

  // Retry once if the AI returned only MCQ for a reasonably-sized deck
  if (!isRetry && generated.questions.length >= 5) {
    const types = new Set(generated.questions.map((q) => q.type));
    if (types.size === 1 && types.has("mcq")) {
      console.warn("AI returned only MCQ questions. Retrying with stronger diversity prompt…");
      return generateWithGroq(deck, true);
    }
  }

  return generated;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  let deckId: string | undefined;
  let adminClient: ReturnType<typeof createClient> | null = null;

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) {
      return jsonResponse({ error: "Missing authorization header." }, 401);
    }

    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const anonKey = getRequiredEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = (await request.json()) as GenerateRequestBody;
    deckId = body.deck_id;

    if (!deckId) {
      return jsonResponse({ error: "deck_id is required." }, 400);
    }

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    const { data: deck, error: deckError } = await adminClient
      .from("decks")
      .select("id, owner_id, title, description, source_type, source_text")
      .eq("id", deckId)
      .maybeSingle();

    if (deckError) throw deckError;
    if (!deck) return jsonResponse({ error: "Deck not found." }, 404);
    if (deck.owner_id !== user.id) {
      return jsonResponse({ error: "You do not own this deck." }, 403);
    }
    if (deck.source_type !== "text") {
      throw new Error("Only text source generation is supported in this MVP.");
    }
    if (typeof deck.source_text !== "string" || !deck.source_text.trim()) {
      throw new Error("Deck source_text is required for generation.");
    }

    await adminClient
      .from("decks")
      .update({ status: "Preparing", generation_error: null })
      .eq("id", deckId);

    const generated = await generateWithGroq({
      title: deck.title,
      description: deck.description,
      source_text: deck.source_text.trim(),
    });

    await adminClient.from("questions").delete().eq("deck_id", deckId);
    await adminClient.from("cards").delete().eq("deck_id", deckId);

    const { error: cardsError } = await adminClient.from("cards").insert(
      generated.cards.map((card, index) => ({
        deck_id: deckId,
        front: card.front,
        back: card.back,
        term: card.front,
        definition: card.back,
        explanation: card.explanation,
        difficulty: card.difficulty,
        tags: card.tags,
        order: index,
      })),
    );

    if (cardsError) throw cardsError;

    const { error: questionsError } = await adminClient.from("questions").insert(
      generated.questions.map((question) => ({
        deck_id: deckId,
        type: question.type,
        question: question.question,
        correct_answer: question.correct_answer,
        wrong_answers: question.wrong_answers,
        difficulty: question.difficulty,
        time_limit: question.time_limit,
      })),
    );

    if (questionsError) throw questionsError;

    await adminClient
      .from("decks")
      .update({ status: "Ready", generation_error: null })
      .eq("id", deckId);

    await adminClient.from("notifications").insert({
      user_id: deck.owner_id,
      type: "deck_processing_completed",
      title: "Deck is ready",
      message: `Your deck "${deck.title}" is ready to study.`,
      metadata: {
        deck_id: deckId,
        status: "Ready",
      },
    });

    return jsonResponse({
      success: true,
      cards: generated.cards.length,
      questions: generated.questions.length,
      questionTypes: [...new Set(generated.questions.map((q) => q.type))],
    });
  } catch (error) {
    console.error(error);

    if (adminClient && deckId) {
      let deckOwnerId: string | null = null;
      let deckTitle: string | null = null;

      const { data: deckInfo } = await adminClient
        .from("decks")
        .select("owner_id, title")
        .eq("id", deckId)
        .maybeSingle();

      deckOwnerId = deckInfo?.owner_id ?? null;
      deckTitle = deckInfo?.title ?? null;

      await adminClient
        .from("decks")
        .update({
          status: "Failed",
          generation_error:
            error instanceof Error ? error.message : "Could not generate deck content.",
        })
        .eq("id", deckId);

      if (deckOwnerId) {
        await adminClient.from("notifications").insert({
          user_id: deckOwnerId,
          type: "deck_processing_completed",
          title: "Deck processing failed",
          message: `We could not finish processing "${deckTitle ?? "your deck"}".`,
          metadata: {
            deck_id: deckId,
            status: "Failed",
            generation_error:
              error instanceof Error ? error.message : "Could not generate deck content.",
          },
        });
      }
    }

    return jsonResponse(
      {
        error:
          error instanceof Error ? error.message : "Could not generate deck content.",
      },
      500,
    );
  }
});
