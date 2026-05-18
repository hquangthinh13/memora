import { useRouter } from "expo-router";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";

import {
  AppButton,
  AppCard,
  AppInput,
  AppText,
  DeckCoverPicker,
  Screen,
  TopicSelect,
  SectionHeader,
} from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/errors";
import { uploadImageToCloudinary } from "@/services/cloudinary";
import { createDeck } from "@/services/decks";
import { getTopic } from "@/services/topics";

type GenerationQuestionType = "mcq" | "true_false";

const QUESTION_TYPE_OPTIONS: {
  value: GenerationQuestionType;
  label: string;
  description: string;
}[] = [
  {
    value: "mcq",
    label: "Multiple choice",
    description: "Generate answer options for recognition practice.",
  },
  {
    value: "true_false",
    label: "True / False",
    description: "Generate quick factual judgment questions.",
  },
];

export default function CreateDeckScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [topicId, setTopicId] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState("");
  const [selectedCoverUri, setSelectedCoverUri] = useState<string | null>(null);
  const [questionTypes, setQuestionTypes] = useState<GenerationQuestionType[]>([
    "mcq",
    "true_false",
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleQuestionType(type: GenerationQuestionType) {
    setError(null);
    setQuestionTypes((current) => {
      if (current.includes(type)) {
        return current.length === 1
          ? current
          : current.filter((item) => item !== type);
      }

      return [...current, type];
    });
  }

  async function handleSave() {
    if (!user) return;
    if (!topicId) {
      setError("Choose a topic for this deck.");
      return;
    }
    if (sourceText.trim().length < 20) {
      setError(
        "The source text must be at least 20 characters long so AI can generate meaningful content.",
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const topic = await getTopic(topicId);
      if (!topic || topic.user_id !== user.id) {
        setError(
          "Choose a topic from your own profile before generating this deck.",
        );
        return;
      }

      const cover = selectedCoverUri
        ? await uploadImageToCloudinary({
            localUri: selectedCoverUri,
            folder: "memora/deck",
          })
        : null;
      const deck = await createDeck({
        owner_id: user.id,
        topic_id: topicId,
        title: "Preparing your deck...",
        description: null,
        cover_image_url: cover?.secureUrl ?? null,
        cover_image_public_id: cover?.publicId ?? null,
        source_type: "text",
        source_text: sourceText.trim(),
        source_file_path: null,
        status: "Preparing",
        generation_error: null,
        generation_question_types: questionTypes,
      });
      router.replace(`/decks/${deck.id}?generate=1`);
    } catch (caught) {
      setError(getErrorMessage(caught, "Could not save deck."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen
      header={<SectionHeader title="Create new deck"></SectionHeader>}
      scroll
    >
      <AppCard className="gap-6">
        <TopicSelect
          value={topicId}
          onChange={(id) => {
            setError(null);
            setTopicId(id);
          }}
          disabled={submitting}
        />
        <AppInput
          label="Source notes"
          placeholder="Paste notes, a topic summary, or learning material here."
          value={sourceText}
          onChangeText={setSourceText}
          multiline
          description="At least 20 characters"
          inputClassName="min-h-40 py-3"
          textAlignVertical="top"
        />

        <View className="gap-3">
          <View>
            <AppText variant="caption" className="text-text">
              Question types
            </AppText>
            {/* <AppText variant="caption">
              Choose what kind of quiz questions this deck should generate.
            </AppText> */}
          </View>
          <View className="gap-2">
            {QUESTION_TYPE_OPTIONS.map((option) => {
              const selected = questionTypes.includes(option.value);

              return (
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.85}
                  disabled={submitting}
                  onPress={() => toggleQuestionType(option.value)}
                  className={cn(
                    "rounded-lg border p-4",
                    selected
                      ? "border-primary bg-mint-soft"
                      : "border-border bg-surface-soft",
                    submitting && "opacity-60",
                  )}
                >
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <AppText variant="body" className="font-sans-semibold">
                        {option.label}
                      </AppText>
                      <AppText variant="caption">{option.description}</AppText>
                    </View>
                    <View
                      className={cn(
                        "h-5 w-5 items-center justify-center rounded-full border-2",
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-surface",
                      )}
                    >
                      {selected ? (
                        <View className="h-2.5 w-2.5 rounded-full bg-primary" />
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <View className="gap-3">
            <AppText variant="caption" className="text-text">
              Cover image
            </AppText>
            <DeckCoverPicker
              imageUri={selectedCoverUri}
              disabled={submitting}
              onChange={(uri) => {
                setError(null);
                setSelectedCoverUri(uri);
              }}
              onRemove={() => setSelectedCoverUri(null)}
              onError={setError}
            />
          </View>
        </View>
        {/* <AppText variant="caption" className="text-secondary text-center">
          Memora will generate a title, description, flashcards, and selected
          quiz types from your topic and notes.
        </AppText> */}
        {error ? (
          <AppText variant="caption" className="text-danger text-center">
            {error}
          </AppText>
        ) : null}
        <AppButton
          title={submitting ? "Preparing deck..." : "Generate deck"}
          variant="primary"
          disabled={submitting}
          onPress={handleSave}
        />
      </AppCard>
    </Screen>
  );
}
