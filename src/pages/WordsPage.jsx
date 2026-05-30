import { useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import words, { categories } from "../data/words.js";
import {
  getLearnedWords,
  toggleLearnedWord,
  getSettings,
  saveSettings,
  getPracticedWords,
  recordWordResult,
  addMistake,
} from "../utils/storage.js";
import lessons, { getLessonById, wordsForLesson } from "../data/lessons.js";
import { answersMatch } from "../utils/practice.js";
import {
  buildWordDeck,
  exerciseKey,
  EXERCISE_KIND_LABELS,
} from "../utils/wordExercises.js";

const TABS = [
  { id: "train",  label: "Train" },
  { id: "browse", label: "Browse" },
];

export default function WordsPage() {
  const [tab, setTab] = useState("train");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h1">Words</h1>
          <p className="muted mt-1">
            Active vocabulary practice — 4 different exercise types per word.
          </p>
        </div>
      </header>

      <div className="inline-flex rounded-xl bg-ink-100 p-1 text-sm">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg font-medium transition ${
              tab === t.id
                ? "bg-white text-ink-900 shadow-soft"
                : "text-ink-600 hover:text-ink-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "train" ? <TrainTab /> : <BrowseTab />}
    </div>
  );
}

/* ============================== TRAIN ============================== */

function pickDue(deck, seen, excludeKey) {
  const due = deck.filter((ex) => !seen[exerciseKey(ex)]);
  if (due.length === 0) return null;
  const others = due.filter((ex) => exerciseKey(ex) !== excludeKey);
  const pool = others.length > 0 ? others : due;
  return pool[Math.floor(Math.random() * pool.length)];
}

function TrainTab() {
  const [activeLessonId, setActiveLessonId] = useState(() => getSettings().activeLesson || 1);
  const lesson = getLessonById(activeLessonId);
  const nextLesson = lessons.find((l) => l.id === activeLessonId + 1) || null;
  const [onlyLesson, setOnlyLesson] = useState(true);
  const [activeCat, setActiveCat] = useState("All");

  // Vocabulary pool for the current scope.
  const wordsInScope = useMemo(() => {
    const base = onlyLesson ? wordsForLesson(words, lesson) : words;
    const filtered = activeCat === "All" ? base : base.filter((w) => w.category === activeCat);
    return filtered;
  }, [onlyLesson, lesson, activeCat]);

  // Build the deck = every word × every exercise kind.
  const deck = useMemo(() => buildWordDeck(wordsInScope, words), [wordsInScope]);

  const [stats, setStats] = useState(() => getPracticedWords());
  const [seen, setSeen] = useState({}); // {exerciseKey: true}
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [ex, setEx] = useState(() => pickDue(deck, {}, null));
  const [typed, setTyped] = useState("");
  const [picked, setPicked] = useState(null);
  const [feedback, setFeedback] = useState(null); // { ok, correct }
  const inputRef = useRef(null);
  const nextBtnRef = useRef(null);

  // Round resets when the pool changes (lesson, category, scope toggle).
  useEffect(() => {
    setSeen({});
    setRoundCorrect(0);
    setEx(pickDue(deck, {}, null));
    setTyped("");
    setPicked(null);
    setFeedback(null);
  }, [deck]);

  // Focus the input on a typing exercise.
  useEffect(() => {
    if (!feedback && ex && (ex.kind === "type-pt-en" || ex.kind === "fill-pt")) {
      inputRef.current?.focus();
    }
  }, [ex, feedback]);

  // Focus the "Next →" button after answer so Enter advances.
  useEffect(() => {
    if (feedback) nextBtnRef.current?.focus();
  }, [feedback]);

  const totalThisRound = deck.length;
  const doneThisRound = Object.keys(seen).length;
  const roundComplete = ex == null && totalThisRound > 0;
  const pct = totalThisRound > 0 ? Math.round((doneThisRound / totalThisRound) * 100) : 0;

  function evaluate() {
    if (!ex) return null;
    if (ex.kind === "mc-pt-en" || ex.kind === "mc-en-pt") {
      if (picked == null) return null;
      return { ok: picked === ex.answer, given: picked };
    }
    const given = typed;
    if (!given.trim()) return null;
    // For free-text English we accept the variants ("cool" or "nice" for "cool / nice").
    if (ex.kind === "type-pt-en") {
      const accepted = ex.acceptedAnswers || [ex.answer];
      const ok = accepted.some((a) => answersMatch(given, a));
      return { ok, given };
    }
    return { ok: answersMatch(given, ex.answer), given };
  }

  function submit(e) {
    e?.preventDefault();
    if (feedback) {
      goNext();
      return;
    }
    const result = evaluate();
    if (!result) return;
    setStats(recordWordResult(result.ok));
    setSeen((s) => ({ ...s, [exerciseKey(ex)]: true }));
    if (result.ok) setRoundCorrect((c) => c + 1);
    setFeedback({ ok: result.ok, correct: ex.answer });
    if (!result.ok) {
      addMistake({
        kind: "vocab",
        wordId: ex.wordId,
        exerciseKind: ex.kind,
        userAnswer: result.given,
        correctAnswer: ex.answer,
      });
    }
  }

  function goNext() {
    const nextEx = pickDue(deck, seen, ex ? exerciseKey(ex) : null);
    setEx(nextEx);
    setTyped("");
    setPicked(null);
    setFeedback(null);
  }

  function newRound() {
    setSeen({});
    setRoundCorrect(0);
    setEx(pickDue(deck, {}, null));
    setTyped("");
    setPicked(null);
    setFeedback(null);
  }

  function goToLesson(id) {
    const target = getLessonById(id);
    if (!target) return;
    setActiveLessonId(target.id);
    saveSettings({ activeLesson: target.id });
  }

  const accuracy = stats.correct + stats.wrong > 0
    ? Math.round((stats.correct / (stats.correct + stats.wrong)) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* All-time stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="chip">✓ {stats.correct}</span>
          <span className="chip-muted">✗ {stats.wrong}</span>
          <span className="chip-muted">{accuracy}% accuracy</span>
        </div>
        <span className="text-xs muted">{wordsInScope.length} words · {deck.length} exercises in round</span>
      </div>

      {/* Scope controls */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm muted cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              checked={onlyLesson}
              onChange={(e) => setOnlyLesson(e.target.checked)}
            />
            Only current lesson · <span className="chip-muted">L{lesson.id}: {lesson.title}</span>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                activeCat === cat
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-ink-700 border-ink-200 hover:border-brand-300 hover:text-brand-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </Card>

      {/* Round progress */}
      <div>
        <div className="flex items-center justify-between text-xs muted mb-1.5">
          <span>
            Round progress · {doneThisRound} of {totalThisRound} exercises
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-ink-100 overflow-hidden">
          <div
            className="h-full bg-brand-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {roundComplete ? (
        <Card className="text-center py-10">
          <div className="text-3xl">🌿</div>
          <h2 className="h2 mt-3">Round complete</h2>
          <p className="muted mt-2 max-w-md mx-auto">
            {roundCorrect}/{totalThisRound} correct
            {totalThisRound > 0 ? ` (${Math.round((roundCorrect / totalThisRound) * 100)}%)` : ""}
            . Each word went through every exercise type once.
          </p>

          {nextLesson ? (
            <div className="mt-5 inline-flex flex-col items-center gap-1 p-4 rounded-2xl bg-brand-50/70 border border-brand-100 max-w-md">
              <div className="text-xs uppercase tracking-wide text-brand-700/80 font-semibold">
                Next up
              </div>
              <div className="text-lg font-semibold text-ink-900">
                Lesson {nextLesson.id}: {nextLesson.title}
              </div>
              <div className="text-sm muted">{nextLesson.subtitle}</div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {nextLesson ? (
              <Button onClick={() => goToLesson(nextLesson.id)}>
                Continue to Lesson {nextLesson.id} →
              </Button>
            ) : (
              <Button onClick={() => { setOnlyLesson(false); }}>
                Practice everything (mixed) →
              </Button>
            )}
            <Button variant="secondary" onClick={newRound}>Repeat this lesson</Button>
            <a className="btn-ghost" href="#/verbs">Verb trainer</a>
            <a className="btn-ghost" href="#/mistakes">Mistakes</a>
          </div>
        </Card>
      ) : !ex ? (
        <Card className="text-center py-10">
          <h2 className="h2">No words in this scope</h2>
          <p className="muted mt-2 max-w-md mx-auto">
            Try a different category, or turn off "Only current lesson" to practice the
            full vocabulary.
          </p>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="chip-muted">{EXERCISE_KIND_LABELS[ex.kind]}</span>
            <span className="chip-muted">{ex.word.category}</span>
          </div>

          <ExerciseBody
            ex={ex}
            picked={picked}
            setPicked={setPicked}
            typed={typed}
            setTyped={setTyped}
            feedback={feedback}
            inputRef={inputRef}
            onSubmit={submit}
          />

          {feedback ? (
            <div
              className={`mt-4 p-3 rounded-xl border ${
                feedback.ok
                  ? "bg-brand-50 border-brand-200"
                  : "bg-rose-50 border-rose-200"
              }`}
            >
              <div className="font-semibold">
                {feedback.ok ? "Correct ✓" : "Not quite"}
              </div>
              <div className="text-sm text-ink-700">
                Answer: <span className="font-semibold">{ex.answer}</span>
                {ex.kind === "type-pt-en" && ex.acceptedAnswers && ex.acceptedAnswers.length > 1 ? (
                  <span className="muted"> · also accepted: {ex.acceptedAnswers.slice(1).join(", ")}</span>
                ) : null}
              </div>
              {ex.word.examplePt ? (
                <div className="mt-1.5 text-sm">
                  <span className="font-medium text-ink-800">{ex.word.examplePt}</span>
                  <span className="muted"> — {ex.word.exampleEn}</span>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 flex justify-end">
            {feedback ? (
              <Button onClick={goNext} ref={nextBtnRef}>Next →</Button>
            ) : (
              <Button
                onClick={submit}
                disabled={
                  ex.kind === "mc-pt-en" || ex.kind === "mc-en-pt"
                    ? picked == null
                    : !typed.trim()
                }
              >
                Check
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function ExerciseBody({ ex, picked, setPicked, typed, setTyped, feedback, inputRef, onSubmit }) {
  if (ex.kind === "mc-pt-en" || ex.kind === "mc-en-pt") {
    return (
      <>
        <h2 className="h2">{ex.question}</h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-2">
          {ex.options.map((opt) => {
            const isSelected = picked === opt;
            const showCorrect = feedback && opt === ex.answer;
            const showWrong = feedback && isSelected && !feedback.ok;
            return (
              <button
                key={opt}
                onClick={() => !feedback && setPicked(opt)}
                disabled={!!feedback}
                className={`text-left p-3.5 rounded-xl border transition ${
                  showCorrect
                    ? "border-brand-400 bg-brand-50"
                    : showWrong
                    ? "border-rose-300 bg-rose-50"
                    : isSelected
                    ? "border-brand-500 bg-brand-50/60"
                    : "border-ink-200 bg-white hover:border-brand-300"
                }`}
              >
                <span className="font-medium text-ink-900">{opt}</span>
              </button>
            );
          })}
        </div>
      </>
    );
  }

  if (ex.kind === "type-pt-en") {
    return (
      <>
        <div className="text-xs uppercase tracking-wide muted">Portuguese</div>
        <h2 className="text-3xl sm:text-4xl font-semibold text-ink-900 mt-1">{ex.prompt}</h2>
        {ex.pronunciation ? (
          <div className="mt-1 text-sm font-mono text-ink-500">{ex.pronunciation}</div>
        ) : null}
        <p className="mt-3 text-sm muted">Type the English meaning.</p>
        <form onSubmit={onSubmit} className="mt-3">
          <input
            ref={inputRef}
            className="input text-lg"
            placeholder="Type in English…"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={!!feedback}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button type="submit" className="hidden" />
        </form>
      </>
    );
  }

  if (ex.kind === "fill-pt") {
    return (
      <>
        <div className="text-xs uppercase tracking-wide muted">Fill in the Portuguese word</div>
        <p className="text-2xl sm:text-3xl font-semibold text-ink-900 leading-snug mt-1">
          {renderFill(ex.sentence, typed, feedback)}
        </p>
        {ex.translation ? (
          <p className="muted text-sm mt-1.5">{ex.translation}</p>
        ) : null}
        <form onSubmit={onSubmit} className="mt-3">
          <input
            ref={inputRef}
            className="input text-lg"
            placeholder="Type the Portuguese word…"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={!!feedback}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button type="submit" className="hidden" />
        </form>
      </>
    );
  }

  return null;
}

function renderFill(sentence, typed, feedback) {
  const parts = sentence.split("___");
  const display = feedback ? feedback.correct : (typed || "____");
  return (
    <>
      {parts[0]}
      <span
        className={`px-2 py-0.5 rounded-md ${
          feedback
            ? feedback.ok
              ? "bg-brand-100 text-brand-800"
              : "bg-rose-100 text-rose-800"
            : "bg-sand-200 text-ink-700"
        }`}
      >
        {display}
      </span>
      {parts[1]}
    </>
  );
}

/* ============================== BROWSE ============================== */

function BrowseTab() {
  const [learned, setLearned] = useState(() => getLearnedWords());
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [onlyUnlearned, setOnlyUnlearned] = useState(false);
  const [settings] = useState(() => getSettings());
  const lesson = getLessonById(settings.activeLesson);
  const [onlyLesson, setOnlyLesson] = useState(true);

  const lessonWordSet = useMemo(() => {
    return new Set(wordsForLesson(words, lesson).map((w) => w.id));
  }, [lesson]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return words.filter((w) => {
      if (onlyLesson && !lessonWordSet.has(w.id)) return false;
      if (activeCat !== "All" && w.category !== activeCat) return false;
      if (onlyUnlearned && learned.includes(w.id)) return false;
      if (!q) return true;
      return (
        w.portuguese.toLowerCase().includes(q) ||
        w.english.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q)
      );
    });
  }, [query, activeCat, onlyUnlearned, learned, onlyLesson, lessonWordSet]);

  function onToggle(id) {
    setLearned(toggleLearnedWord(id));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="text-sm muted">
          {words.length} beginner words ·{" "}
          <span className="font-semibold text-ink-700">{learned.length} learned</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 text-sm muted cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              checked={onlyLesson}
              onChange={(e) => setOnlyLesson(e.target.checked)}
            />
            Only current lesson <span className="chip-muted">L{lesson.id}</span>
          </label>
          <label className="flex items-center gap-2 text-sm muted cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              checked={onlyUnlearned}
              onChange={(e) => setOnlyUnlearned(e.target.checked)}
            />
            Hide learned
          </label>
        </div>
      </div>

      <Card className="!p-4">
        <input
          className="input"
          placeholder="Search Portuguese or English…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                activeCat === cat
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-ink-700 border-ink-200 hover:border-brand-300 hover:text-brand-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <div className="h3">No words match</div>
            <p className="muted mt-1 text-sm">Try a different search or category.</p>
          </div>
        </Card>
      ) : (
        <div className={`grid gap-3 ${settings.compactMode ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}>
          {filtered.map((w) => (
            <WordCard
              key={w.id}
              word={w}
              isLearned={learned.includes(w.id)}
              onToggle={() => onToggle(w.id)}
              showPronunciation={settings.showPronunciation}
              compact={settings.compactMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WordCard({ word, isLearned, onToggle, showPronunciation, compact }) {
  return (
    <article
      className={`card transition ${
        isLearned ? "border-brand-200 bg-brand-50/40" : ""
      } ${compact ? "p-4" : "p-5"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-semibold text-ink-900">{word.portuguese}</h3>
            <span className="chip-muted">{word.category}</span>
            {isLearned ? <span className="chip">Learned</span> : null}
          </div>
          <div className="muted text-sm mt-0.5">{word.english}</div>
          {showPronunciation ? (
            <div className="mt-1 text-xs text-ink-500">
              <span className="font-mono">{word.pronunciation}</span>
            </div>
          ) : null}
        </div>
        <button
          onClick={onToggle}
          className={`shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-lg border transition ${
            isLearned
              ? "bg-brand-600 text-white border-brand-600 hover:bg-brand-700"
              : "bg-white text-ink-500 border-ink-200 hover:border-brand-400 hover:text-brand-700"
          }`}
          title={isLearned ? "Mark as not learned" : "Mark as learned"}
          aria-label={isLearned ? "Mark as not learned" : "Mark as learned"}
        >
          ✓
        </button>
      </div>

      <div className="mt-3 p-3 rounded-xl bg-sand-100/70 border border-sand-200">
        <div className="text-sm text-ink-800">{word.examplePt}</div>
        <div className="text-xs muted mt-0.5">{word.exampleEn}</div>
      </div>

      {word.noteEu ? (
        <div className="mt-2 text-[11px] text-ink-500">
          <span className="font-semibold">EU PT:</span> {word.noteEu}
        </div>
      ) : null}
    </article>
  );
}
