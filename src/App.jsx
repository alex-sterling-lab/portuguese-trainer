import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import WordsPage from "./pages/WordsPage.jsx";
import VerbTrainer from "./pages/VerbTrainer.jsx";
import FlashcardsPage from "./pages/FlashcardsPage.jsx";
import MiniTestPage from "./pages/MiniTestPage.jsx";
import MistakesPage from "./pages/MistakesPage.jsx";
import StudyPathPage from "./pages/StudyPathPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/words" element={<WordsPage />} />
        <Route path="/verbs" element={<VerbTrainer />} />
        <Route path="/flashcards" element={<FlashcardsPage />} />
        <Route path="/test" element={<MiniTestPage />} />
        <Route path="/mistakes" element={<MistakesPage />} />
        <Route path="/path" element={<StudyPathPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
