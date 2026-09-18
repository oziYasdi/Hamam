import React, { useState } from "react";
import { Calendar, LayoutGrid, Settings, Sun, Moon, Sparkles } from "lucide-react";
import AppointmentManagement from "./components/AppointmentManagement";
import DefinitionsManagement from "./components/DefinitionsManagement";
import RoomGridMatrix from "./components/RoomGridMatrix";
import { useTheme } from "./theme.jsx";
import { cn } from "./ui.jsx";

function App() {
  const [activeTab, setActiveTab] = useState("rooms");
  const { theme, toggleTheme } = useTheme();

  const tabs = [
    { id: "rooms", label: "Oda & Takvim Matrisi", icon: LayoutGrid },
    { id: "appointments", label: "Liste Görünümü", icon: Calendar },
    { id: "definitions", label: "Tanımlar", icon: Settings },
  ];

  return (
    <div className="min-h-svh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-sm">
              <Sparkles size={15} />
            </span>
            <div className="min-w-0">
              <h1 className="font-display truncate text-lg font-semibold tracking-wide text-slate-800 dark:text-slate-50">
                Context Hamam & SPA
              </h1>
              <p className="hidden text-[10px] uppercase tracking-[0.22em] text-amber-700/80 dark:text-amber-400/80 sm:block">
                Yönetim Paneli
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-900/80">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition",
                    active
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100",
                  )}
                >
                  <Icon size={16} />
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Aydınlık moda geç" : "Karanlık moda geç"}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-amber-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-slate-800"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        {activeTab === "rooms" && <RoomGridMatrix />}
        {activeTab === "appointments" && <AppointmentManagement />}
        {activeTab === "definitions" && <DefinitionsManagement />}
      </main>
    </div>
  );
}

export default App;
