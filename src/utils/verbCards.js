// Convert verbs into beginner-friendly flashcard objects.
// A verb card shows the infinitive on the front and a small useful-forms table on the back.
//
// The forms shown are: eu / você / a gente / nós  (the 4 most useful beginner persons).

import { practicePrompts } from "../data/verbs.js";

const SHOWN_PERSONS = ["eu", "você", "a gente", "nós"];

export function verbToCard(verb) {
  const forms = SHOWN_PERSONS
    .filter((p) => verb.forms[p])
    .map((p) => ({
      person: p,
      pt: `${p} ${verb.forms[p]}`,
      en: (verb.formsEnglish && verb.formsEnglish[p]) || englishFallback(verb, p),
    }));

  const examples = pickExamples(verb.id, 2);
  const note =
    verb.intro ||
    `${verb.infinitive} is the infinitive, meaning ${verb.english}. ` +
      `Use "${verb.forms.eu}" with eu (I).`;

  return {
    type: "verb",
    id: `verb-${verb.id}`,
    infinitive: verb.infinitive,
    english: verb.english,
    category: "Useful verbs",
    forms,
    examples,
    note,
  };
}

export function wordToCard(word) {
  return {
    type: "word",
    id: `word-${word.id}`,
    portuguese: word.portuguese,
    english: word.english,
    category: word.category,
    pronunciation: word.pronunciation,
    examplePt: word.examplePt,
    exampleEn: word.exampleEn,
    noteEu: word.noteEu,
  };
}

// Pull up to `n` example sentences from existing practicePrompts for this verb,
// filling in the conjugated form so we get a complete sentence.
function pickExamples(verbId, n) {
  const matches = practicePrompts.filter((p) => p.verb === verbId);
  const picked = matches.slice(0, n).map((p) => ({
    pt: p.sentence.replace("___", p.answer),
    en: p.translation,
  }));
  return picked;
}

function englishFallback(verb, person) {
  // Derive a rough English label like "I have" / "you have" / "we have"
  // from the verb's english meaning when formsEnglish isn't provided.
  const bare = (verb.english || "")
    .replace(/^to\s+/, "")
    .replace(/\s*\(.*\)\s*$/, "")
    .split(/\s*\/\s*/)[0]
    .trim();
  const subj = person === "eu" ? "I" : person === "nós" ? "we" : person === "a gente" ? "we" : "you";
  return `${subj} ${bare}`;
}
