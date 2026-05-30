import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import words from "../data/words.js";
import verbs from "../data/verbs.js";
import { pickRandom } from "../utils/practice.js";
import {
  getFlashcardStats,
  recordFlashcardResult,
  addMistake,
  getSettings,
} from "../utils/storage.js";
import { getLessonById, wordsForLesson, verbsForLesson } from "../data/lessons.js";
import { verbToCard, wordToCard } from "../utils/verbCards.js";

export default function FlashcardsPage() {
  const [settings] = useState(() => getSettings());
  const lesson = getLessonById(settings.activeLesson);
  const [onlyLesson, setOnlyLesson] = useState(true);

  // Deck: word cards + verb cards. Verb cards go first so beginners encounter
  // useful conjugated forms ("eu tenho") rather than bare infinitives.
  // We strip "Useful verbs" word entries from the vocab side — they overlap with the
  // verb cards and would otherwise show up as confusing infinitive-only flashcards.
  const deck = useMemo(() => {
    const nonVerbWords = words.filter((w) => w.category !== "Useful verbs");
    if (onlyLesson) {
      const lWords = wordsForLesson(nonVerbWords, lesson).map(wordToCard);
      const lVerbs = verbsForLesson(verbs, lesson).map(verbToCard);
      const combined = [...lVerbs, ...lWords];
      return combined.length > 0
        ? combined
        : [...verbs.map(verbToCard), ...nonVerbWords.map(wordToCard)];
    }
    return [...verbs.map(verbToCard), ...nonVerbWords.map(wordToCard)];
  }, [onlyLesson, lesson]);

  const [stats, setStats] = useState(() => getFlashcardStats());
  const [card, setCard] = useState(() => pickRandom(deck));
  const [flipped, setFlipped] = useState(false);

  function next() {
    setCard(pickRandom(deck, [card.id]));
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
    if (card.type === "word") {
      const numericId = Number(String(card.id).replace("word-", ""));
      if (Number.isFinite(numericId)) addMistake({ kind: "flash", wordId: numericId });
    } else if (card.type === "verb") {
      const verbId = String(card.id).replace("verb-", "");
      if (verbId) addMistake({ kind: "flash", verbId });
    }
    next();
  }

  // Toggling the lesson scope: if the current card is no longer in the deck, swap.
  useEffect(() => {
    if (!deck.some((c) => c.id === card.id)) {
      setCard(pickRandom(deck));
      setFlipped(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck]);

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
          <p className="muted mt-1">Verb cards show useful forms ("eu tenho"), not just infinitives.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="chip">Seen {stats.seen}</span>
          <span className="chip-muted">Remembered {stats.remembered.length}</span>
          <span className="chip-muted">{recallPct}% recall</span>
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
          Current lesson only · <span className="chip-muted">L{lesson.id}: {lesson.title}</span>
        </label>
        <span className="text-xs muted">{deck.length} cards in deck</span>
      </div>

      <div className="flex flex-col items-center gap-5">
        <div
          className="flip-scene w-full max-w-xl"
          onClick={() => setFlipped((f) => !f)}
          role="button"
          tabIndex={0}
          aria-label="Flip card"
        >
          <div className={`flip-card relative w-full h-80 sm:h-[22rem] ${flipped ? "is-flipped" : ""}`}>
            <div className="flip-face absolute inset-0">
              {card.type === "verb"
                ? <VerbCardFront card={card} />
                : <WordCardFront card={card} showPronunciation={settings.showPronunciation} />}
            </div>
            <div className="flip-face flip-back absolute inset-0">
              {card.type === "verb"
                ? <VerbCardBack card={card} />
                : <WordCardBack card={card} />}
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

function WordCardFront({ card, showPronunciation }) {
  return (
    <div className="card h-full flex flex-col items-center justify-center text-center p-6">
      <span className="chip-muted">{card.category}</span>
      <h2 className="mt-3 text-4xl sm:text-5xl font-semibold text-ink-900">
        {card.portuguese}
      </h2>
      {showPronunciation ? (
        <div className="mt-2 text-sm font-mono text-ink-500">{card.pronunciation}</div>
      ) : null}
      <div className="mt-6 text-xs muted">Tap or press space to flip</div>
    </div>
  );
}

function WordCardBack({ card }) {
  return (
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
  );
}

function VerbCardFront({ card }) {
  return (
    <div className="card h-full flex flex-col items-center justify-center text-center p-6">
      <span className="chip-muted">Useful verb</span>
      <h2 className="mt-3 text-5xl sm:text-6xl font-semibold text-ink-900">
        {card.infinitive}
      </h2>
      <div className="mt-2 text-lg text-ink-700">{card.english}</div>
      <div className="mt-3 text-xs muted italic">infinitive form</div>
      <div className="mt-3 px-4 max-w-xs text-[12px] text-ink-600 leading-relaxed">
        This is the base form, not the "I" form. Flip to see how it changes.
      </div>
      <div className="mt-4 text-xs muted">Tap or press space to flip</div>
    </div>
  );
}

function VerbCardBack({ card }) {
  return (
    <div className="card h-full flex flex-col items-start text-left p-5 sm:p-6 bg-brand-50/40 overflow-y-auto">
      <div className="flex items-center justify-between w-full">
        <span className="chip">Useful beginner forms</span>
        <span className="text-xs muted">{card.infinitive} · {card.english}</span>
      </div>
      <div className="mt-3 w-full divide-y divide-brand-100/70">
        {card.forms.map((f) => (
          <div key={f.pt} className="flex items-baseline justify-between py-1.5">
            <span className="font-semibold text-ink-900">{f.pt}</span>
            <span className="text-sm muted">{f.en}</span>
          </div>
        ))}
      </div>
      {card.examples.length > 0 ? (
        <div className="mt-3 w-full">
          <div className="label">Examples</div>
          <ul className="mt-1.5 space-y-1">
            {card.examples.map((e, i) => (
              <li key={i} className="text-sm">
                <span className="text-ink-900 font-medium">{e.pt}</span>{" "}
                <span className="muted">— {e.en}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="mt-3 text-[12px] text-ink-600 leading-relaxed">
        <span className="font-semibold">Note:</span> {card.note}
      </p>
    </div>
  );
}
