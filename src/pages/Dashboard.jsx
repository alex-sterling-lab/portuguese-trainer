import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Card from "../components/Card.jsx";
import ProgressCard from "../components/ProgressCard.jsx";
import words from "../data/words.js";
import verbs from "../data/verbs.js";
import {
  getLearnedWords,
  getPracticedVerbs,
  getFlashcardStats,
  getMistakes,
  getBestScore,
  getSettings,
} from "../utils/storage.js";
import { getLessonById } from "../data/lessons.js";

const DAILY_PLAN = [
  { to: "/words",      label: "Review current lesson words",  hint: "Vocabulary" },
  { to: "/verbs",      label: "Practice current lesson verbs", hint: "Verb trainer" },
  { to: "/flashcards", label: "Do current lesson flashcards",  hint: "Recall practice" },
  { to: "/mistakes",   label: "Repeat your mistakes",          hint: "Spaced review" },
  { to: "/test",       label: "Take current lesson mini test", hint: "Mixed questions" },
];

const QUICK = [
  { to: "/words",       label: "Words",       icon: "Aa", desc: "Vocabulary list" },
  { to: "/verbs",       label: "Verbs",       icon: "≡",  desc: "Present tense" },
  { to: "/flashcards",  label: "Flashcards",  icon: "▭",  desc: "Active recall" },
  { to: "/test",        label: "Mini Test",   icon: "✓",  desc: "10 questions" },
  { to: "/mistakes",    label: "Mistakes",    icon: "!",  desc: "Repeat what you got wrong" },
  { to: "/path",        label: "Study Path",  icon: "↗",  desc: "Recommended order" },
];

export default function Dashboard() {
  const [snap, setSnap] = useState(() => collectStats());

  useEffect(() => {
    const onStorage = () => setSnap(collectStats());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const totalWords = words.length;
  const totalVerbs = verbs.length;
  const learnedPct = Math.round((snap.learnedCount / totalWords) * 100);
  const lesson = getLessonById(snap.settings.activeLesson);

  return (
    <div className="space-y-6">
      <section>
        <p className="muted text-sm">{greeting()}</p>
        <h1 className="h1 mt-1">Olá! Ready for Portuguese?</h1>
        <p className="muted mt-1.5 max-w-xl">
          A calm, focused space to learn step by step — words, verbs, flashcards, and short tests.
          Your daily goal is{" "}
          <span className="font-semibold text-ink-800">{snap.settings.dailyGoal} cards</span>.
        </p>
      </section>

      <section>
        <Card className="!p-0 overflow-hidden">
          <div className="grid lg:grid-cols-3">
            <div className="lg:col-span-2 p-5 sm:p-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="chip">Lesson {lesson.id}</span>
                <span className="chip-muted">Your current lesson</span>
              </div>
              <h2 className="h2 mt-2">{lesson.title}</h2>
              <p className="muted mt-1">{lesson.summary}</p>

              <div className="mt-4">
                <div className="label">Focus verbs</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {lesson.focusVerbs.map((v) => (
                    <span key={v} className="px-2.5 py-1 rounded-lg bg-brand-50 border border-brand-100 text-brand-800 font-mono text-sm">
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <div className="label">Example sentences</div>
                <ul className="mt-2 space-y-1.5">
                  {lesson.examples.map((e, i) => (
                    <li key={i} className="text-ink-800">
                      <span className="font-medium">{e.pt}</span>{" "}
                      <span className="muted text-sm">— {e.en}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link to="/verbs" className="btn-primary">Start lesson practice →</Link>
                <Link to="/flashcards" className="btn-secondary">Lesson flashcards</Link>
                <Link to="/settings" className="btn-ghost">Change lesson</Link>
              </div>
            </div>
            <div className="hidden lg:block bg-gradient-to-br from-brand-50 to-sand-100 border-l border-ink-100 p-6">
              <div className="text-xs uppercase tracking-wide text-brand-700/80 font-semibold">Tip</div>
              <p className="mt-2 text-sm text-ink-700 leading-relaxed">
                Stay on one lesson until the verb forms feel automatic.
                Speed comes from <em>repetition</em>, not from new content.
              </p>
              <div className="mt-6 text-xs text-ink-500">{lesson.subtitle}</div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <ProgressCard
          label="Words learned"
          value={`${snap.learnedCount}/${totalWords}`}
          hint={`${learnedPct}% of the list`}
          icon="Aa"
          accent="brand"
        />
        <ProgressCard
          label="Verbs practiced"
          value={snap.verbStats.correct + snap.verbStats.wrong}
          hint={accuracyText(snap.verbStats)}
          icon="≡"
          accent="blue"
        />
        <ProgressCard
          label="Flashcards seen"
          value={snap.flashStats.seen}
          hint={`${snap.flashStats.remembered.length} remembered`}
          icon="▭"
          accent="ink"
        />
        <ProgressCard
          label="Mistakes to repeat"
          value={snap.mistakes.length}
          hint={snap.mistakes.length ? "Tap to review" : "No mistakes yet"}
          icon="!"
          accent="rose"
        />
        <ProgressCard
          label="Best quiz score"
          value={`${snap.bestScore}/10`}
          hint="10-question mini test"
          icon="✓"
          accent="amber"
        />
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="h3">Today's plan</h2>
            <span className="chip">5 steps</span>
          </div>
          <ol className="space-y-2.5">
            {DAILY_PLAN.map((step, i) => (
              <li key={step.to}>
                <Link
                  to={step.to}
                  className="group flex items-center gap-3 p-3 rounded-xl border border-ink-100 hover:border-brand-300 hover:bg-brand-50/40 transition"
                >
                  <span className="h-8 w-8 rounded-lg bg-ink-50 text-ink-700 font-semibold flex items-center justify-center group-hover:bg-brand-100 group-hover:text-brand-700">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-ink-900">{step.label}</div>
                    <div className="text-xs muted">{step.hint}</div>
                  </div>
                  <span className="text-ink-400 group-hover:text-brand-600 transition">→</span>
                </Link>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <h2 className="h3 mb-3">A small note</h2>
          <p className="text-sm text-ink-700 leading-relaxed">
            This app focuses on the <span className="font-semibold">present tense</span> first.
            Get comfortable with <em>ser</em>, <em>estar</em>, <em>ter</em>, <em>ir</em> — then
            add the useful past tense (<em>pretérito perfeito</em>).
          </p>
          <div className="mt-4">
            <Link to="/path" className="link text-sm">See the study path →</Link>
          </div>
          <div className="mt-6 p-3 rounded-xl bg-sand-100 border border-sand-200 text-xs text-ink-600">
            Brazilian Portuguese by default. Where European Portuguese differs in a useful way,
            you'll see a small note on the word card.
          </div>
        </Card>
      </section>

      <section>
        <h2 className="h3 mb-3">Quick access</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="card p-4 hover:border-brand-300 hover:-translate-y-[1px] hover:shadow-md transition flex items-center gap-3"
            >
              <span className="h-10 w-10 rounded-xl bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center font-semibold">
                {q.icon}
              </span>
              <div>
                <div className="font-semibold text-ink-900">{q.label}</div>
                <div className="text-xs muted">{q.desc}</div>
              </div>
              <span className="ml-auto text-ink-400">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function collectStats() {
  return {
    learnedCount: getLearnedWords().length,
    verbStats: getPracticedVerbs(),
    flashStats: getFlashcardStats(),
    mistakes: getMistakes(),
    bestScore: getBestScore(),
    settings: getSettings(),
  };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 19) return "Boa tarde";
  return "Boa noite";
}

function accuracyText(stats) {
  const total = stats.correct + stats.wrong;
  if (!total) return "No attempts yet";
  return `${Math.round((stats.correct / total) * 100)}% correct`;
}
