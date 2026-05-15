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

function asNonEmptyString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Generated ${field} must be a non-empty string.`);
  }

  return value.trim();
}

function asDifficulty(value: unknown) {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error("Generated difficulty must be an integer from 1 to 5.");
  }

  return value;
}

function asTags(value: unknown) {
  if (!Array.isArray(value)) {
    throw new Error("Generated card tags must be an array.");
  }

  return value
    .map((tag) => asNonEmptyString(tag, "tag").toLowerCase())
    .filter((tag, index, tags) => tags.indexOf(tag) === index)
    .slice(0, 8);
}

function asCorrectAnswer(value: unknown) {
  if (typeof value === "string") return asNonEmptyString(value, "correct_answer");

  if (Array.isArray(value)) {
    const answers = value.map((answer) => asNonEmptyString(answer, "correct_answer"));
    if (!answers.length) throw new Error("Generated correct_answer array cannot be empty.");
    return answers;
  }

  throw new Error("Generated correct_answer must be a string or string array.");
}

function parseJsonContent(content: string) {
  const trimmed = content.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(withoutFence);
}

function validateGeneratedContent(value: unknown): GeneratedDeckContent {
  if (!value || typeof value !== "object") {
    throw new Error("AI response must be a JSON object.");
  }

  const cardsInput = value.cards;
  const questionsInput = value.questions;

  if (!Array.isArray(cardsInput) || cardsInput.length < 1 || cardsInput.length > 30) {
    throw new Error("AI response must include 1 to 30 cards.");
  }

  if (!Array.isArray(questionsInput) || questionsInput.length < 1 || questionsInput.length > 20) {
    throw new Error("AI response must include 1 to 20 questions.");
  }

  const cards = cardsInput.map((card) => ({
    front: asNonEmptyString(card?.front, "card.front"),
    back: asNonEmptyString(card?.back, "card.back"),
    explanation: asNonEmptyString(card?.explanation, "card.explanation"),
    difficulty: asDifficulty(card?.difficulty),
    tags: asTags(card?.tags),
  }));

  const questions = questionsInput.map((question) => {
    const type = asNonEmptyString(question?.type, "question.type");

    if (!["mcq", "fill_in_the_blank", "true_false", "short_answer"].includes(type)) {
      throw new Error(`Unsupported generated question type: ${type}.`);
    }

    const wrongAnswers = Array.isArray(question?.wrong_answers)
      ? question.wrong_answers.map((answer) => asNonEmptyString(answer, "wrong_answer"))
      : [];

    if (type === "mcq" && wrongAnswers.length !== 3) {
      throw new Error("Generated MCQ questions must include exactly 3 wrong answers.");
    }

    return {
      type,
      question: asNonEmptyString(question?.question, "question.question"),
      correct_answer: asCorrectAnswer(question?.correct_answer),
      wrong_answers: wrongAnswers,
      difficulty: asDifficulty(question?.difficulty),
      time_limit: Number.isInteger(question?.time_limit) && question.time_limit > 0
        ? question.time_limit
        : 15,
    };
  });

  return { cards, questions };
}

function buildPrompt(deck: { title: string; description: string | null; source_text: string }) {
  const sourceLength = deck.source_text.length;
  const cardTarget = sourceLength > 5000 ? "20 to 30" : sourceLength > 1500 ? "12 to 20" : "10 to 14";
  const questionTarget = sourceLength > 5000 ? "12 to 20" : sourceLength > 1500 ? "8 to 14" : "5 to 8";

  return `
Generate learning content for a mobile study deck.

Deck title: ${deck.title}
Deck description: ${deck.description ?? "None"}

Source material:
${deck.source_text}

Return JSON only with this exact shape:
{
  "cards": [
    {
      "front": "Question or prompt",
      "back": "Short answer",
      "explanation": "Clear explanation",
      "difficulty": 1,
      "tags": ["lowercase-tag"]
    }
  ],
  "questions": [
    {
      "type": "mcq",
      "question": "Question text",
      "correct_answer": "Answer text or array of accepted answers",
      "wrong_answers": ["Wrong 1", "Wrong 2", "Wrong 3"],
      "difficulty": 1,
      "time_limit": 10
    }
  ]
}

Rules:
- Generate ${cardTarget} flashcards and ${questionTarget} quiz questions.
- Cards must be atomic and useful.
- Keep front/back concise.
- Explanations must be clear.
- Difficulty must be an integer from 1 to 5.
- Tags must be lowercase strings.
- Question type must be one of: mcq, fill_in_the_blank, true_false, short_answer.
- Use "mcq", never "mcp".
- MCQ questions must have exactly 3 plausible wrong answers.
- correct_answer may be a string or an array of strings.
- Do not duplicate cards or questions.
- Do not use markdown in JSON values unless necessary.
`.trim();
}

async function generateWithGroq(deck: { title: string; description: string | null; source_text: string }) {
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
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You generate strict JSON study content. Return valid JSON only.",
        },
        {
          role: "user",
          content: buildPrompt(deck),
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

  return validateGeneratedContent(parseJsonContent(content));
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

    return jsonResponse({
      success: true,
      cards: generated.cards.length,
      questions: generated.questions.length,
    });
  } catch (error) {
    console.error(error);

    if (adminClient && deckId) {
      await adminClient
        .from("decks")
        .update({
          status: "Failed",
          generation_error: error instanceof Error ? error.message : "Could not generate deck content.",
        })
        .eq("id", deckId);
    }

    return jsonResponse(
      { error: error instanceof Error ? error.message : "Could not generate deck content." },
      500,
    );
  }
});
