// Build varied practice exercises for a vocabulary word.
//
// Each word yields up to 4 exercises in a round:
//   mc-pt-en   — show Portuguese, pick the English meaning from 4 options
//   mc-en-pt   — show English, pick the Portuguese word from 4 options
//   type-pt-en — show Portuguese, type the English meaning (free text)
//   fill-pt    — show the example sentence with a blank, type the Portuguese word
//                (only when the example sentence actually contains the target word)
//
// Distractors for multiple-choice are picked from the same semantic category
// when possible, then from the rest of the dictionary.

import { normalize } from "./practice.js";

export const EXERCISE_KIND_LABELS = {
  "mc-pt-en":   "Choose the meaning",
  "mc-en-pt":   "Choose the Portuguese word",
  "type-pt-en": "Type the meaning",
  "fill-pt":    "Fill in the sentence",
};

export const EXERCISE_KINDS = ["mc-pt-en", "mc-en-pt", "type-pt-en", "fill-pt"];

export function exerciseKey(ex) {
  return `${ex.wordId}-${ex.kind}`;
}

// English meanings can be like "cool / nice" — split into individual acceptable answers.
export function acceptedEnglish(word) {
  return (word.english || "")
    .split(" / ")
    .map((s) => s.trim())
    .filter(Boolean);
}

function primaryEnglish(word) {
  return acceptedEnglish(word)[0] || word.english || "";
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(word, allWords, field, count) {
  const targetNorm = normalize(field === "english" ? primaryEnglish(word) : word.portuguese);
  const sameCategory = allWords.filter(
    (w) => w.id !== word.id && w.category === word.category
  );
  const others = allWords.filter(
    (w) => w.id !== word.id && w.category !== word.category
  );
  const pool = [...shuffle(sameCategory), ...shuffle(others)];

  const out = [];
  const used = new Set([targetNorm]);
  for (const w of pool) {
    const val = field === "english" ? primaryEnglish(w) : w.portuguese;
    const norm = normalize(val);
    if (!used.has(norm)) {
      out.push(val);
      used.add(norm);
    }
    if (out.length === count) break;
  }
  return out;
}

// Build the fill-in-the-blank prompt by removing the target word from its example sentence.
// Returns null if the target word doesn't actually appear in the example (rare).
function buildFillIn(word) {
  if (!word.examplePt || !word.portuguese) return null;
  const lower = word.examplePt.toLowerCase();
  const target = word.portuguese.toLowerCase();
  const idx = lower.indexOf(target);
  if (idx < 0) return null;
  const blanked =
    word.examplePt.slice(0, idx) +
    "___" +
    word.examplePt.slice(idx + word.portuguese.length);
  return {
    sentence: blanked,
    answer: word.portuguese,
    translation: word.exampleEn || "",
  };
}

export function buildExercisesForWord(word, allWords) {
  const out = [];
  const primaryEn = primaryEnglish(word);
  const accepted = acceptedEnglish(word);

  // mc-pt-en
  const enDistractors = pickDistractors(word, allWords, "english", 3);
  out.push({
    kind: "mc-pt-en",
    wordId: word.id,
    word,
    question: `What does "${word.portuguese}" mean?`,
    options: shuffle([primaryEn, ...enDistractors]),
    answer: primaryEn,
  });

  // mc-en-pt
  const ptDistractors = pickDistractors(word, allWords, "portuguese", 3);
  out.push({
    kind: "mc-en-pt",
    wordId: word.id,
    word,
    question: `How do you say "${primaryEn}" in Portuguese?`,
    options: shuffle([word.portuguese, ...ptDistractors]),
    answer: word.portuguese,
  });

  // type-pt-en
  out.push({
    kind: "type-pt-en",
    wordId: word.id,
    word,
    prompt: word.portuguese,
    pronunciation: word.pronunciation,
    answer: primaryEn,
    acceptedAnswers: accepted,
  });

  // fill-pt — only if the example sentence contains the target word
  const fill = buildFillIn(word);
  if (fill) {
    out.push({
      kind: "fill-pt",
      wordId: word.id,
      word,
      sentence: fill.sentence,
      answer: fill.answer,
      translation: fill.translation,
    });
  }

  return out;
}

export function buildWordDeck(lessonWords, allWords) {
  const deck = [];
  for (const w of lessonWords) {
    for (const ex of buildExercisesForWord(w, allWords)) {
      deck.push(ex);
    }
  }
  return deck;
}
