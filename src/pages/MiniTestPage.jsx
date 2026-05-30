import { useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import quizQuestions from "../data/quizQuestions.js";
import words from "../data/words.js";
import { answersMatch, shuffle, fillBlank } from "../utils/practice.js";
import {
  setBestScore,
  getBestScore,
  addMistake,
  getSettings,
} from "../utils/storage.js";
import { getLessonById, quizForLesson } from "../data/lessons.js";

const TEST_SIZE = 10;

export default function MiniTestPage() {
  const [settings] = useState(() => getSettings());
  const lesson = getLessonById(settings.activeLesson);
  const [onlyLesson, setOnlyLesson] = useState(true);

  const pool = useMemo(() => {
    if (!onlyLesson) return quizQuestions;
    return quizForLesson(quizQuestions, lesson, words);
  }, [onlyLesson, lesson]);

  const [questions, setQuestions] = useState(() => buildSet(pool));
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState([]); // [{ ok, given }]
  const [typed, setTyped] = useState("");
  const [picked, setPicked] = useState(null);
  const [feedback, setFeedback] = useState(null); // { ok, correct }
  const [finished, setFinished] = useState(false);
  const [best, setBest] = useState(() => getBestScore());
  const inputRef = useRef(null);

  const q = questions[i];

  useEffect(() => {
    if (q?.type === "type-verb") inputRef.current?.focus();
  }, [i, q]);

  function submit(e) {
    e?.preventDefault();
    if (feedback) {
      goNext();
      return;
    }
    let ok = false;
    let given = "";
    if (q.type === "mc") {
      if (picked == null) return;
      given = picked;
      ok = picked === q.answer;
    } else {
      given = typed;
      ok = answersMatch(typed, q.answer);
    }
    setFeedback({ ok, correct: q.answer });
    setAnswers((arr) => [...arr, { ok, given }]);
    if (!ok) {
      addMistake({
        kind: "quiz",
        questionId: q.id,
        question: q.type === "type-verb"
          ? `${q.sentence} (${q.verb}, ${q.person})`
          : q.question,
        userAnswer: given,
        correctAnswer: q.answer,
      });
    }
  }

  function goNext() {
    if (i + 1 >= questions.length) {
      const score = answers.filter((a) => a.ok).length;
      const newBest = setBestScore(score);
      setBest(newBest);
      setFinished(true);
      return;
    }
    setI(i + 1);
    setPicked(null);
    setTyped("");
    setFeedback(null);
  }

  function restart() {
    setQuestions(buildSet(pool));
    setI(0);
    setAnswers([]);
    setTyped("");
    setPicked(null);
    setFeedback(null);
    setFinished(false);
  }

  // When the lesson scope changes (toggle), start a fresh test from the new pool.
  useEffect(() => {
    setQuestions(buildSet(pool));
    setI(0);
    setAnswers([]);
    setTyped("");
    setPicked(null);
    setFeedback(null);
    setFinished(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool]);

  if (finished) {
    const score = answers.filter((a) => a.ok).length;
    return (
      <FinishScreen
        score={score}
        total={questions.length}
        best={best}
        onRestart={restart}
      />
    );
  }

  const filterControls = (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
      <label className="flex items-center gap-2 text-sm muted cursor-pointer">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          checked={onlyLesson}
          onChange={(e) => setOnlyLesson(e.target.checked)}
        />
        Test only current lesson · <span className="chip-muted">L{lesson.id}: {lesson.title}</span>
      </label>
      <span className="text-xs muted">
        {onlyLesson
          ? `${pool.length} current lesson question${pool.length === 1 ? "" : "s"}`
          : `${pool.length} questions in pool`}
      </span>
    </div>
  );

  if (questions.length === 0) {
    return (
      <div className="space-y-5">
        <header className="flex items-end justify-between gap-3">
          <div>
            <h1 className="h1">Mini Test</h1>
            <p className="muted mt-1">No questions available for this lesson yet.</p>
          </div>
        </header>
        {filterControls}
        <Card className="text-center py-12">
          <div className="text-3xl">🌱</div>
          <h2 className="h2 mt-3">This lesson has no questions yet</h2>
          <p className="muted mt-2 max-w-md mx-auto">
            Turn off "Test only current lesson" to take a test from the full question pool,
            or switch lessons in Settings.
          </p>
        </Card>
      </div>
    );
  }

  const totalQ = questions.length;
  const isShort = onlyLesson && pool.length < TEST_SIZE;

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="h1">Mini Test</h1>
          <p className="muted mt-1">
            {totalQ} mixed question{totalQ === 1 ? "" : "s"}.
            {isShort ? " (Lesson is short — using all available.)" : ""} Take your time.
          </p>
        </div>
        <div className="text-sm muted">Best: <span className="font-semibold text-ink-800">{best}/{TEST_SIZE}</span></div>
      </header>

      {filterControls}

      <div className="h-2 w-full rounded-full bg-ink-100 overflow-hidden">
        <div
          className="h-full bg-brand-500 transition-all"
          style={{ width: `${((i) / totalQ) * 100}%` }}
        />
      </div>
      <div className="text-xs muted -mt-3">Question {i + 1} of {totalQ}</div>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <span className="chip-muted">{labelType(q.type)}</span>
        </div>

        {q.type === "mc" ? (
          <>
            <h2 className="h2">{q.question}</h2>
            <div className="mt-4 grid sm:grid-cols-2 gap-2">
              {q.options.map((opt) => {
                const isSelected = picked === opt;
                const showCorrect = feedback && opt === q.answer;
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
        ) : (
          <>
            <h2 className="h2">Type the correct verb form.</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip">verb · {q.verb}</span>
              <span className="chip-muted">person · {q.person}</span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-ink-900">
              {q.sentence}
            </p>
            <p className="muted text-sm mt-1">{q.translation}</p>
            <form onSubmit={submit} className="mt-4 flex flex-col sm:flex-row gap-2">
              <input
                ref={inputRef}
                className="input text-lg"
                placeholder="Type the verb form…"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                disabled={!!feedback}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {/* Hidden submit so Enter works */}
              <button type="submit" className="hidden" />
            </form>
          </>
        )}

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
              Answer: <span className="font-semibold">{q.type === "type-verb"
                ? fillBlank(q.sentence, q.answer)
                : q.answer}</span>
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex justify-end">
          {feedback ? (
            <Button onClick={goNext}>
              {i + 1 === questions.length ? "See result" : "Next →"}
            </Button>
          ) : (
            <Button
              onClick={submit}
              disabled={q.type === "mc" ? picked == null : typed.trim().length === 0}
            >
              Check
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function FinishScreen({ score, total, best, onRestart }) {
  const pct = Math.round((score / total) * 100);
  const message =
    pct === 100
      ? "Perfeito! Excellent work."
      : pct >= 80
      ? "Muito bom! You're getting it."
      : pct >= 50
      ? "Boa! Keep practicing."
      : "Bom começo. Repetition is the secret.";
  return (
    <div className="space-y-5">
      <h1 className="h1">Result</h1>
      <Card className="text-center py-10">
        <div className="text-6xl font-semibold tracking-tight text-ink-900">
          {score}<span className="text-ink-300">/{total}</span>
        </div>
        <div className="mt-2 text-lg text-brand-700 font-semibold">{pct}%</div>
        <p className="muted mt-3 max-w-md mx-auto">{message}</p>
        <div className="mt-4 text-xs muted">Best score saved: {best}/{total}</div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={onRestart}>Take another test</Button>
          <a className="btn-secondary" href="#/mistakes">Review mistakes →</a>
        </div>
      </Card>
    </div>
  );
}

function buildSet(pool) {
  if (!pool || pool.length === 0) return [];
  return shuffle(pool).slice(0, Math.min(TEST_SIZE, pool.length));
}

function labelType(t) {
  if (t === "mc") return "Multiple choice";
  if (t === "type-verb") return "Type the verb form";
  return t;
}
