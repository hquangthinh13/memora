import type { Tables } from "./database";

export type Topic = Tables<"topics">;
export type Deck = Tables<"decks">;
export type Card = Tables<"cards">;
export type Question = Tables<"questions">;

export type DeckStatus = Deck["status"];
export type DeckSourceType = Deck["source_type"];
export type QuestionType = Question["type"];
