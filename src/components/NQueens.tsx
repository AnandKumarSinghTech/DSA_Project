"use client";

import React, { useState, useEffect, useRef } from "react";
import { sound } from "@/lib/sound";
import { Sparkles, CheckCircle2, AlertTriangle, RefreshCw, Play, Lightbulb, Info, Crown, Trophy, Volume2, VolumeX } from "lucide-react";
import confetti from "canvas-confetti";

interface NQueensProps {
  onBack?: () => void;
}

export default function NQueens({ onBack }: NQueensProps) {
  const [size, setSize] = useState<number>(8);
  const [board, setBoard] = useState<number[][]>([]);
  const [conflicts, setConflicts] = useState<{ row: number; col: number }[]>([]);
  const [statusMsg, setStatusMsg] = useState<string>("Place N Queens so no two queens attack each other.");
  const [statusType, setStatusType] = useState<"info" | "success" | "error">("info");
  const [loading, setLoading] = useState<boolean>(false);
  const [aiHint, setAiHint] = useState<string>("");
  const [moves, setMoves] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [showAlgoInfo, setShowAlgoInfo] = useState<boolean>(false);
  const [solvingAnimation, setSolvingAnimation] = useState<boolean>(false);

  // Initialize board
  const initBoard = (n: number) => {
    const newBoard = Array(n).fill(0).map(() => Array(n).fill(0));
    setBoard(newBoard);
    setConflicts([]);
    setStatusMsg(`Board initialized for N = ${n}. Click cells to place or remove queens.`);
    setStatusType("info");
    setAiHint("");
    setMoves(0);
    setTimer(0);
    setIsTimerRunning(false);
  };

  useEffect(() => {
    initBoard(size);
  }, [size]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const toggleQueen = (row: number, col: number) => {
    if (solvingAnimation) return;
    if (!isTimerRunning) setIsTimerRunning(true);

    sound.playPlace();
    const newBoard = board.map((r, rIdx) =>
      r.map((c, cIdx) => (rIdx === row && cIdx === col ? (c === 1 ? 0 : 1) : c))
    );

    setBoard(newBoard);
    setMoves((m) => m + 1);
    setConflicts([]);
    setStatusMsg("Queen placed. Click Validate to check for conflicts.");
    setStatusType("info");
  };

  const queenCount = board.flat().filter((val) => val === 1).length;

  // Validate board using C++ backend
  const validateBoard = async () => {
    setLoading(true);
    setStatusMsg("Validating board constraints...");
    try {
      const flatStr = board.flat().join("");
      const res = await fetch("/api/dsa/nqueens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size, mode: "validate", boardStr: flatStr }),
      });
      const data = await res.json();

      if (data.status === "valid") {
        if (queenCount === size) {
          sound.playSuccess();
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          setStatusMsg(`🎉 VICTORY! Solved ${size}-Queens puzzle in ${moves} moves and ${timer} seconds!`);
          setStatusType("success");
          setIsTimerRunning(false);
        } else {
          sound.playClick();
          setStatusMsg(`✅ No conflicts detected! Placed ${queenCount}/${size} queens.`);
          setStatusType("success");
        }
        setConflicts([]);
      } else if (data.status === "invalid") {
        sound.playError();
        setConflicts(data.conflicts || []);
        setStatusMsg(`❌ Conflict detected! ${data.conflicts?.length / 2 || "Some"} queens are attacking each other.`);
        setStatusType("error");
      }
    } catch (e) {
      // Local JS validation fallback
      const currentConflicts: { row: number; col: number }[] = [];
      const queenPositions: { row: number; col: number }[] = [];

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (board[r][c] === 1) queenPositions.push({ row: r, col: c });
        }
      }

      for (let i = 0; i < queenPositions.length; i++) {
        for (let j = i + 1; j < queenPositions.length; j++) {
          const q1 = queenPositions[i];
          const q2 = queenPositions[j];
          if (q1.row === q2.row || q1.col === q2.col || Math.abs(q1.row - q2.row) === Math.abs(q1.col - q2.col)) {
            currentConflicts.push(q1, q2);
          }
        }
      }

      setConflicts(currentConflicts);
      if (currentConflicts.length > 0) {
        sound.playError();
        setStatusMsg(`❌ Conflicts detected between attacking queens!`);
        setStatusType("error");
      } else {
        sound.playSuccess();
        setStatusMsg(queenCount === size ? "🎉 Perfect! All N queens placed safely!" : "✅ Valid state so far!");
        setStatusType("success");
      }
    } finally {
      setLoading(false);
    }
  };

  // A hint identifies an attacking queen; it never solves the board for the player.
  const showBoardHint = () => {
    const queens: { row: number; col: number }[] = [];
    board.forEach((row, rowIndex) =>
      row.forEach((cell, colIndex) => {
        if (cell === 1) queens.push({ row: rowIndex, col: colIndex });
      })
    );

    for (let i = 0; i < queens.length; i++) {
      for (let j = i + 1; j < queens.length; j++) {
        const first = queens[i];
        const second = queens[j];
        if (
          first.row === second.row ||
          first.col === second.col ||
          Math.abs(first.row - second.row) === Math.abs(first.col - second.col)
        ) {
          setConflicts([first, second]);
          setAiHint(
            `One of the highlighted queens is misplaced: Row ${first.row + 1}, Column ${first.col + 1} attacks Row ${second.row + 1}, Column ${second.col + 1}. Move either queen and try again.`
          );
          return;
        }
      }
    }

    setConflicts([]);
    setAiHint(
      queenCount === 0
        ? "Place a queen in any column to begin. Then keep one queen per row, column, and diagonal."
        : "No placed queen is attacking another one. Keep checking each new queen against its row, column, and diagonals."
    );
  };

  const isConflicting = (r: number, c: number) => {
    return conflicts.some((p) => p.row === r && p.col === c);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-4 md:p-6 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">👑</span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              N-Queens Puzzle Solver
            </h2>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Place N queens on an N×N board so no two queens share a row, column, or diagonal.
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between">
          <button
            onClick={() => setShowAlgoInfo(!showAlgoInfo)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
          >
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Algorithm Specs</span>
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
            >
              ← Back to Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Board Size (N)</label>
          <select
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 text-white text-sm font-semibold rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none"
          >
            {[4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
              <option key={n} value={n}>
                {n} × {n} ({n} Queens)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Queens Placed</label>
          <div className="text-lg font-bold text-amber-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-center">
            {queenCount} / {size}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Moves</label>
          <div className="text-lg font-bold text-cyan-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-center">
            {moves}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Timer</label>
          <div className="text-lg font-bold text-emerald-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-center font-mono">
            {formatTimer(timer)}
          </div>
        </div>
      </div>

      {/* Algorithm Info Modal / Card */}
      {showAlgoInfo && (
        <div className="p-4 bg-slate-950 border border-cyan-500/30 rounded-xl text-xs space-y-2 text-slate-300 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-cyan-400 text-sm">C++ Backtracking Logic & DSA Complexity</span>
            <span className="text-slate-500">Backtracking Algorithm</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
            <div>
              <span className="text-slate-400 block font-medium">Time Complexity:</span>
              <span className="font-mono text-amber-300">O(N!) worst case</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Space Complexity:</span>
              <span className="font-mono text-amber-300">O(N) recursion depth</span>
            </div>
          </div>
          <p className="pt-1 text-slate-400">
            The C++ binary evaluates row placements column-by-column, checking safety against existing queens across left row, upper diagonal, and lower diagonal.
          </p>
        </div>
      )}

      {/* Main Board View */}
      <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-center">
        {/* Chessboard */}
        <div className="flex flex-col items-center">
          <div
            className="grid gap-1 bg-slate-950 p-3 rounded-2xl border-2 border-slate-800 shadow-inner"
            style={{
              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
              width: "min(100%, 500px)",
              aspectRatio: "1 / 1",
            }}
          >
            {board.map((row, rIdx) =>
              row.map((cell, cIdx) => {
                const isDark = (rIdx + cIdx) % 2 === 1;
                const conflict = isConflicting(rIdx, cIdx);

                return (
                  <button
                    key={`${rIdx}-${cIdx}`}
                    onClick={() => toggleQueen(rIdx, cIdx)}
                    className={`relative flex items-center justify-center rounded-lg transition-all transform active:scale-95 font-bold text-xl md:text-2xl select-none ${
                      conflict
                        ? "bg-rose-900/80 border-2 border-rose-500 text-rose-200 animate-pulse"
                        : cell === 1
                        ? "bg-amber-500/30 border-2 border-amber-400 text-amber-300 shadow-md shadow-amber-500/20"
                        : isDark
                        ? "bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50"
                        : "bg-slate-900 hover:bg-slate-800 border border-slate-800"
                    }`}
                  >
                    {cell === 1 && (
                      <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] scale-110">👑</span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Status Message Banner */}
          <div
            className={`mt-4 w-full text-center px-4 py-2.5 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 ${
              statusType === "success"
                ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                : statusType === "error"
                ? "bg-rose-950/60 border-rose-500/50 text-rose-300"
                : "bg-slate-800/80 border-slate-700 text-slate-300"
            }`}
          >
            {statusType === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {statusType === "error" && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
            <span>{statusMsg}</span>
          </div>
        </div>

        {/* Action Controls & AI Smart Hints Side Panel */}
        <div className="flex flex-col gap-4 w-full lg:w-80">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Actions & Logic</h3>

            <button
              onClick={validateBoard}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Validate Board</span>
            </button>

            <button
              onClick={showBoardHint}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition active:scale-95"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Show Mistake Hint</span>
            </button>

            <button
              onClick={() => initBoard(size)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl border border-slate-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset Board</span>
            </button>
          </div>

          {/* Focused hint box */}
          <div className="bg-slate-950 border border-indigo-500/40 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Board Hint</span>
            </div>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed italic">
              {aiHint || 'Click "Show Mistake Hint" to highlight a queen that is attacking another queen.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
