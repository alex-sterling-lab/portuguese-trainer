// Thin wrapper around localStorage with JSON serialization and safe defaults.

const KEYS = {
  learnedWords: "portuguese_trainer_learned_words",
  practicedVerbs: "portuguese_trainer_practiced_verbs",
  flashcards: "portuguese_trainer_flashcards",
  mistakes: "portuguese_trainer_mistakes",
  bestScore: "portuguese_trainer_best_score",
  settings: "portuguese_trainer_settings",
};

export const STORAGE_KEYS = KEYS;

const DEFAULT_SETTINGS = {
  dailyGoal: 10,
  compactMode: false,
  showPronunciation: true,
  activeLesson: 1,
};

const DEFAULT_FLASHCARDS = {
  remembered: [], // word ids
  forgotten: [],  // word ids
  seen: 0,
};

const DEFAULT_PRACTICED_VERBS = {
  correct: 0,
  wrong: 0,
};

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota or privacy mode — silently ignore
  }
}

// ---------- Learned words ----------
export function getLearnedWords() {
  return safeRead(KEYS.learnedWords, []);
}
export function setLearnedWords(ids) {
  safeWrite(KEYS.learnedWords, ids);
}
export function toggleLearnedWord(id) {
  const list = getLearnedWords();
  const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  setLearnedWords(next);
  return next;
}

// ---------- Practiced verbs ----------
export function getPracticedVerbs() {
  return { ...DEFAULT_PRACTICED_VERBS, ...safeRead(KEYS.practicedVerbs, {}) };
}
export function recordVerbResult(isCorrect) {
  const stats = getPracticedVerbs();
  if (isCorrect) stats.correct += 1;
  else stats.wrong += 1;
  safeWrite(KEYS.practicedVerbs, stats);
  return stats;
}

// ---------- Flashcards ----------
export function getFlashcardStats() {
  return { ...DEFAULT_FLASHCARDS, ...safeRead(KEYS.flashcards, {}) };
}
export function recordFlashcardResult(wordId, remembered) {
  const stats = getFlashcardStats();
  stats.seen += 1;
  if (remembered) {
    if (!stats.remembered.includes(wordId)) stats.remembered.push(wordId);
    stats.forgotten = stats.forgotten.filter((x) => x !== wordId);
  } else {
    if (!stats.forgotten.includes(wordId)) stats.forgotten.push(wordId);
  }
  safeWrite(KEYS.flashcards, stats);
  return stats;
}

// ---------- Mistakes ----------
// A mistake entry can be:
//   { kind: "vocab",  wordId, userAnswer, correctAnswer, addedAt, count }
//   { kind: "verb",   promptId, verb, person, userAnswer, correctAnswer, sentence, addedAt, count }
//   { kind: "quiz",   questionId, question, userAnswer, correctAnswer, addedAt, count }
//   { kind: "flash",  wordId, addedAt, count }
export function getMistakes() {
  return safeRead(KEYS.mistakes, []);
}
export function addMistake(entry) {
  const list = getMistakes();
  const idx = list.findIndex(
    (m) => m.kind === entry.kind &&
      (m.wordId ?? null) === (entry.wordId ?? null) &&
      (m.verbId ?? null) === (entry.verbId ?? null) &&
      (m.promptId ?? null) === (entry.promptId ?? null) &&
      (m.questionId ?? null) === (entry.questionId ?? null)
  );
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      ...entry,
      count: (list[idx].count || 1) + 1,
      addedAt: list[idx].addedAt || new Date().toISOString(),
      lastAt: new Date().toISOString(),
    };
  } else {
    list.push({
      ...entry,
      count: 1,
      addedAt: new Date().toISOString(),
      lastAt: new Date().toISOString(),
    });
  }
  safeWrite(KEYS.mistakes, list);
  return list;
}
export function removeMistake(predicate) {
  const list = getMistakes().filter((m) => !predicate(m));
  safeWrite(KEYS.mistakes, list);
  return list;
}
export function clearMistakes() {
  safeWrite(KEYS.mistakes, []);
}

// ---------- Best quiz score ----------
export function getBestScore() {
  return safeRead(KEYS.bestScore, 0);
}
export function setBestScore(score) {
  const best = getBestScore();
  if (score > best) {
    safeWrite(KEYS.bestScore, score);
    return score;
  }
  return best;
}

// ---------- Settings ----------
export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...safeRead(KEYS.settings, {}) };
}
export function saveSettings(next) {
  const merged = { ...getSettings(), ...next };
  safeWrite(KEYS.settings, merged);
  return merged;
}

// ---------- Bulk reset / export / import ----------
export function resetAllProgress() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

export function exportProgress() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    learnedWords: getLearnedWords(),
    practicedVerbs: getPracticedVerbs(),
    flashcards: getFlashcardStats(),
    mistakes: getMistakes(),
    bestScore: getBestScore(),
    settings: getSettings(),
  };
}

export function importProgress(data) {
  if (!data || typeof data !== "object") throw new Error("Invalid file.");
  if (Array.isArray(data.learnedWords)) safeWrite(KEYS.learnedWords, data.learnedWords);
  if (data.practicedVerbs) safeWrite(KEYS.practicedVerbs, data.practicedVerbs);
  if (data.flashcards) safeWrite(KEYS.flashcards, data.flashcards);
  if (Array.isArray(data.mistakes)) safeWrite(KEYS.mistakes, data.mistakes);
  if (typeof data.bestScore === "number") safeWrite(KEYS.bestScore, data.bestScore);
  if (data.settings) safeWrite(KEYS.settings, data.settings);
}
