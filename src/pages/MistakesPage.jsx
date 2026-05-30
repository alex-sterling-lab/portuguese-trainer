import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import words from "../data/words.js";
import verbs from "../data/verbs.js";
import {
  getMistakes,
  removeMistake,
  clearMistakes,
} from "../utils/storage.js";

export default function MistakesPage() {
  const [list, setList] = useState(() => getMistakes());
  const wordMap = useMemo(() => Object.fromEntries(words.map((w) => [w.id, w])), []);
  const verbMap = useMemo(() => Object.fromEntries(verbs.map((v) => [v.id, v])), []);

  function refresh() { setList(getMistakes()); }

  function removeOne(m) {
    setList(removeMistake((x) =>
      x.kind === m.kind &&
      (x.wordId ?? null) === (m.wordId ?? null) &&
      (x.promptId ?? null) === (m.promptId ?? null) &&
      (x.questionId ?? null) === (m.questionId ?? null)
    ));
  }

  function clearAll() {
    if (confirm("Clear all mistakes? This can't be undone.")) {
      clearMistakes();
      refresh();
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h1">Mistakes</h1>
          <p className="muted mt-1">Repeat what tripped you up. Items are saved locally.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/verbs" className="btn-secondary">Practice verbs</Link>
          <Link to="/flashcards" className="btn-secondary">Practice flashcards</Link>
          <Button variant="danger" onClick={clearAll} disabled={list.length === 0}>
            Clear all
          </Button>
        </div>
      </header>

      {list.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-3xl">🌱</div>
          <h2 className="h2 mt-3">No mistakes saved</h2>
          <p className="muted mt-2 max-w-md mx-auto">
            As you practice verbs, flashcards, and mini tests, anything you get wrong
            shows up here so you can come back and master it.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link to="/verbs" className="btn-primary">Start verbs</Link>
            <Link to="/test" className="btn-secondary">Take a test</Link>
          </div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {[...list]
            .sort((a, b) => (b.count || 1) - (a.count || 1))
            .map((m, idx) => (
              <MistakeCard
                key={idx}
                m={m}
                wordMap={wordMap}
                verbMap={verbMap}
                onRemove={() => removeOne(m)}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function MistakeCard({ m, wordMap, verbMap, onRemove }) {
  let title = "";
  let body = null;
  let answer = m.correctAnswer;
  let kind = m.kind;

  if (m.kind === "vocab") {
    const w = wordMap[m.wordId];
    title = w ? w.portuguese : "Word";
    answer = w?.english || m.correctAnswer;
    body = w ? <p className="muted text-sm">{w.examplePt} — <em>{w.exampleEn}</em></p> : null;
  } else if (m.kind === "verb") {
    const v = verbMap[m.verb];
    title = `${m.sentence}`;
    body = (
      <p className="muted text-sm">
        Verb <span className="font-mono">{m.verb}</span>{" "}
        ({v ? v.english : ""}) · person <span className="font-mono">{m.person}</span>
      </p>
    );
  } else if (m.kind === "quiz") {
    title = m.question;
  } else if (m.kind === "flash") {
    const w = wordMap[m.wordId];
    title = w ? w.portuguese : "Word";
    answer = w?.english || "";
    body = w ? <p className="muted text-sm">{w.examplePt} — <em>{w.exampleEn}</em></p> : null;
  }

  return (
    <article className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="chip-muted">{labelKind(kind)}</span>
          <h3 className="h3 mt-2">{title}</h3>
          {body}
          <div className="mt-2 text-sm">
            {m.userAnswer ? (
              <span className="text-rose-700">
                Your answer: <span className="font-mono">{m.userAnswer || "—"}</span>
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-sm">
            <span className="text-brand-700">
              Correct: <span className="font-semibold">{answer}</span>
            </span>
          </div>
          <div className="mt-2 text-xs muted">
            Missed {m.count}× · last on {formatDate(m.lastAt || m.addedAt)}
          </div>
        </div>
        <button
          onClick={onRemove}
          className="text-ink-400 hover:text-rose-600 text-sm"
          title="Remove from mistakes"
          aria-label="Remove"
        >
          ✕
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <PracticeAgainLink kind={kind} />
      </div>
    </article>
  );
}

function PracticeAgainLink({ kind }) {
  const to =
    kind === "verb" ? "/verbs"
    : kind === "quiz" ? "/test"
    : "/flashcards";
  return (
    <Link to={to} className="btn-secondary">Practice again →</Link>
  );
}

function labelKind(k) {
  return k === "verb" ? "Verb form"
    : k === "quiz" ? "Quiz question"
    : k === "vocab" ? "Vocabulary"
    : "Flashcard";
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}
