import { useCallback, useEffect, useMemo } from "react";
import { createAudioPlayer } from "expo-audio";

const soundOptions = {
  downloadFirst: true,
  keepAudioSessionActive: true,
};

export function useQuizSounds() {
  const players = useMemo(
    () => ({
      correct: createAudioPlayer(
        require("../../assets/sounds/quiz-correct.wav"),
        soundOptions,
      ),
      incorrect: createAudioPlayer(
        require("../../assets/sounds/quiz-incorrect.wav"),
        soundOptions,
      ),
      tick: createAudioPlayer(
        require("../../assets/sounds/quiz-tick.wav"),
        soundOptions,
      ),
      timeout: createAudioPlayer(
        require("../../assets/sounds/quiz-timeout.wav"),
        soundOptions,
      ),
      finish: createAudioPlayer(
        require("../../assets/sounds/quiz-finish.wav"),
        soundOptions,
      ),
    }),
    [],
  );

  const play = useCallback(
    (key: keyof typeof players) => {
      const player = players[key];
      player.seekTo(0).catch(() => null);
      player.play();
    },
    [players],
  );

  useEffect(
    () => () => {
      Object.values(players).forEach((player) => player.remove());
    },
    [players],
  );

  return useMemo(
    () => ({
      playCorrect: () => play("correct"),
      playIncorrect: () => play("incorrect"),
      playTick: () => play("tick"),
      playTimeout: () => play("timeout"),
      playFinish: () => play("finish"),
    }),
    [play],
  );
}
