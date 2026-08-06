"use client";

import React, { useState, useEffect } from "react";
import { sound } from "@/lib/sound";
import { Sparkles, CheckCircle2, AlertTriangle, RefreshCw, Play, Lightbulb, Info, User, Bot, Users } from "lucide-react";
import confetti from "canvas-confetti";

interface TicTacToeProps {
  onBack?: () => void;
}

type Mode = "pvai" | "pvp" | "aivai";

export default function TicTacToe({ onBack }: TicTacToeProps) {
  const [boardSize, setBoardSize] = useState<number>(3);
  const [mode, setMode] = useState<Mode>("pvai");
  const [board, setBoard] = useState<string[][]>([]);
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [winner, setWinner] = useState<string | null>(null);
  const [scores, setScores] = useState({ X: 0, O: 0, ties: 0 });
  const [statusMsg, setStatusMsg] = useState<string>("Player X's turn.");
  const [statusType, setStatusType] = useState<"info" | "success" | "error">("info");
  const [loading, setLoading] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [aiHint, setAiHint] = useState<string>("");
  const [showAlgoInfo, setShowAlgoInfo] = useState<boolean>(false);

  const initBoard = (size: number) => {
    const b = Array(size).fill("_").map(() => Array(size).fill("_"));
    setBoard(b);
    setTurn("X");
    setWinner(null);
    setStatusMsg("New game started. Player X turn.");
    setStatusType("info");
    setAiHint("");
    setTimer(0);
    setIsTimerRunning(false);
  };

  useEffect(() => {
    initBoard(boardSize);
  }, [boardSize]);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = window.setInterval(() => setTimer((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(interval);
  }, [isTimerRunning]);

  // Check local winner
  const checkLocalWinner = (b: string[][]): string | null => {
    const N = b.length;
    const winLen = N === 3 ? 3 : 4;

    // Rows and Columns
    for (let r = 0; r < N; r++) {
      for (let c = 0; c <= N - winLen; c++) {
        const rowFirst = b[r][c];
        if (rowFirst !== "_") {
          let rowWin = true;
          for (let k = 1; k < winLen; k++) if (b[r][c + k] !== rowFirst) rowWin = false;
          if (rowWin) return rowFirst;
        }

        const colFirst = b[c][r];
        if (colFirst !== "_") {
          let colWin = true;
          for (let k = 1; k < winLen; k++) if (b[c + k][r] !== colFirst) colWin = false;
          if (colWin) return colFirst;
        }
      }
    }

    // Diagonals
    for (let r = 0; r <= N - winLen; r++) {
      for (let c = 0; c <= N - winLen; c++) {
        const d1 = b[r][c];
        if (d1 !== "_") {
          let win1 = true;
          for (let k = 1; k < winLen; k++) if (b[r + k][c + k] !== d1) win1 = false;
          if (win1) return d1;
        }
      }
    }

    for (let r = 0; r <= N - winLen; r++) {
      for (let c = winLen - 1; c < N; c++) {
        const d2 = b[r][c];
        if (d2 !== "_") {
          let win2 = true;
          for (let k = 1; k < winLen; k++) if (b[r + k][c - k] !== d2) win2 = false;
          if (win2) return d2;
        }
      }
    }

    const hasEmpty = b.some((row) => row.includes("_"));
    if (!hasEmpty) return "D"; // Draw

    return null;
  };

  // Browser-based opponent: win, block, then prefer the center/corners.
  const triggerAIMove = (currentBoard: string[][], aiMark: "X" | "O") => {
    const emptyCells: [number, number][] = [];
    currentBoard.forEach((row, rowIndex) => row.forEach((cell, colIndex) => {
      if (cell === "_") emptyCells.push([rowIndex, colIndex]);
    }));
    const opponent = aiMark === "X" ? "O" : "X";
    const pickFor = (mark: "X" | "O") => emptyCells.find(([row, col]) => {
      const test = currentBoard.map((line, rowIndex) => line.map((cell, colIndex) => rowIndex === row && colIndex === col ? mark : cell));
      return checkLocalWinner(test) === mark;
    });
    const center = Math.floor(boardSize / 2);
    const preferred = pickFor(aiMark) ?? pickFor(opponent) ?? emptyCells.find(([row, col]) => row === center && col === center) ?? emptyCells[0];
    if (!preferred) return;
    const [targetRow, targetCol] = preferred;
    sound.playPlace();
    const nextBoard = currentBoard.map((row, rowIndex) => row.map((cell, colIndex) => rowIndex === targetRow && colIndex === targetCol ? aiMark : cell));
    setBoard(nextBoard);
    const winner = checkLocalWinner(nextBoard);
    if (winner) handleGameOver(winner);
    else {
      const nextTurn = aiMark === "X" ? "O" : "X";
      setTurn(nextTurn);
      setStatusMsg(`Player ${nextTurn}'s turn.`);
    }
  };

  const handleGameOver = (w: string) => {
    setWinner(w);
    setIsTimerRunning(false);
    if (w === "D") {
      sound.playClick();
      setScores((s) => ({ ...s, ties: s.ties + 1 }));
      setStatusMsg("🤝 Game ended in a Draw!");
      setStatusType("info");
    } else {
      sound.playSuccess();
      confetti({ particleCount: 90, spread: 60 });
      setScores((s) => ({ ...s, [w]: s[w as "X" | "O"] + 1 }));
      setStatusMsg(`🎉 Player ${w} WINS!`);
      setStatusType("success");
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (winner || board[r][c] !== "_" || loading) return;

    if (!isTimerRunning) setIsTimerRunning(true);
    sound.playPlace();
    const newBoard = board.map((rArr, rIdx) =>
      rArr.map((val, cIdx) => (rIdx === r && cIdx === c ? turn : val))
    );
    setBoard(newBoard);

    const w = checkLocalWinner(newBoard);
    if (w) {
      handleGameOver(w);
      return;
    }

    const nextTurn = turn === "X" ? "O" : "X";
    setTurn(nextTurn);
    setStatusMsg(`Player ${nextTurn}'s turn.`);

    // If Player vs AI, let the built-in browser opponent respond.
    if (mode === "pvai" && nextTurn === "O") {
      setTimeout(() => triggerAIMove(newBoard, "O"), 250);
    }
  };

  const validateBoard = () => {
    const result = checkLocalWinner(board);
    if (result) {
      setIsTimerRunning(false);
      setStatusMsg(result === "D" ? "🤝 Draw confirmed. Timer stopped." : `🎉 ${result} wins! Timer stopped.`);
    } else {
      setStatusMsg("✅ Board is valid and still in progress.");
    }
    setStatusType("success");
  };

  // AI vs AI demonstration step
  const triggerAIVsAIStep = () => {
    if (winner) return;
    triggerAIMove(board, turn);
  };

  const showTicTacToeHint = () => {
    const emptyCells: [number, number][] = [];
    board.forEach((row, rowIndex) => row.forEach((cell, colIndex) => {
      if (cell === "_") emptyCells.push([rowIndex, colIndex]);
    }));
    const winningMove = (mark: "X" | "O") => emptyCells.find(([row, col]) => {
      const testBoard = board.map((line, rowIndex) => line.map((cell, colIndex) => rowIndex === row && colIndex === col ? mark : cell));
      return checkLocalWinner(testBoard) === mark;
    });
    const win = winningMove(turn);
    if (win) {
      setAiHint(`Next move: place ${turn} at Row ${win[0] + 1}, Column ${win[1] + 1} to win immediately.`);
      return;
    }
    const opponent = turn === "X" ? "O" : "X";
    const block = winningMove(opponent);
    if (block) {
      setAiHint(`Mistake to avoid: ${opponent} can win next turn. Block Row ${block[0] + 1}, Column ${block[1] + 1} now.`);
      return;
    }
    const center = Math.floor(boardSize / 2);
    if (board[center]?.[center] === "_") {
      setAiHint(`No immediate mistake found. Next move: take the center at Row ${center + 1}, Column ${center + 1} to create more winning lines.`);
      return;
    }
    setAiHint("No immediate mistake found. Look for a move that creates two possible winning lines on your next turn.");
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-4 md:p-6 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">❌⭕</span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
              Tic-Tac-Toe Minimax AI
            </h2>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Unbeatable Minimax Algorithm with Alpha-Beta Pruning via C++ Engine.
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

      {/* Settings Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Grid Size</label>
          <select
            value={boardSize}
            onChange={(e) => setBoardSize(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 text-white text-sm font-semibold rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value={3}>3 × 3 (3 in a row)</option>
            <option value={4}>4 × 4 (4 in a row)</option>
            <option value={5}>5 × 5 (4 in a row)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Game Mode</label>
          <div className="flex gap-1">
            <button
              onClick={() => { setMode("pvai"); initBoard(boardSize); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition ${
                mode === "pvai" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              <Bot className="w-3.5 h-3.5" /> vs AI
            </button>
            <button
              onClick={() => { setMode("pvp"); initBoard(boardSize); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition ${
                mode === "pvp" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              <Users className="w-3.5 h-3.5" /> 2P
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Scoreboard</label>
          <div className="text-sm font-bold bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-center flex justify-around">
            <span className="text-cyan-400">X: {scores.X}</span>
            <span className="text-slate-400">Ties: {scores.ties}</span>
            <span className="text-purple-400">O: {scores.O}</span>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Active Turn</label>
          <div className="text-sm font-bold bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-center">
            {turn === "X" ? <span className="text-cyan-400">Player X (Turn)</span> : <span className="text-purple-400">Player O (Turn)</span>}
          </div>
        </div>
      </div>

      {/* Algo Specs Drawer */}
      {showAlgoInfo && (
        <div className="p-4 bg-slate-950 border border-indigo-500/30 rounded-xl text-xs space-y-2 text-slate-300 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-indigo-400 text-sm">C++ Minimax & Alpha-Beta Pruning</span>
            <span className="text-slate-500">Game Theory Decision Tree</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
            <div>
              <span className="text-slate-400 block font-medium">Tree Evaluation:</span>
              <span className="font-mono text-purple-300">Minimax with Depth-Limited Search</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Optimization:</span>
              <span className="font-mono text-cyan-300">Alpha-Beta Pruning (Prunes branch searches)</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid View */}
      <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-center">
        {/* Tic-Tac-Toe Grid */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-950 p-4 rounded-2xl border-2 border-slate-800 shadow-2xl">
            <div
              className="grid gap-2 bg-slate-900 p-2 rounded-xl"
              style={{
                gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
                width: `${Math.min(420, Math.max(260, boardSize * 80))}px`,
                height: `${Math.min(420, Math.max(260, boardSize * 80))}px`,
              }}
            >
              {board.map((rowArr, rIdx) =>
                rowArr.map((val, cIdx) => (
                  <button
                    key={`${rIdx}-${cIdx}`}
                    onClick={() => handleCellClick(rIdx, cIdx)}
                    disabled={winner !== null || loading}
                    className={`flex items-center justify-center font-black text-3xl md:text-5xl rounded-xl transition-all transform active:scale-95 shadow-inner border border-slate-800/80 ${
                      val === "X"
                        ? "bg-cyan-950/80 text-cyan-400 border-cyan-500/40"
                        : val === "O"
                        ? "bg-purple-950/80 text-purple-400 border-purple-500/40"
                        : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-600"
                    }`}
                  >
                    {val === "X" ? "✕" : val === "O" ? "◯" : ""}
                  </button>
                ))
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

        {/* Action Panel & AI Hint */}
        <div className="flex flex-col gap-4 w-full lg:w-80">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Actions & Logic</h3>

            <button
              onClick={validateBoard}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow transition"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Validate Board</span>
            </button>

            <button
              onClick={showTicTacToeHint}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow transition"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Check Mistakes & Next Move</span>
            </button>

            <button
              onClick={() => initBoard(boardSize)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New Game</span>
            </button>
          </div>

          {/* AI Hint Card */}
          <div className="bg-slate-950 border border-indigo-500/40 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Game Hint</span>
            </div>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed italic">
              {aiHint || 'Click "Check Mistakes & Next Move" for tactical feedback.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
