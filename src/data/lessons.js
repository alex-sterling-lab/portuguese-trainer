// Lesson definitions — teach step by step.
//
// Each lesson scopes which verbs/words/prompts the trainer will use.
// A lesson can also restrict pronouns (lesson 1) or require a tag (lesson 2).
//
// Helpers at the bottom turn a lesson + the full datasets into filtered lists.

import { normalize } from "../utils/practice.js";

const lessons = [
  {
    id: 1,
    title: "I am / I have / I am in",
    subtitle: "ser · estar · ter",
    summary: "Three essential verbs and three pronouns. Build your first real sentences.",
    focusVerbs: ["ser", "estar", "ter"],
    pronouns: ["eu", "você", "a gente"],
    // Vocabulary used in this lesson's example sentences.
    wordIds: [20, 22, 220, 95, 41, 221, 222, 223, 224, 8, 9],
    examples: [
      { pt: "Eu sou estudante.", en: "I am a student." },
      { pt: "Eu estou em casa.", en: "I am at home." },
      { pt: "Você tem tempo?", en: "Do you have time?" },
    ],
    // No tag — accepts any matching prompt that isn't tagged for a different lesson.
  },
  {
    id: 2,
    title: "Negative sentences & questions",
    subtitle: "não + verb · question form",
    summary: "Same three verbs — now say what isn't true and how to ask.",
    focusVerbs: ["ser", "estar", "ter"],
    pronouns: ["eu", "você", "a gente"],
    wordIds: [20, 22, 220, 95, 41, 221, 222, 223, 224, 8, 9],
    examples: [
      { pt: "Eu não estou em casa.", en: "I am not at home." },
      { pt: "Eu não tenho café.", en: "I don't have coffee." },
      { pt: "Você tem tempo?", en: "Do you have time?" },
    ],
    requiresTag: "lesson2",
  },
  {
    id: 3,
    title: "Regular -ar verbs",
    subtitle: "falar · estudar · morar · trabalhar",
    summary: "One -ar pattern unlocks dozens of useful verbs.",
    focusVerbs: ["falar", "estudar", "morar", "trabalhar"],
    pronouns: null, // any pronoun
    wordIds: [
      20, 22, 220, 25, 26,
      75, 76, 77, 95, 60, 62,
      29, 30,
    ],
    examples: [
      { pt: "Eu falo português.", en: "I speak Portuguese." },
      { pt: "A gente mora em Lisboa.", en: "We live in Lisbon." },
      { pt: "Nós trabalhamos em casa.", en: "We work from home." },
    ],
  },
  {
    id: 4,
    title: "Regular -er verbs",
    subtitle: "comer · beber · aprender",
    summary: "The -er pattern — same logic, different ending.",
    focusVerbs: ["comer", "beber", "aprender"],
    pronouns: null,
    wordIds: [
      20, 22, 220, 25, 26,
      40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54,
    ],
    examples: [
      { pt: "Eu como pão.", en: "I eat bread." },
      { pt: "A gente bebe café.", en: "We drink coffee." },
      { pt: "Eu aprendo português.", en: "I learn Portuguese." },
    ],
  },
  {
    id: 5,
    title: "Useful irregular verbs",
    subtitle: "ir · querer · poder · fazer",
    summary: "Four irregulars you'll use every day.",
    focusVerbs: ["ir", "querer", "poder", "fazer"],
    pronouns: null,
    wordIds: [
      20, 22, 220, 25, 26,
      95, 75, 86, 87, 85, 78, 79,
      114, 115, 117,
    ],
    examples: [
      { pt: "Eu vou para casa.", en: "I'm going home." },
      { pt: "Eu quero um café.", en: "I want a coffee." },
      { pt: "Eu posso ajudar você.", en: "I can help you." },
    ],
  },
];

export const LESSON_IDS = lessons.map((l) => l.id);

export function getLessonById(id) {
  return lessons.find((l) => l.id === Number(id)) || lessons[0];
}

// ----- Filtering helpers -----

export function promptInLesson(prompt, lesson) {
  if (lesson.requiresTag) {
    return prompt.tag === lesson.requiresTag;
  }
  // For non-tag lessons, exclude prompts intended for a tagged lesson.
  if (prompt.tag) return false;
  if (lesson.focusVerbs && !lesson.focusVerbs.includes(prompt.verb)) return false;
  if (lesson.pronouns && !lesson.pronouns.includes(prompt.person)) return false;
  return true;
}

export function promptsForLesson(allPrompts, lesson) {
  return allPrompts.filter((p) => promptInLesson(p, lesson));
}

export function verbsForLesson(allVerbs, lesson) {
  if (!lesson.focusVerbs) return allVerbs;
  return allVerbs.filter((v) => lesson.focusVerbs.includes(v.id));
}

export function wordsForLesson(allWords, lesson) {
  if (!lesson.wordIds || lesson.wordIds.length === 0) return allWords;
  const set = new Set(lesson.wordIds);
  return allWords.filter((w) => set.has(w.id));
}

// Decide if a multiple-choice question belongs to a lesson:
//  - vocab/vocab-en: question must reference a word inside the lesson's wordIds (matched by
//    Portuguese or English answer text).
//  - sentence: kept across all lessons (general comprehension).
//  - type-verb: verb must be in lesson focus.
export function quizQuestionInLesson(q, lesson, words) {
  if (q.type === "type-verb") {
    if (!lesson.focusVerbs) return true;
    if (!lesson.focusVerbs.includes(q.verb)) return false;
    if (lesson.pronouns && !lesson.pronouns.includes(q.person)) return false;
    if (lesson.requiresTag) return false; // lesson 2 is verb-only on tagged prompts
    return true;
  }
  if (q.type !== "mc") return true;
  if (!lesson.wordIds) return true;
  const set = new Set(lesson.wordIds);
  const lessonWords = words.filter((w) => set.has(w.id));
  const ptForms = new Set(lessonWords.map((w) => normalize(w.portuguese)));
  const enForms = new Set(lessonWords.map((w) => normalize(w.english.split(" /")[0])));
  const ans = normalize(q.answer);
  if (q.topic === "vocab") {
    // Question is "What does X mean?" — the word X appears in the question, answer is English.
    return enForms.has(ans) || lessonWords.some((w) =>
      q.question.toLowerCase().includes(`"${w.portuguese.toLowerCase()}"`)
    );
  }
  if (q.topic === "vocab-en") {
    return ptForms.has(ans);
  }
  // sentence topic — keep general
  return true;
}

export function quizForLesson(allQuestions, lesson, words) {
  return allQuestions.filter((q) => quizQuestionInLesson(q, lesson, words));
}

export default lessons;
