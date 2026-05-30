# Portuguese Trainer

A calm, personal Portuguese learning app — words, verb trainer, flashcards, mini tests, and mistake repetition. Built with React + Vite + Tailwind CSS, no backend, no database. All progress is saved in your browser's `localStorage`.

Brazilian Portuguese by default, with small notes where European Portuguese differs in useful ways.

## Features

- **Home Dashboard** — greeting, progress summary cards, daily 5-step learning plan, quick access to every section.
- **Words** — 80+ beginner words across 8 categories with search, category filter, "hide learned" toggle, examples, and pronunciation hints. Mark words as learned (saved locally).
- **Verb Trainer** — fill-in-the-blank sentences for the present tense of 20 essential verbs (`ser`, `estar`, `ter`, `ir`, `fazer`, …). Random question button, hint, skip, accuracy stats, and the full conjugation table for the current verb shown below the prompt. Wrong answers go to Mistakes.
- **Flashcards** — flip cards with Portuguese on the front and English + example on the back. "I knew it" / "I forgot" buttons. Forgotten cards go to Mistakes. Keyboard: `Space` flips, `1`/`F` = forgot, `2`/`K` = knew it.
- **Mini Test** — a 10-question shuffled set mixing multiple-choice vocab, sentence meaning, and type-the-verb-form questions. Saves your best score, encouraging end screen, wrong answers go to Mistakes.
- **Mistakes** — repeat only what you got wrong. Practice again, remove individually, or clear all. Sorted by how often you missed each item.
- **Study Path** — a 4-level recommended order (basic phrases → past tense → imperfect & object pronouns), with a clear note: *don't try to learn all tenses at once*.
- **Settings** — choose a daily goal (5/10/15/20), toggle compact mode, toggle pronunciation hints, export progress as JSON, import progress from JSON, reset progress.

Mobile-friendly: top nav on desktop, bottom tab bar on mobile.

## Tech stack

- React 18
- Vite 5
- Tailwind CSS 3
- React Router (hash router for GitHub Pages)
- Plain JavaScript (no TypeScript)
- No backend, no database — all state in `localStorage`

## Install & run locally

```bash
npm install
npm run dev
```

The dev server starts on http://localhost:5173. Open it in your browser.

## Build for production

```bash
npm run build
npm run preview   # optional — preview the built bundle
```

The built site goes into `dist/`.

## Deploy to GitHub Pages

The project is preconfigured for a Pages site at `/portuguese-trainer/`.

1. Create a GitHub repository named `portuguese-trainer` and push the code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin git@github.com:<your-username>/portuguese-trainer.git
   git push -u origin main
   ```
2. Build and publish to the `gh-pages` branch:
   ```bash
   npm run deploy
   ```
3. In your repository **Settings → Pages**, set the source to **Deploy from a branch → `gh-pages` / root**.
4. The site will be available at `https://<your-username>.github.io/portuguese-trainer/`.

If you fork to a different repo name, update `base` in `vite.config.js` to match.

## How progress is saved

Everything lives in `localStorage` under these keys:

| Key                                          | What it stores                              |
| -------------------------------------------- | ------------------------------------------- |
| `portuguese_trainer_learned_words`           | array of word IDs you've marked as learned  |
| `portuguese_trainer_practiced_verbs`         | `{ correct, wrong }` totals from the trainer |
| `portuguese_trainer_flashcards`              | `{ seen, remembered[], forgotten[] }`       |
| `portuguese_trainer_mistakes`                | list of vocab / verb / quiz / flash mistakes |
| `portuguese_trainer_best_score`              | best 10-question test score                 |
| `portuguese_trainer_settings`                | daily goal, compact mode, pronunciation     |

Use **Settings → Export as JSON** to back up your progress, or **Reset progress** to start fresh.

## Project structure

```
portuguese-trainer/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── components/
    │   ├── Button.jsx
    │   ├── Card.jsx
    │   ├── Layout.jsx
    │   ├── Navbar.jsx
    │   └── ProgressCard.jsx
    ├── data/
    │   ├── words.js
    │   ├── verbs.js
    │   └── quizQuestions.js
    ├── pages/
    │   ├── Dashboard.jsx
    │   ├── WordsPage.jsx
    │   ├── VerbTrainer.jsx
    │   ├── FlashcardsPage.jsx
    │   ├── MiniTestPage.jsx
    │   ├── MistakesPage.jsx
    │   ├── StudyPathPage.jsx
    │   └── SettingsPage.jsx
    └── utils/
        ├── practice.js
        └── storage.js
```

Boa sorte com os estudos! 🌿
