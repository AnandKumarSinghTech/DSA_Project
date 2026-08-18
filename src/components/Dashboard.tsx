"use client";

import { useState } from "react";
import NQueens from "./NQueens";
import Sudoku from "./Sudoku";
import TowerOfHanoi from "./TowerOfHanoi";
import { sound } from "@/lib/sound";
import { Cpu, ArrowRight, ShieldCheck, Zap, BookOpen } from "lucide-react";

type GameType = "dashboard" | "nqueens" | "sudoku" | "hanoi";

export default function Dashboard() {
  const [activeGame, setActiveGame] = useState<GameType>("dashboard");

  const selectGame = (game: GameType) => {
    sound.playClick();
    setActiveGame(game);
  };

  const games = [
    {
      id: "nqueens" as const,
      title: "N-Queens Solver",
      emoji: "👑",
      tagline: "Backtracking Search Engine",
      complexity: "O(N!) Time | O(N) Space",
      description: "Place N queens on an N×N chessboard so no two queens attack each other along rows, columns, or diagonals.",
      color: "from-amber-500/20 to-orange-500/20 border-amber-500/40 hover:border-amber-400",
      accent: "text-amber-400",
      badge: "Backtracking",
    },
    {
      id: "sudoku" as const,
      title: "Sudoku Constraint Engine",
      emoji: "🧩",
      tagline: "MRV Heuristic & Pruning",
      complexity: "MRV Optimized | O(9^81)",
      description: "Fill a 9x9 grid with numbers 1-9 so that every row, column, and 3x3 block contains every digit uniquely.",
      color: "from-cyan-500/20 to-blue-500/20 border-cyan-500/40 hover:border-cyan-400",
      accent: "text-cyan-400",
      badge: "Constraint propagation",
    },
    {
      id: "hanoi" as const,
      title: "Tower of Hanoi",
      emoji: "🗼",
      tagline: "Divide & Conquer Recursion",
      complexity: "O(2^N) Time | O(N) Depth",
      description: "Move all disks from Peg A to Peg C using Peg B as auxiliary. Never stack a larger disk over a smaller disk.",
      color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/40 hover:border-emerald-400",
      accent: "text-emerald-400",
      badge: "Recursion",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => selectGame("dashboard")}>
          <div className="p-2 bg-linear-to-tr from-cyan-500 to-indigo-600 rounded-xl shadow-lg shadow-cyan-500/20 text-white font-extrabold text-xl">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight bg-linear-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              DSA Game Suite
            </h1>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-3 border-r border-slate-700 pr-4 mr-2">
            <a href="https://github.com/AnandKumarSinghTech" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition" title="GitHub">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.03c3.15-.38 6.5-1.4 6.5-7.17a5.2 5.2 0 0 0-1.45-3.8 4.9 4.9 0 0 0-.14-3.72s-1.18-.37-3.88 1.44a13.3 13.3 0 0 0-7 0C6.28 2.27 5.1 2.64 5.1 2.64a4.9 4.9 0 0 0-.14 3.72 5.2 5.2 0 0 0-1.45 3.8c0 5.76 3.34 6.78 6.49 7.16a4.8 4.8 0 0 0-1 3.04V22"/><path d="M9 22v-3.5"/></svg>
            </a>
            <a href="https://www.linkedin.com/in/anandkumar-singh/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition" title="LinkedIn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
          </div>
          {activeGame !== "dashboard" && (
            <button
              onClick={() => selectGame("dashboard")}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs md:text-sm font-bold rounded-xl border border-slate-700 transition"
            >
              ← Dashboard
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
        {activeGame === "dashboard" ? (
          <>
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-slate-900/90 to-indigo-950/60 p-6 md:p-10 border border-slate-800 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="max-w-2xl space-y-3 z-10">
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
                  Master Data Structures & Algorithms Through Interactive Puzzles
                </h2>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  Learn by placing pieces, checking your work, and using focused hints that point out mistakes without giving away the entire solution.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 self-stretch md:self-auto shrink-0 z-10">
                <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
                  <Cpu className="w-5 h-5 mx-auto text-cyan-400 mb-1" />
                  <span className="text-xs text-slate-400 block font-medium">Core Logic</span>
                  <span className="text-sm font-bold text-white">C++</span>
                </div>
                <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
                  <ShieldCheck className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
                  <span className="text-xs text-slate-400 block font-medium">Validation</span>
                  <span className="text-sm font-bold text-white">Instant Check</span>
                </div>
                <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
                  <Zap className="w-5 h-5 mx-auto text-purple-400 mb-1" />
                  <span className="text-xs text-slate-400 block font-medium">Execution</span>
                  <span className="text-sm font-bold text-white">Sub-ms Speed</span>
                </div>
              </div>
            </div>

            {/* Games Selector Grid */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-cyan-400" /> Choose a Puzzle Game
                </h3>
                <span className="text-xs font-semibold text-slate-400">3 Core Algorithms Featured</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {games.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => selectGame(g.id)}
                    className={`group cursor-pointer rounded-2xl bg-linear-to-br ${g.color} bg-slate-900/80 p-6 border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl flex flex-col justify-between gap-5 relative overflow-hidden`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl md:text-4xl p-2.5 bg-slate-950/60 rounded-2xl border border-slate-800 shadow">
                            {g.emoji}
                          </span>
                          <div>
                            <h4 className={`text-xl font-bold text-white group-hover:${g.accent} transition`}>
                              {g.title}
                            </h4>
                            <span className="text-xs font-semibold text-slate-400 block">{g.tagline}</span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-slate-950/80 text-xs font-extrabold uppercase tracking-wider rounded-lg border border-slate-800 text-slate-300">
                          {g.badge}
                        </span>
                      </div>

                      <p className="text-xs md:text-sm text-slate-300 leading-relaxed">{g.description}</p>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-800/80">
                      <span className="text-xs font-mono text-slate-400">{g.complexity}</span>
                      <button className={`flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-800 ${g.accent} text-xs font-extrabold rounded-xl border border-slate-800 transition`}>
                        <span>Launch Game</span>
                        <ArrowRight className="w-4 h-4 transition group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </>
        ) : activeGame === "nqueens" ? (
          <NQueens onBack={() => selectGame("dashboard")} />
        ) : activeGame === "sudoku" ? (
          <Sudoku onBack={() => selectGame("dashboard")} />
        ) : activeGame === "hanoi" ? (
          <TowerOfHanoi onBack={() => selectGame("dashboard")} />
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>Interactive DSA puzzle games built for learning and play.</p>
      </footer>
    </div>
  );
}
