import Navbar from "./Navbar.jsx";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 pb-28 md:pb-12">
        {children}
      </main>
      <footer className="hidden md:block max-w-6xl w-full mx-auto px-6 pb-8 text-xs muted">
        Portuguese Trainer · Brazilian Portuguese by default · Progress is stored locally in your browser.
      </footer>
    </div>
  );
}
