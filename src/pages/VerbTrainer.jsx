import { useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import verbs, { practicePrompts } from "../data/verbs.js";
import { answersMatch, pickRandom, fillBlank } from "../utils/practice.js";
import {
  getPracticedVerbs,
  recordVerbResult,
  addMistake,
  getSettings,
} from "../utils/storage.js";
import { getLessonById, promptsForLesson } from "../data/lessons.js";

const PERSON_LABELS = {
  eu: "eu (I)",
  você: "você (you)",
  "a gente": "a gente (we, informal)",
  ele: "ele (he)",
  ela: "ela (she)",
  nós: "nós (we)",
  vocês: "vocês (you all)",
  eles: "eles (they m.)",
  elas: "elas (they f.)",
};

export default function VerbTrainer() {
  const verbMap = useMemo(() => Object.fromEntries(verbs.map((v) => [v.id, v])), []);
  const [settings] = useState(() => getSettings());
  const lesson = getLessonById(settings.activeLesson);
  const [onlyLesson, setOnlyLesson] = useState(true);

  const activePool = useMemo(() => {
    if (!onlyLesson) return practicePrompts;
    const pool = promptsForLesson(practicePrompts, lesson);
    return pool.length > 0 ? pool : practicePrompts;
  }, [onlyLesson, lesson]);

  const [stats, setStats] = useState(() => getPracticedVerbs());
  const [prompt, setPrompt] = useState(() => pickRandom(activePool));
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState(null); // { ok, correct, explanation }
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [prompt]);

  // When the user toggles the lesson filter, switch to a prompt from the new pool.
  useEffect(() => {
    if (!activePool.some((p) => p.id === prompt.id)) {
      setPrompt(pickRandom(activePool));
      setUserAnswer("");
      setFeedback(null);
      setShowHint(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePool]);

  const verb = verbMap[prompt.verb];

  function check(e) {
    e?.preventDefault();
    if (feedback) return next();
    const ok = answersMatch(userAnswer, prompt.answer);
    const newStats = recordVerbResult(ok);
    setStats(newStats);
    setFeedback({
      ok,
      correct: prompt.answer,
      explanation: buildExplanation(verb, prompt),
    });
    if (!ok) {
      addMistake({
        kind: "verb",
        promptId: prompt.id,
        verb: prompt.verb,
        person: prompt.person,
        sentence: prompt.sentence,
        userAnswer,
        correctAnswer: prompt.answer,
      });
    }
  }

  function next() {
    setPrompt(pickRandom(activePool, [prompt.id]));
    setUserAnswer("");
    setFeedback(null);
    setShowHint(false);
  }

  function skip() {
    setPrompt(pickRandom(activePool, [prompt.id]));
    setUserAnswer("");
    setFeedback(null);
    setShowHint(false);
  }

  const accuracy = stats.correct + stats.wrong > 0
    ? Math.round((stats.correct / (stats.correct + stats.wrong)) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h1">Verb Trainer</h1>
          <p className="muted mt-1">Present tense (presente do indicativo). Type the missing form.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="chip">✓ {stats.correct}</span>
          <span className="chip-muted">✗ {stats.wrong}</span>
          <span className="chip-muted">{accuracy}% accuracy</span>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <label className="flex items-center gap-2 text-sm muted cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            checked={onlyLesson}
            onChange={(e) => setOnlyLesson(e.target.checked)}
          />
          Practice only current lesson · <span className="chip-muted">L{lesson.id}: {lesson.title}</span>
        </label>
        <span className="text-xs muted">{activePool.length} prompts in pool</span>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-wrap gap-2">
            <span className="chip">verb · {verb.infinitive}</span>
            <span className="chip-muted">person · {PERSON_LABELS[prompt.person]}</span>
            <span className="chip-muted">{verb.irregular ? "irregular" : "regular"}</span>
          </div>
          <span className="text-xs muted hidden sm:block">{verb.english}</span>
        </div>

        <p className="text-2xl sm:text-3xl font-semibold text-ink-900 leading-snug">
          {renderSentence(prompt.sentence, userAnswer, feedback)}
        </p>
        <p className="muted text-sm mt-1.5">{prompt.translation}</p>

        <form onSubmit={check} className="mt-5 flex flex-col sm:flex-row gap-2">
          <input
            ref={inputRef}
            className="input text-lg"
            placeholder="Type the verb form…"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={!!feedback}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {feedback ? (
            <Button type="button" onClick={next}>Next →</Button>
          ) : (
            <Button type="submit">Check</Button>
          )}
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="ghost" onClick={skip} disabled={!!feedback}>Skip</Button>
          <Button variant="ghost" onClick={() => setShowHint((s) => !s)} disabled={!!feedback}>
            {showHint ? "Hide hint" : "Show hint"}
          </Button>
        </div>

        {showHint && !feedback ? (
          <div className="mt-3 p-3 rounded-xl bg-sand-100 border border-sand-200 text-sm text-ink-700">
            Starts with <span className="font-mono">{prompt.answer[0]}</span>, has{" "}
            <span className="font-mono">{prompt.answer.length}</span> letters.
          </div>
        ) : null}

        {feedback ? (
          <div
            className={`mt-4 p-4 rounded-xl border ${
              feedback.ok
                ? "bg-brand-50 border-brand-200"
                : "bg-rose-50 border-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-7 w-7 rounded-full items-center justify-center font-bold text-white ${
                  feedback.ok ? "bg-brand-600" : "bg-rose-500"
                }`}
              >
                {feedback.ok ? "✓" : "!"}
              </span>
              <h3 className="font-semibold">
                {feedback.ok ? "Correct" : "Not quite"}
              </h3>
            </div>
            <p className="mt-2 text-ink-800">
              Correct sentence:{" "}
              <span className="font-semibold">
                {fillBlank(prompt.sentence, feedback.correct)}
              </span>
            </p>
            <p className="text-sm muted mt-1">{feedback.explanation}</p>
          </div>
        ) : null}
      </Card>

      <Card>
        <h3 className="h3">Conjugation: {verb.infinitive} <span className="muted text-sm font-normal">— {verb.english}</span></h3>
        {verb.intro ? (
          <div className="mt-3 p-3 rounded-xl bg-brand-50/60 border border-brand-100 text-sm text-ink-800">
            <span className="font-semibold">Beginner tip:</span> {verb.intro}
          </div>
        ) : null}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(verb.forms).map(([person, form]) => (
            <div key={person} className="p-3 rounded-xl border border-ink-100 bg-sand-50">
              <div className="text-[11px] uppercase tracking-wide text-ink-500">{person}</div>
              <div className="text-lg font-semibold text-ink-900">{form}</div>
            </div>
          ))}
        </div>
        {verb.note ? (
          <p className="mt-3 text-sm text-ink-600">
            <span className="font-semibold">Note:</span> {verb.note}
          </p>
        ) : null}
      </Card>
    </div>
  );
}

function renderSentence(sentence, userAnswer, feedback) {
  const parts = sentence.split("___");
  const display = feedback ? feedback.correct : (userAnswer || "____");
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

function buildExplanation(verb, prompt) {
  return `For "${verb.infinitive}" (${verb.english}), the form for "${prompt.person}" is "${verb.forms[prompt.person]}".`;
}
