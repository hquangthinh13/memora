// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4";

type GenerateRequestBody = {
  deck_id?: string;
};

type GenerationQuestionType = "mcq" | "true_false";

type GeneratedCard = {
  front: string;
  back: string;
  explanation: string;
  difficulty: number;
  tags: string[];
};

type GeneratedQuestion = {
  type: GenerationQuestionType;
  question: string;
  correct_answer: string | string[];
  wrong_answers: string[];
  hint: string;
  difficulty: number;
  time_limit: number;
};

type GeneratedDeckContent = {
  title: string;
  description: string;
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

function normalizeGenerationQuestionTypes(value: unknown): GenerationQuestionType[] {
  const fallback: GenerationQuestionType[] = ["mcq", "true_false"];
  if (!Array.isArray(value)) return fallback;

  const normalized = value
    .map((item) => (typeof item === "string" ? normalizeType(item) : null))
    .filter((item): item is GenerationQuestionType => item === "mcq" || item === "true_false")
    .filter((item, index, items) => items.indexOf(item) === index);

  return normalized.length ? normalized : fallback;
}

function getQuestionDiversityIssue(
  questions: GeneratedQuestion[],
  allowedTypes: GenerationQuestionType[],
): string | null {
  if (allowedTypes.length < 2 || questions.length < 2) return null;

  const counts = new Map<string, number>();

  for (const question of questions) {
    counts.set(question.type, (counts.get(question.type) ?? 0) + 1);
  }

  const missing = allowedTypes.filter((type) => !counts.has(type));
  if (missing.length) {
    return `AI response must include ${missing.join(", ")} questions.`;
  }

  const maxAllowed = Math.ceil(questions.length * 0.6);
  const dominant = [...counts.entries()].find(([, count]) => count > maxAllowed);
  if (dominant) {
    return `AI response is too heavily weighted toward ${dominant[0]} questions.`;
  }

  return null;
}

function answerTextValues(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

function hasShortAnswerShape(value: string): boolean {
  return value.trim().split(/\s+/).filter(Boolean).length <= 5;
}

function firstShortAnswer(value: string): string {
  return value
    .trim()
    .replace(/[.;:!?].*$/, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .join(" ");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ensureBlankMarker(questionText: string, correctAnswer: string | string[]) {
  if (/_{2,}/.test(questionText)) return questionText;

  const answers = answerTextValues(correctAnswer)
    .map((answer) => answer.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  for (const answer of answers) {
    const pattern = new RegExp(`\\b${escapeRegExp(answer)}\\b`, "i");
    if (pattern.test(questionText)) {
      return questionText.replace(pattern, "____");
    }
  }

  return `${questionText} Answer: ____`;
}

function validateGeneratedContent(
  value: unknown,
  allowedTypes: GenerationQuestionType[],
): GeneratedDeckContent {
  if (!value || typeof value !== "object") {
    throw new Error("AI response must be a JSON object.");
  }

  const obj = value as Record<string, unknown>;
  const title = asNonEmptyString(obj.title, "title").slice(0, 80);
  const description = asNonEmptyString(obj.description, "description").slice(0, 280);
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

  const questions = questionsInput.map((question: unknown, i: number) => {
    const q = question as Record<string, unknown>;

    const rawType = asNonEmptyString(q?.type, `question[${i}].type`);
    let type = normalizeType(rawType);

    if (!allowedTypes.includes(type as GenerationQuestionType)) {
      throw new Error(
        `Unsupported question type: "${type}". Allowed types: ${allowedTypes.join(", ")} (question ${i + 1}).`,
      );
    }

    let questionText = asNonEmptyString(q?.question, `question[${i}].question`);
    const hint = asNonEmptyString(q?.hint, `question[${i}].hint`);
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
      throw new Error(`Unsupported question type: "${type}" (question ${i + 1}).`);
    }

    return {
      type: type as GenerationQuestionType,
      question: questionText,
      correct_answer,
      wrong_answers,
      hint,
      difficulty,
      time_limit,
    };
  });

  return { title, description, cards, questions };
}

function buildPrompt(
  deck: {
    topic_name: string;
    topic_description: string | null;
    source_text: string;
    generation_question_types: GenerationQuestionType[];
  },
  isRetry = false,
): string {
  const sourceLength = deck.source_text.length;
  const cardTarget = sourceLength > 5000 ? "20 to 30" : sourceLength > 1500 ? "12 to 20" : sourceLength > 80 ? "10 to 14" : "4 to 6";
  const questionTarget = sourceLength > 5000 ? "12 to 20" : sourceLength > 1500 ? "8 to 14" : sourceLength > 80 ? "5 to 8" : "4";
  const typeLabels = deck.generation_question_types
    .map((type) => (type === "mcq" ? "mcq" : "true_false"))
    .join(", ");
  const questionExamples = deck.generation_question_types.map((type) => {
    if (type === "mcq") {
      return `    {
      "type": "mcq",
      "question": "Which organelle is the powerhouse of the cell?",
      "correct_answer": "Mitochondria",
      "wrong_answers": ["Nucleus", "Ribosome", "Golgi apparatus"],
      "hint": "Think of the organelle that makes energy for the cell.",
      "difficulty": 1,
      "time_limit": 15
    }`;
    }

    return `    {
      "type": "true_false",
      "question": "DNA is stored in the nucleus of eukaryotic cells.",
      "correct_answer": "True",
      "wrong_answers": ["False"],
      "hint": "Focus on where genetic material is kept in eukaryotic cells.",
      "difficulty": 1,
      "time_limit": 10
    }`;
  }).join(",\n");

  const diversityRule = deck.generation_question_types.length === 1
    ? `- Generate ${questionTarget} questions.
- Generate ONLY this question type: ${typeLabels}.
- Do not generate fill_in_the_blank or short_answer questions.`
    : `- Generate ${questionTarget} questions.
- Generate ONLY these question types: ${typeLabels}.
- Include at least 1 mcq question and at least 1 true_false question when generating 2 or more questions.
- Keep the distribution balanced; no single type should exceed 60% of the total.
- Do not generate fill_in_the_blank or short_answer questions.`;

  const retryWarning = isRetry
    ? `\nCRITICAL: Your previous attempt failed validation.
Return the exact JSON shape, include title, description, cards, and questions.
Every question MUST include a non-empty hint.
Only generate these question types: ${typeLabels}.\n`
    : "";

  return `You are a quiz content generator for a mobile study app.
${retryWarning}
Topic: ${deck.topic_name}${deck.topic_description ? ` — ${deck.topic_description}` : ""}

Source material:
${deck.source_text}

Return ONLY a valid JSON object - no markdown, no code fences, no extra text.

JSON shape:
{
  "title": "A concise deck title",
  "description": "A short, learner-friendly summary of what this deck teaches.",
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
${questionExamples}
  ]
}

RULES:

1. TITLE - Generate a concise deck title.
   - 3 to 8 words.
   - Descriptive of the topic and source content.
   - Do not start with "Deck" or "Flashcards".
   - Max 80 characters.

2. DESCRIPTION - Generate a concise deck description.
   - 1-2 sentences, max 280 characters.
   - Explain what the learner will practice.
   - Do not mention "source notes" or sound like marketing copy.

3. CARDS - Generate ${cardTarget} flashcards.
   - front: short question or term.
   - back: concise answer.
   - explanation: 1-2 clear sentences.
   - difficulty: integer 1-5.
   - tags: lowercase strings, max 8.

4. QUESTION DIVERSITY
${diversityRule}

5. QUESTION FORMAT (follow exactly for each type):

   mcq
   - Concept recognition or comparison.
   - correct_answer: single string.
   - wrong_answers: exactly 3 plausible but wrong options (no duplicates, none equal correct_answer).
   - hint: one short clue, not the answer.
   - time_limit: 15.

   true_false
   - A factual statement (not a question) that is clearly true or false.
   - correct_answer: must be exactly "True" or "False" (capital T or F, string).
   - wrong_answers: ["False"] if correct is True, else ["True"].
   - hint: one short clue, not the answer.
   - time_limit: 10.

6. Every question must include a non-empty hint.
7. Spell "mcq" exactly - never "mcp" or "multiple_choice".
8. Never generate "fill_in_the_blank" or "short_answer" in this MVP.
9. No duplicate cards or questions.
10. Return valid JSON only.`.trim();
}
async function generateWithGroq(
  deck: {
    topic_name: string;
    topic_description: string | null;
    source_text: string;
    generation_question_types: GenerationQuestionType[];
  },
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

  let generated: GeneratedDeckContent;
  try {
    generated = validateGeneratedContent(parseJsonContent(content), deck.generation_question_types);
  } catch (error) {
    if (!isRetry) {
      console.warn("AI response failed validation. Retrying with stricter prompt.", error);
      return generateWithGroq(deck, true);
    }

    throw error;
  }

  const diversityIssue = getQuestionDiversityIssue(generated.questions, deck.generation_question_types);
  if (diversityIssue) {
    if (!isRetry) {
      console.warn(`${diversityIssue} Retrying with stronger diversity prompt...`);
      return generateWithGroq(deck, true);
    }

    throw new Error(diversityIssue);
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
      .select("id, owner_id, title, source_type, source_text, topic_id, generation_question_types")
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
    const generationQuestionTypes = normalizeGenerationQuestionTypes(deck.generation_question_types);

    await adminClient
      .from("decks")
      .update({ status: "Preparing", generation_error: null })
      .eq("id", deckId);

    let topicName = "General";
    let topicDescription: string | null = null;

    if (deck.topic_id) {
      const { data: topic } = await adminClient
        .from("topics")
        .select("name, description")
        .eq("id", deck.topic_id)
        .maybeSingle();
      if (topic) {
        topicName = topic.name;
        topicDescription = topic.description ?? null;
      }
    }

    const generated = await generateWithGroq({
      topic_name: topicName,
      topic_description: topicDescription,
      source_text: deck.source_text.trim(),
      generation_question_types: generationQuestionTypes,
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
        hint: question.hint,
        difficulty: question.difficulty,
        time_limit: question.time_limit,
      })),
    );

    if (questionsError) throw questionsError;

    await adminClient
      .from("decks")
      .update({
        status: "Ready",
        generation_error: null,
        title: generated.title,
        description: generated.description,
      })
      .eq("id", deckId);

    await adminClient.from("notifications").insert({
      user_id: deck.owner_id,
      type: "deck_processing_completed",
      title: "Deck is ready",
      message: `Your deck "${generated.title}" is ready to study.`,
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

      const { data: deckInfo } = await adminClient
        .from("decks")
        .select("owner_id")
        .eq("id", deckId)
        .maybeSingle();

      deckOwnerId = deckInfo?.owner_id ?? null;

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
          message: `We could not finish generating your deck.`,
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
