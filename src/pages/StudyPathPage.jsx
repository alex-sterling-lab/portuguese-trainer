import { Link } from "react-router-dom";
import Card from "../components/Card.jsx";

const LEVELS = [
  {
    label: "Level 1",
    title: "Getting started",
    color: "bg-brand-50 border-brand-200 text-brand-800",
    dot: "bg-brand-500",
    items: [
      { title: "Basic phrases", to: "/words", hint: "olá, obrigado, por favor, tudo bem" },
      { title: "Pronouns", to: "/words", hint: "eu, você, ele, ela, nós, vocês, eles, elas" },
      { title: "Present tense of regular verbs", to: "/verbs", hint: "-ar, -er, -ir patterns (falar, comer, beber)" },
      { title: "Most common irregular verbs", to: "/verbs", hint: "ser, estar, ter, ir, fazer" },
    ],
  },
  {
    label: "Level 2",
    title: "Daily life",
    color: "bg-blue-50 border-blue-200 text-blue-800",
    dot: "bg-blue-500",
    items: [
      { title: "Questions", to: "/test", hint: "Quem? O quê? Onde? Quando? Como? Por quê?" },
      { title: "Negation", to: "/test", hint: "Eu não falo… / Não, obrigado." },
      { title: "Prepositions", to: "/words", hint: "em, de, para, com, sem, sobre" },
      { title: "Daily life vocabulary", to: "/words", hint: "Food, home, time, money" },
    ],
  },
  {
    label: "Level 3",
    title: "Talking about the past",
    color: "bg-amber-50 border-amber-200 text-amber-800",
    dot: "bg-amber-500",
    items: [
      { title: "Past tense: pretérito perfeito", to: "/verbs", hint: "Eu falei, comi, bebi…" },
      { title: 'Future with "ir + infinitive"', to: "/verbs", hint: "Eu vou estudar amanhã." },
      { title: "More dialogues", to: "/flashcards", hint: "Daily situations: ordering, asking for directions" },
    ],
  },
  {
    label: "Level 4",
    title: "Going further",
    color: "bg-rose-50 border-rose-200 text-rose-800",
    dot: "bg-rose-500",
    items: [
      { title: "Imperfect past", to: "/verbs", hint: "Quando eu era criança… (used to / was -ing)" },
      { title: "Object pronouns", to: "/words", hint: "me, te, lhe, nos, os, as" },
      { title: "Listening practice", to: "/flashcards", hint: "Real conversations, podcasts, music" },
    ],
  },
];

export default function StudyPathPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="h1">Study Path</h1>
        <p className="muted mt-1 max-w-2xl">
          A recommended order for beginners. You don't need to finish a level before peeking
          at the next — but mastering Level 1 first will make everything after much easier.
        </p>
      </header>

      <Card className="bg-sand-100/70 border-sand-200">
        <p className="text-ink-800">
          <span className="font-semibold">Important:</span> don't try to learn all tenses at once.
          First become comfortable with the <em>present tense</em>, then add the
          useful past tense (<em>pretérito perfeito</em>). Pick one verb a day and live with it.
        </p>
      </Card>

      <ol className="space-y-6">
        {LEVELS.map((level, idx) => (
          <li key={level.label} className="relative">
            <div className="flex items-center gap-3 mb-3">
              <span className={`inline-flex h-9 px-3 rounded-full items-center font-semibold border ${level.color}`}>
                {level.label}
              </span>
              <h2 className="h3">{level.title}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 pl-1">
              {level.items.map((it) => (
                <Link
                  key={it.title}
                  to={it.to}
                  className="card p-4 hover:border-brand-300 hover:-translate-y-[1px] hover:shadow-md transition flex items-start gap-3"
                >
                  <span className={`mt-1 h-2.5 w-2.5 rounded-full ${level.dot}`} />
                  <div className="flex-1">
                    <div className="font-semibold text-ink-900">{it.title}</div>
                    <div className="text-xs muted mt-0.5">{it.hint}</div>
                  </div>
                  <span className="text-ink-400 self-center">→</span>
                </Link>
              ))}
            </div>
            {idx !== LEVELS.length - 1 ? (
              <div className="h-6 ml-4 mt-3 border-l-2 border-dashed border-ink-200" />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
