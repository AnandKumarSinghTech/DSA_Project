"use client";

import React, { useState, useEffect } from "react";
import { sound } from "@/lib/sound";
import { Sparkles, CheckCircle2, AlertTriangle, RefreshCw, Lightbulb, Info, Eraser, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";

interface SudokuProps {
  onBack?: () => void;
}

// Built-in starter puzzles
const PRESET_PUZZLES: Record<string, string> = {
  easy: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
  medium: "000260701680070090190004500820100040004602900050003028009300074040050036703018000",
  hard: "000000012000000003002300400001800005060070080000009000008500000900040500470006000",
};

export default function Sudoku({ onBack }: SudokuProps) {
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [initialGrid, setInitialGrid] = useState<number[][]>([]);
  const [grid, setGrid] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>([0, 0]);
  const [conflicts, setConflicts] = useState<{ row: number; col: number }[]>([]);
  const [statusMsg, setStatusMsg] = useState<string>("Fill the grid so every row, column, and 3x3 block has numbers 1-9.");
  const [statusType, setStatusType] = useState<"info" | "success" | "error">("info");
  const [loading, setLoading] = useState<boolean>(false);
  const [aiHint, setAiHint] = useState<string>("");
  const [timer, setTimer] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [showAlgoInfo, setShowAlgoInfo] = useState<boolean>(false);

  const shufflePuzzle = (flatStr: string) => {
    let g = [];
    for (let i = 0; i < 9; i++) {
      g.push(flatStr.slice(i * 9, i * 9 + 9).split("").map(Number));
    }
    const swapRows = (r1: number, r2: number) => { const t = g[r1]; g[r1] = g[r2]; g[r2] = t; };
    const swapCols = (c1: number, c2: number) => { for (let r = 0; r < 9; r++) { const t = g[r][c1]; g[r][c1] = g[r][c2]; g[r][c2] = t; } };
    const rand = () => Math.random() > 0.5;
    for (let b = 0; b < 3; b++) {
      if (rand()) swapRows(b * 3, b * 3 + 1);
      if (rand()) swapRows(b * 3 + 1, b * 3 + 2);
      if (rand()) swapRows(b * 3, b * 3 + 2);
    }
    for (let b = 0; b < 3; b++) {
      if (rand()) swapCols(b * 3, b * 3 + 1);
      if (rand()) swapCols(b * 3 + 1, b * 3 + 2);
      if (rand()) swapCols(b * 3, b * 3 + 2);
    }
    return g.flat().join("");
  };

  // Load starter puzzle
  const loadPuzzle = (diff: "easy" | "medium" | "hard", generateNew: boolean = false) => {
    const baseStr = PRESET_PUZZLES[diff];
    const puzzleStr = generateNew ? shufflePuzzle(baseStr) : (initialGrid.length ? initialGrid.flat().join("") : shufflePuzzle(baseStr));
    
    const initG: number[][] = Array(9).fill(0).map(() => Array(9).fill(0));
    const currG: number[][] = Array(9).fill(0).map(() => Array(9).fill(0));

    for (let i = 0; i < 81; i++) {
      const val = parseInt(puzzleStr[i] || "0", 10);
      initG[Math.floor(i / 9)][i % 9] = val;
      currG[Math.floor(i / 9)][i % 9] = val;
    }

    setInitialGrid(initG);
    setGrid(currG);
    setSelectedCell([0, 0]);
    setConflicts([]);
    setStatusMsg(`Loaded ${diff.toUpperCase()} Sudoku puzzle.`);
    setStatusType("info");
    setAiHint("");
    setTimer(0);
    setIsTimerRunning(false);
  };

  const restartCurrent = () => {
    setGrid(initialGrid.map(row => [...row]));
    setSelectedCell([0, 0]);
    setConflicts([]);
    setStatusMsg("Grid reset to start.");
    setStatusType("info");
    setAiHint("");
    setTimer(0);
    setIsTimerRunning(false);
  };

  useEffect(() => {
    loadPuzzle(difficulty, true);
  }, [difficulty]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleCellClick = (r: number, c: number) => {
    setSelectedCell([r, c]);
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;
    const [r, c] = selectedCell;
    if (initialGrid[r][c] !== 0) return; // Clue cell fixed

    if (!isTimerRunning) setIsTimerRunning(true);
    sound.playPlace();

    const newGrid = grid.map((rowArr, rowIdx) =>
      rowArr.map((val, colIdx) => (rowIdx === r && colIdx === c ? num : val))
    );

    setGrid(newGrid);
    setConflicts([]);
  };

  const handleErase = () => {
    if (!selectedCell) return;
    const [r, c] = selectedCell;
    if (initialGrid[r][c] !== 0) return;

    sound.playClick();
    const newGrid = grid.map((rowArr, rowIdx) =>
      rowArr.map((val, colIdx) => (rowIdx === r && colIdx === c ? 0 : val))
    );
    setGrid(newGrid);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell) return;
      const [r, c] = selectedCell;

      if (e.key >= "1" && e.key <= "9") {
        handleNumberInput(parseInt(e.key, 10));
      } else if (e.key === "Backspace" || e.key === "Delete") {
        handleErase();
      } else if (e.key === "ArrowUp" && r > 0) {
        setSelectedCell([r - 1, c]);
      } else if (e.key === "ArrowDown" && r < 8) {
        setSelectedCell([r + 1, c]);
      } else if (e.key === "ArrowLeft" && c > 0) {
        setSelectedCell([r, c - 1]);
      } else if (e.key === "ArrowRight" && c < 8) {
        setSelectedCell([r, c + 1]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, grid, initialGrid]);

  // Validate board with C++ or fallback local solver
  const validateSudoku = async () => {
    setLoading(true);
    setStatusMsg("Checking board validity with constraint engine...");
    
    try {
      const initialFlatStr = initialGrid.flat().join("");
      const res = await fetch("/api/dsa/sudoku", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardStr: initialFlatStr, mode: "solve" }),
      });
      
      let data;
      try {
        data = await res.json();
      } catch (err) {
        throw new Error("Invalid JSON response"); // Force fallback
      }

      if (data.status === "success" && data.solution) {
        const solution = data.solution;
        let isInvalid = false;
        let emptyCount = 0;
        const currentConflicts: { row: number; col: number }[] = [];

        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            if (grid[r][c] === 0) {
              emptyCount++;
            } else if (grid[r][c] !== solution[r][c]) {
              isInvalid = true;
              currentConflicts.push({ row: r, col: c });
            }
          }
        }

        if (isInvalid) {
          sound.playError();
          setConflicts(currentConflicts);
          setStatusMsg(`❌ Found ${currentConflicts.length} incorrect cell(s)!`);
          setStatusType("error");
        } else if (emptyCount === 0) {
          sound.playSuccess();
          confetti({ particleCount: 100, spread: 70 });
          setStatusMsg(`🎉 CONGRATULATIONS! You completed the Sudoku puzzle in ${formatTimer(timer)}!`);
          setStatusType("success");
          setIsTimerRunning(false);
          setConflicts([]);
        } else {
          sound.playClick();
          setStatusMsg(`✅ Current board is valid! ${emptyCount} empty cells remaining.`);
          setStatusType("success");
          setConflicts([]);
        }
      } else {
        throw new Error("API failed to solve"); // Force fallback
      }
    } catch (e) {
      // Fallback local check using full solver
      const solveLocal = (board: number[][]) => {
        const isValid = (r: number, c: number, num: number) => {
          for (let i = 0; i < 9; i++) {
            if (board[r][i] === num && i !== c) return false;
            if (board[i][c] === num && i !== r) return false;
          }
          const boxR = Math.floor(r / 3) * 3;
          const boxC = Math.floor(c / 3) * 3;
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              if (board[boxR + i][boxC + j] === num && (boxR + i !== r || boxC + j !== c)) return false;
            }
          }
          return true;
        };

        const solve = () => {
          for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
              if (board[r][c] === 0) {
                for (let num = 1; num <= 9; num++) {
                  if (isValid(r, c, num)) {
                    board[r][c] = num;
                    if (solve()) return true;
                    board[r][c] = 0;
                  }
                }
                return false;
              }
            }
          }
          return true;
        };
        solve();
        return board;
      };

      const initialCopy = initialGrid.map(row => [...row]);
      const solution = solveLocal(initialCopy);
      
      let isInvalid = false;
      let emptyCount = 0;
      const currentConflicts: { row: number; col: number }[] = [];

      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (grid[r][c] === 0) {
            emptyCount++;
          } else if (grid[r][c] !== solution[r][c]) {
            isInvalid = true;
            currentConflicts.push({ row: r, col: c });
          }
        }
      }

      if (isInvalid) {
        sound.playError();
        setConflicts(currentConflicts);
        setStatusMsg(`❌ Found ${currentConflicts.length} incorrect cell(s) (Local Check)!`);
        setStatusType("error");
      } else if (emptyCount === 0) {
        sound.playSuccess();
        confetti({ particleCount: 100, spread: 70 });
        setStatusMsg(`🎉 CONGRATULATIONS! You completed the Sudoku puzzle in ${formatTimer(timer)}!`);
        setStatusType("success");
        setIsTimerRunning(false);
        setConflicts([]);
      } else {
        sound.playClick();
        setStatusMsg(`✅ Current board is valid! ${emptyCount} empty cells remaining.`);
        setStatusType("success");
        setConflicts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Report a current mistake first, then give one logical next step. No backend needed.
  const fetchSudokuHint = async () => {
    const badCells: { row: number; col: number }[] = [];
    const candidates = (row: number, col: number) => {
      const used = new Set<number>();
      for (let index = 0; index < 9; index++) {
        used.add(grid[row][index]);
        used.add(grid[index][col]);
      }
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let rowIndex = boxRow; rowIndex < boxRow + 3; rowIndex++) {
        for (let colIndex = boxCol; colIndex < boxCol + 3; colIndex++) used.add(grid[rowIndex][colIndex]);
      }
      return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((number) => !used.has(number));
    };
    const hasConflict = (row: number, col: number) => {
      const value = grid[row][col];
      if (value === 0) return false;
      for (let index = 0; index < 9; index++) {
        if ((index !== col && grid[row][index] === value) || (index !== row && grid[index][col] === value)) return true;
      }
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let rowIndex = boxRow; rowIndex < boxRow + 3; rowIndex++) for (let colIndex = boxCol; colIndex < boxCol + 3; colIndex++) {
        if ((rowIndex !== row || colIndex !== col) && grid[rowIndex][colIndex] === value) return true;
      }
      return false;
    };
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (hasConflict(row, col)) badCells.push({ row, col });
      }
    }
    if (badCells.length) {
      setConflicts(badCells);
      const cell = badCells[0];
      setAiHint(`Mistake found: the highlighted number at Row ${cell.row + 1}, Column ${cell.col + 1} duplicates a number in its row, column, or 3×3 box.`);
      return;
    }
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0 && candidates(row, col).length === 1) {
        setConflicts([]);
        setAiHint(`Next move: Row ${row + 1}, Column ${col + 1} must be ${candidates(row, col)[0]}. It is the only value allowed there.`);
        return;
      }
    }
    setConflicts([]);
    setAiHint("No mistakes found so far. Choose an empty cell and eliminate values already used in its row, column, and 3×3 box.");
  };

  const isConflicting = (r: number, c: number) => {
    return conflicts.some((p) => p.row === r && p.col === c);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const [selR, selC] = selectedCell || [-1, -1];
  // The component renders once before the starter grid is initialized by useEffect.
  // Optional access prevents that first render from crashing the game screen.
  const selectedVal = selR !== -1 && selC !== -1 ? grid[selR]?.[selC] ?? 0 : 0;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-4 md:p-6 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">🧩</span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Sudoku Constraint Engine
            </h2>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Fill the grid using row, column, and 3×3 box constraints.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
          <label className="text-xs font-medium text-slate-400 block mb-1">Difficulty</label>
          <div className="flex gap-1">
            {(["easy", "medium", "hard"] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg uppercase transition ${
                  difficulty === diff
                    ? "bg-cyan-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Timer</label>
          <div className="text-lg font-bold text-emerald-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-center font-mono">
            {formatTimer(timer)}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Cell Selected</label>
          <div className="text-sm font-semibold text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-center">
            {selectedCell ? `Row ${selectedCell[0] + 1}, Col ${selectedCell[1] + 1}` : "None"}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-400 block">Actions</label>
          <div className="flex gap-1 h-full">
            <button
              onClick={() => loadPuzzle(difficulty, true)}
              title="Generate a new puzzle of the same difficulty"
              className="flex-1 flex flex-col items-center justify-center py-1 bg-cyan-900/60 hover:bg-cyan-700 text-xs font-bold rounded-lg border border-cyan-700 text-cyan-100 transition"
            >
              <RefreshCw className="w-3.5 h-3.5 mb-0.5" /> New
            </button>
            <button
              onClick={restartCurrent}
              title="Reset the current puzzle to start"
              className="flex-1 flex flex-col items-center justify-center py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 text-slate-300 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 mb-0.5" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Algo info expandable */}
      {showAlgoInfo && (
        <div className="p-4 bg-slate-950 border border-cyan-500/30 rounded-xl text-xs space-y-2 text-slate-300 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-cyan-400 text-sm">Sudoku Backtracking & MRV Heuristic</span>
            <span className="text-slate-500">Constraint Satisfaction Problem</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
            <div>
              <span className="text-slate-400 block font-medium">Heuristic Used:</span>
              <span className="font-mono text-cyan-300">MRV (Minimum Remaining Values)</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Worst Time Complexity:</span>
              <span className="font-mono text-amber-300">O(9^(81)) (Reduced to milliseconds with MRV)</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid + Numpad & Actions */}
      <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-center">
        {/* Sudoku Grid */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-950 p-3 rounded-2xl border-2 border-slate-800 shadow-2xl">
            <div className="grid grid-cols-9 border-2 border-slate-600 bg-slate-900 rounded-lg overflow-hidden">
              {grid.map((rowArr, rIdx) =>
                rowArr.map((val, cIdx) => {
                  const isInitial = initialGrid[rIdx][cIdx] !== 0;
                  const isSelected = selR === rIdx && selC === cIdx;
                  const isSameRowColBox =
                    selR === rIdx ||
                    selC === cIdx ||
                    (Math.floor(selR / 3) === Math.floor(rIdx / 3) &&
                      Math.floor(selC / 3) === Math.floor(cIdx / 3));
                  const isSameValue = selectedVal !== 0 && val === selectedVal;
                  const conflict = isConflicting(rIdx, cIdx);

                  // Box borders
                  const borderRight = cIdx % 3 === 2 && cIdx !== 8 ? "border-r-2 border-r-slate-500" : "border-r border-r-slate-800";
                  const borderBottom = rIdx % 3 === 2 && rIdx !== 8 ? "border-b-2 border-b-slate-500" : "border-b border-b-slate-800";

                  return (
                    <button
                      key={`${rIdx}-${cIdx}`}
                      onClick={() => handleCellClick(rIdx, cIdx)}
                      className={`w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center font-bold text-sm sm:text-base md:text-lg transition-all ${borderRight} ${borderBottom} ${
                        conflict
                          ? "bg-rose-900/90 text-rose-100 animate-pulse border-2 border-rose-500"
                          : isSelected
                          ? "bg-cyan-500 text-slate-950 border-2 border-cyan-300 shadow-lg scale-105 z-10"
                          : isSameValue
                          ? "bg-cyan-900/60 text-cyan-200"
                          : isSameRowColBox
                          ? "bg-slate-800/90 text-slate-200"
                          : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                      } ${isInitial ? "font-black text-white" : "font-semibold text-cyan-400"}`}
                    >
                      {val !== 0 ? val : ""}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Status Message */}
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

        {/* Numpad & Actions Panel */}
        <div className="flex flex-col gap-4 w-full lg:w-80">
          {/* Number Pad */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Input Controls</h3>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => handleNumberInput(n)}
                  className="py-3 bg-slate-800 hover:bg-cyan-600 text-white font-extrabold text-xl rounded-xl border border-slate-700 hover:border-cyan-400 transition active:scale-95 shadow"
                >
                  {n}
                </button>
              ))}
            </div>

            <button
              onClick={handleErase}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 font-bold text-sm rounded-xl border border-slate-700 transition"
            >
              <Eraser className="w-4 h-4" /> Clear Cell
            </button>
          </div>

          {/* Solver Actions */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <button
              onClick={validateSudoku}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow transition"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Validate Grid</span>
            </button>

            <button
              onClick={fetchSudokuHint}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow transition"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Check Mistakes & Next Step</span>
            </button>
          </div>

          {/* Hint card */}
          <div className="bg-slate-950 border border-indigo-500/40 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Sudoku Hint</span>
            </div>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed italic">
              {aiHint || 'Click "Get Next-Step Hint" for one focused move or a highlighted mistake.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
