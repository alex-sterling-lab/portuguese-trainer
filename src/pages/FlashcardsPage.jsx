import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import words from "../data/words.js";
import { pickRandom } from "../utils/practice.js";
import {
  getFlashcardStats,
  recordFlashcardResult,
  addMistake,
  getSettings,
} from "../utils/storage.js";

export default function FlashcardsPage() {
  const [stats, setStats] = useState(() => getFlashcardStats());
  const [card, setCard] = useState(() => pickRandom(words));
  const [flipped, setFlipped] = useState(false);
  const [settings] = useState(() => getSettings());

  function next() {
    setCard(pickRandom(words, [card.id]));
    setFlipped(false);
  }

  function knew() {
    const s = recordFlashcardResult(card.id, true);
    setStats(s);
    next();
  }

  function forgot() {
    const s = recordFlashcardResult(card.id, false);
    setStats(s);
    addMistake({ kind: "flash", wordId: card.id });
    next();
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
      if (flipped && (e.key === "1" || e.key.toLowerCase() === "f")) forgot();
      if (flipped && (e.key === "2" || e.key.toLowerCase() === "k")) knew();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, card]);

  const total = stats.remembered.length + stats.forgotten.length;
  const recallPct = total ? Math.round((stats.remembered.length / total) * 100) : 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h1">Flashcards</h1>
          <p className="muted mt-1">Show the Portuguese word, recall the meaning, then flip.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="chip">Seen {stats.seen}</span>
          <span className="chip-muted">Remembered {stats.remembered.length}</span>
          <span className="chip-muted">{recallPct}% recall</span>
        </div>
      </header>

      <div className="flex flex-col items-center gap-5">
        <div
          className="flip-scene w-full max-w-xl"
          onClick={() => setFlipped((f) => !f)}
          role="button"
          tabIndex={0}
          aria-label="Flip card"
        >
          <div className={`flip-card relative w-full h-72 sm:h-80 ${flipped ? "is-flipped" : ""}`}>
            {/* Front */}
            <div className="flip-face absolute inset-0">
              <div className="card h-full flex flex-col items-center justify-center text-center p-6">
                <span className="chip-muted">{card.category}</span>
                <h2 className="mt-3 text-4xl sm:text-5xl font-semibold text-ink-900">
                  {card.portuguese}
                </h2>
                {settings.showPronunciation ? (
                  <div className="mt-2 text-sm font-mono text-ink-500">{card.pronunciation}</div>
                ) : null}
                <div className="mt-6 text-xs muted">Tap or press space to flip</div>
              </div>
            </div>
            {/* Back */}
            <div className="flip-face flip-back absolute inset-0">
              <div className="card h-full flex flex-col items-center justify-center text-center p-6 bg-brand-50/40">
                <span className="chip">English</span>
                <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-ink-900">
                  {card.english}
                </h2>
                <div className="mt-4 px-4">
                  <p className="text-ink-800">{card.examplePt}</p>
                  <p className="text-sm muted mt-0.5">{card.exampleEn}</p>
                </div>
                {card.noteEu ? (
                  <p className="mt-3 text-[11px] text-ink-500 max-w-md">
                    <span className="font-semibold">EU PT:</span> {card.noteEu}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 w-full max-w-xl">
          <Button variant="secondary" onClick={() => setFlipped((f) => !f)}>
            Flip card
          </Button>
          <Button variant="danger" onClick={forgot} disabled={!flipped}>
            I forgot
          </Button>
          <Button onClick={knew} disabled={!flipped}>
            I knew it
          </Button>
          <Button variant="ghost" onClick={next}>
            Skip →
          </Button>
        </div>
      </div>
    </div>
  );
}
