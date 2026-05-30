import { NavLink } from "react-router-dom";

const NAV = [
  { to: "/",            label: "Home",       icon: "◎" },
  { to: "/words",       label: "Words",      icon: "Aa" },
  { to: "/verbs",       label: "Verbs",      icon: "≡" },
  { to: "/flashcards",  label: "Flashcards", icon: "▭" },
  { to: "/test",        label: "Test",       icon: "✓" },
  { to: "/mistakes",    label: "Mistakes",   icon: "!" },
  { to: "/path",        label: "Study Path", icon: "↗" },
  { to: "/settings",    label: "Settings",   icon: "⚙" },
];

export default function Navbar() {
  return (
    <>
      {/* Desktop top nav */}
      <header className="hidden md:block sticky top-0 z-30 bg-sand-50/85 backdrop-blur border-b border-ink-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 rounded-lg bg-brand-600 text-white items-center justify-center font-bold">
              Pt
            </span>
            <span className="font-semibold text-ink-900">Portuguese Trainer</span>
          </NavLink>
          <nav className="flex items-center gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-600 text-white shadow-soft"
                      : "text-ink-600 hover:text-ink-900 hover:bg-ink-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 bg-sand-50/90 backdrop-blur border-b border-ink-100">
        <div className="px-4 h-14 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 rounded-md bg-brand-600 text-white items-center justify-center text-xs font-bold">
              Pt
            </span>
            <span className="font-semibold text-ink-900 text-sm">Portuguese Trainer</span>
          </NavLink>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-ink-100 pb-[env(safe-area-inset-bottom)]">
        <ul className="grid grid-cols-4 gap-1 px-1.5 pt-1.5 pb-1.5">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[11px] font-medium transition ${
                    isActive
                      ? "text-brand-700 bg-brand-50"
                      : "text-ink-500 hover:text-ink-800"
                  }`
                }
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
