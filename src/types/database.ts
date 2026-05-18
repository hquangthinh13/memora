export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          username: string | null;
          bio: string | null;
          locale: string | null;
          timezone: string | null;
          primary_provider: Database["public"]["Enums"]["auth_provider"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          username?: string | null;
          bio?: string | null;
          locale?: string | null;
          timezone?: string | null;
          primary_provider?: Database["public"]["Enums"]["auth_provider"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
      decks: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          visibility: Database["public"]["Enums"]["deck_visibility"];
          share_code: string | null;
          language: string | null;
          tags: string[];
          cover_url: string | null;
          cover_image_url: string | null;
          cover_image_public_id: string | null;
          topic_id: string | null;
          source_type: "text" | "pdf";
          source_text: string | null;
          source_file_path: string | null;
          status: "Preparing" | "Ready" | "Failed";
          generation_error: string | null;
          generation_question_types: ("mcq" | "true_false")[];
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string | null;
          visibility?: Database["public"]["Enums"]["deck_visibility"];
          share_code?: string | null;
          language?: string | null;
          tags?: string[];
          cover_url?: string | null;
          cover_image_url?: string | null;
          cover_image_public_id?: string | null;
          topic_id?: string | null;
          source_type?: "text" | "pdf";
          source_text?: string | null;
          source_file_path?: string | null;
          status?: "Preparing" | "Ready" | "Failed";
          generation_error?: string | null;
          generation_question_types?: ("mcq" | "true_false")[];
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["decks"]["Insert"]>;
        Relationships: [];
      };
      cards: {
        Row: {
          id: string;
          deck_id: string;
          front: string | null;
          back: string | null;
          term: string | null;
          definition: string | null;
          pronunciation: string | null;
          ipa: string | null;
          part_of_speech: string | null;
          language: string | null;
          translation: string | null;
          transliteration: string | null;
          example: string | null;
          note: string | null;
          hint: string | null;
          explanation: string | null;
          mnemonic: string | null;
          metadata: Json | null;
          tags: string[];
          difficulty: number;
          difficulty_legacy: Database["public"]["Enums"]["card_difficulty"];
          status: Database["public"]["Enums"]["card_status"];
          image_url: string | null;
          audio_url: string | null;
          order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deck_id: string;
          front?: string | null;
          back?: string | null;
          term?: string | null;
          definition?: string | null;
          pronunciation?: string | null;
          ipa?: string | null;
          part_of_speech?: string | null;
          language?: string | null;
          translation?: string | null;
          transliteration?: string | null;
          example?: string | null;
          note?: string | null;
          hint?: string | null;
          explanation?: string | null;
          mnemonic?: string | null;
          metadata?: Json | null;
          tags?: string[];
          difficulty?: number;
          difficulty_legacy?: Database["public"]["Enums"]["card_difficulty"];
          status?: Database["public"]["Enums"]["card_status"];
          image_url?: string | null;
          audio_url?: string | null;
          order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cards"]["Insert"]>;
        Relationships: [];
      };
      topics: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["topics"]["Insert"]>;
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          deck_id: string;
          type: "mcq" | "fill_in_the_blank" | "true_false" | "short_answer";
          question: string;
          correct_answer: Json;
          wrong_answers: string[];
          hint: string | null;
          difficulty: number;
          time_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deck_id: string;
          type?: "mcq" | "fill_in_the_blank" | "true_false" | "short_answer";
          question: string;
          correct_answer: Json;
          wrong_answers?: string[];
          hint?: string | null;
          difficulty?: number;
          time_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["questions"]["Insert"]>;
        Relationships: [];
      };
      card_sides: {
        Row: {
          id: string;
          card_id: string;
          type: Database["public"]["Enums"]["card_side_type"];
          content: string;
          order: number;
          language: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          type: Database["public"]["Enums"]["card_side_type"];
          content: string;
          order?: number;
          language?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["card_sides"]["Insert"]>;
        Relationships: [];
      };
      card_examples: {
        Row: {
          id: string;
          card_id: string;
          sentence: string;
          translation: string | null;
          note: string | null;
          source: string | null;
          order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          sentence: string;
          translation?: string | null;
          note?: string | null;
          source?: string | null;
          order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["card_examples"]["Insert"]>;
        Relationships: [];
      };
      card_media: {
        Row: {
          id: string;
          card_id: string;
          type: Database["public"]["Enums"]["media_type"];
          url: string;
          caption: string | null;
          order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          type: Database["public"]["Enums"]["media_type"];
          url: string;
          caption?: string | null;
          order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["card_media"]["Insert"]>;
        Relationships: [];
      };
      deck_shares: {
        Row: {
          id: string;
          deck_id: string;
          user_id: string;
          permission: Database["public"]["Enums"]["share_permission"];
          created_at: string;
        };
        Insert: {
          id?: string;
          deck_id: string;
          user_id: string;
          permission?: Database["public"]["Enums"]["share_permission"];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deck_shares"]["Insert"]>;
        Relationships: [];
      };
      deck_collaborators: {
        Row: {
          id: string;
          deck_id: string;
          user_id: string;
          role: "owner" | "editor" | "viewer";
          invited_by: string | null;
          status: "pending" | "accepted" | "rejected";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deck_id: string;
          user_id: string;
          role?: "owner" | "editor" | "viewer";
          invited_by?: string | null;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deck_collaborators"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type:
            | "friend_request"
            | "friend_request_accepted"
            | "deck_processing_completed"
            | "deck_invitation"
            | "deck_invitation_accepted";
          title: string;
          message: string | null;
          metadata: Json | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type:
            | "friend_request"
            | "friend_request_accepted"
            | "deck_processing_completed"
            | "deck_invitation"
            | "deck_invitation_accepted";
          title: string;
          message?: string | null;
          metadata?: Json | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: "pending" | "accepted" | "rejected" | "blocked";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: "pending" | "accepted" | "rejected" | "blocked";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["friendships"]["Insert"]>;
        Relationships: [];
      };
      saved_decks: {
        Row: {
          id: string;
          user_id: string;
          deck_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          deck_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["saved_decks"]["Insert"]>;
        Relationships: [];
      };
      study_progress: {
        Row: {
          id: string;
          user_id: string;
          card_id: string;
          correct_count: number;
          wrong_count: number;
          ease_factor: number;
          interval_days: number;
          repetition: number;
          lapses: number;
          next_review_at: string | null;
          last_reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          card_id: string;
          correct_count?: number;
          wrong_count?: number;
          ease_factor?: number;
          interval_days?: number;
          repetition?: number;
          lapses?: number;
          next_review_at?: string | null;
          last_reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["study_progress"]["Insert"]>;
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          host_id: string;
          deck_id: string;
          code: string;
          status: Database["public"]["Enums"]["room_status"];
          current_question_index: number;
          max_players: number | null;
          question_time_limit: number;
          allow_late_join: boolean;
          started_at: string | null;
          ended_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          host_id: string;
          deck_id: string;
          code: string;
          status?: Database["public"]["Enums"]["room_status"];
          current_question_index?: number;
          max_players?: number | null;
          question_time_limit?: number;
          allow_late_join?: boolean;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["rooms"]["Insert"]>;
        Relationships: [];
      };
      room_players: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          nickname: string | null;
          score: number;
          joined_at: string;
          left_at: string | null;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          nickname?: string | null;
          score?: number;
          joined_at?: string;
          left_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["room_players"]["Insert"]>;
        Relationships: [];
      };
      room_questions: {
        Row: {
          id: string;
          room_id: string;
          card_id: string | null;
          index: number;
          type: Database["public"]["Enums"]["question_type"];
          prompt: string;
          correct_answer: string;
          options: Json | null;
          accepted_answers: Json | null;
          explanation: string | null;
          time_limit_sec: number;
          points: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          card_id?: string | null;
          index: number;
          type?: Database["public"]["Enums"]["question_type"];
          prompt: string;
          correct_answer: string;
          options?: Json | null;
          accepted_answers?: Json | null;
          explanation?: string | null;
          time_limit_sec?: number;
          points?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["room_questions"]["Insert"]>;
        Relationships: [];
      };
      room_answers: {
        Row: {
          id: string;
          room_id: string;
          question_id: string;
          user_id: string;
          answer: string;
          is_correct: boolean;
          response_ms: number;
          score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          question_id: string;
          user_id: string;
          answer: string;
          is_correct: boolean;
          response_ms: number;
          score?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["room_answers"]["Insert"]>;
        Relationships: [];
      };
      user_learning_stats: {
        Row: {
          user_id: string;
          total_cards_studied: number;
          total_quizzes_completed: number;
          total_questions_answered: number;
          total_correct_answers: number;
          total_incorrect_answers: number;
          current_streak: number;
          longest_streak: number;
          last_studied_on: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          total_cards_studied?: number;
          total_quizzes_completed?: number;
          total_questions_answered?: number;
          total_correct_answers?: number;
          total_incorrect_answers?: number;
          current_streak?: number;
          longest_streak?: number;
          last_studied_on?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_learning_stats"]["Insert"]>;
        Relationships: [];
      };
      learning_activity_days: {
        Row: {
          id: string;
          user_id: string;
          activity_date: string;
          cards_studied: number;
          quizzes_completed: number;
          questions_answered: number;
          correct_answers: number;
          incorrect_answers: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_date: string;
          cards_studied?: number;
          quizzes_completed?: number;
          questions_answered?: number;
          correct_answers?: number;
          incorrect_answers?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["learning_activity_days"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      auth_provider: "EMAIL" | "GOOGLE" | "FACEBOOK" | "GITHUB" | "DISCORD" | "APPLE" | "OTHER";
      card_difficulty: "EASY" | "MEDIUM" | "HARD";
      card_side_type: "FRONT" | "BACK" | "HINT" | "EXPLANATION";
      card_status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
      deck_visibility: "PRIVATE" | "LINK" | "PUBLIC";
      media_type: "IMAGE" | "AUDIO" | "VIDEO";
      question_type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "TYPING" | "MATCHING" | "FILL_IN_BLANK";
      room_status: "WAITING" | "PLAYING" | "FINISHED" | "CANCELLED";
      share_permission: "VIEW" | "EDIT";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
