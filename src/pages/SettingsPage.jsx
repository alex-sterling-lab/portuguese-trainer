import { useRef, useState } from "react";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import {
  getSettings,
  saveSettings,
  resetAllProgress,
  exportProgress,
  importProgress,
} from "../utils/storage.js";

const GOALS = [5, 10, 15, 20];

export default function SettingsPage() {
  const [s, setS] = useState(() => getSettings());
  const [toast, setToast] = useState(null);
  const fileRef = useRef(null);

  function update(patch) {
    const next = saveSettings(patch);
    setS(next);
  }

  function announce(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  function reset() {
    if (!confirm("This will erase all your local progress (learned words, mistakes, scores). Continue?")) return;
    resetAllProgress();
    setS(getSettings());
    announce("All progress reset.");
  }

  function doExport() {
    const data = exportProgress();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `portuguese-trainer-progress-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    announce("Progress exported.");
  }

  async function doImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      importProgress(data);
      setS(getSettings());
      announce("Progress imported.");
    } catch (err) {
      alert("Could not import file: " + err.message);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="h1">Settings</h1>
        <p className="muted mt-1">Tune the app to how you like to study.</p>
      </header>

      <Card>
        <h2 className="h3">Daily goal</h2>
        <p className="muted text-sm mt-1">How many cards per day?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <button
              key={g}
              onClick={() => update({ dailyGoal: g })}
              className={`px-4 py-2 rounded-xl border text-sm font-semibold transition ${
                s.dailyGoal === g
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-ink-700 border-ink-200 hover:border-brand-300"
              }`}
            >
              {g} cards
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="h3">Display</h2>
        <div className="mt-3 space-y-3">
          <Toggle
            label="Compact mode"
            description="Smaller spacing, denser word grid."
            checked={s.compactMode}
            onChange={(v) => update({ compactMode: v })}
          />
          <Toggle
            label="Show pronunciation hints"
            description="Simple English-letter pronunciation on word cards and flashcards."
            checked={s.showPronunciation}
            onChange={(v) => update({ showPronunciation: v })}
          />
        </div>
      </Card>

      <Card>
        <h2 className="h3">Progress</h2>
        <p className="muted text-sm mt-1">
          Everything is stored in your browser. Export to keep a backup or move it to another device.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={doExport}>Export as JSON</Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            Import from JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={doImport}
          />
          <Button variant="danger" onClick={reset}>Reset progress</Button>
        </div>
      </Card>

      {toast ? (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40">
          <div className="px-4 py-2.5 rounded-xl bg-ink-900 text-white text-sm shadow-soft">
            {toast}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start justify-between gap-4 p-3 rounded-xl border border-ink-100 bg-white cursor-pointer hover:border-ink-200">
      <span>
        <span className="block font-medium text-ink-900">{label}</span>
        <span className="block muted text-sm">{description}</span>
      </span>
      <span
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`mt-1 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition ${
          checked ? "bg-brand-600" : "bg-ink-200"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
