import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import words, { categories } from "../data/words.js";
import {
  getLearnedWords,
  toggleLearnedWord,
  getSettings,
} from "../utils/storage.js";
import { getLessonById, wordsForLesson } from "../data/lessons.js";

export default function WordsPage() {
  const [learned, setLearned] = useState(() => getLearnedWords());
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [onlyUnlearned, setOnlyUnlearned] = useState(false);
  const [settings] = useState(() => getSettings());
  const lesson = getLessonById(settings.activeLesson);
  const [onlyLesson, setOnlyLesson] = useState(false);

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const learnedCount = learned.length;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h1">Words</h1>
          <p className="muted mt-1">
            {words.length} beginner words ·{" "}
            <span className="font-semibold text-ink-700">{learnedCount} learned</span>
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 text-sm muted cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              checked={onlyLesson}
              onChange={(e) => setOnlyLesson(e.target.checked)}
            />
            Show only current lesson <span className="chip-muted">L{lesson.id}</span>
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
      </header>

      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              className="input"
              placeholder="Search Portuguese or English…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
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

      {filtered.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <div className="h3">No words match</div>
            <p className="muted mt-1 text-sm">
              Try a different search or category.
            </p>
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
