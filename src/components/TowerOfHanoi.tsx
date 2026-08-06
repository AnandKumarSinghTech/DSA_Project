"use client";

import React, { useState, useEffect, useRef } from "react";
import { sound } from "@/lib/sound";
import { Sparkles, CheckCircle2, AlertTriangle, RefreshCw, Play, Pause, SkipForward, SkipBack, Lightbulb, Info, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

interface TowerOfHanoiProps {
  onBack?: () => void;
}

type PegsState = {
  A: number[];
  B: number[];
  C: number[];
};

export default function TowerOfHanoi({ onBack }: TowerOfHanoiProps) {
  const [numDisks, setNumDisks] = useState<number>(3);
  const [pegs, setPegs] = useState<PegsState>({ A: [], B: [], C: [] });
  const [selectedPeg, setSelectedPeg] = useState<keyof PegsState | null>(null);
  const [moves, setMoves] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string>("Move all disks from Peg A to Peg C. Never place a larger disk on a smaller disk.");
  const [statusType, setStatusType] = useState<"info" | "success" | "error">("info");
  const [loading, setLoading] = useState<boolean>(false);
  const [aiHint, setAiHint] = useState<string>("");
  const [timer, setTimer] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [showAlgoInfo, setShowAlgoInfo] = useState<boolean>(false);

  // Auto solver playback state
  const [solutionSteps, setSolutionSteps] = useState<{ step: number; disk: number; from: "A"|"B"|"C"; to: "A"|"B"|"C" }[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1);
  const [isPlayingAuto, setIsPlayingAuto] = useState<boolean>(false);
  const [autoSpeed, setAutoSpeed] = useState<number>(600); // ms per step

  const autoTimerRef = useRef<any>(null);

  const minMoves = Math.pow(2, numDisks) - 1;

  // Colors for disks
  const DISK_COLORS = [
    "bg-rose-500 border-rose-300 text-white",
    "bg-amber-500 border-amber-300 text-slate-950",
    "bg-emerald-500 border-emerald-300 text-slate-950",
    "bg-cyan-500 border-cyan-300 text-slate-950",
    "bg-indigo-500 border-indigo-300 text-white",
    "bg-purple-500 border-purple-300 text-white",
    "bg-pink-500 border-pink-300 text-white",
    "bg-teal-500 border-teal-300 text-slate-950",
  ];

  const initPuzzle = (disks: number) => {
    const diskArr = Array.from({ length: disks }, (_, i) => disks - i); // Largest at bottom [3, 2, 1]
    setPegs({ A: diskArr, B: [], C: [] });
    setSelectedPeg(null);
    setMoves(0);
    setTimer(0);
    setIsTimerRunning(false);
    setStatusMsg(`Tower initialized with ${disks} disks. Target minimum moves: ${Math.pow(2, disks) - 1}.`);
    setStatusType("info");
    setAiHint("");
    setSolutionSteps([]);
    setCurrentStepIdx(-1);
    setIsPlayingAuto(false);
  };

  useEffect(() => {
    initPuzzle(numDisks);
  }, [numDisks]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Handle peg clicking for moving top disk
  const handlePegClick = (pegKey: keyof PegsState) => {
    if (isPlayingAuto) return;

    if (selectedPeg === null) {
      // Pick up top disk from pegKey
      if (pegs[pegKey].length === 0) return;
      sound.playClick();
      setSelectedPeg(pegKey);
      if (!isTimerRunning) setIsTimerRunning(true);
    } else if (selectedPeg === pegKey) {
      // Unselect
      sound.playClick();
      setSelectedPeg(null);
    } else {
      // Try move top disk from selectedPeg to pegKey
      const sourceDisks = [...pegs[selectedPeg]];
      const targetDisks = [...pegs[pegKey]];
      const movingDisk = sourceDisks[sourceDisks.length - 1];
      const targetTopDisk = targetDisks[targetDisks.length - 1];

      if (targetTopDisk && movingDisk > targetTopDisk) {
        sound.playError();
        setStatusMsg("❌ Illegal move! Cannot place a larger disk on top of a smaller disk.");
        setStatusType("error");
        setSelectedPeg(null);
        return;
      }

      // Valid move
      sound.playPlace();
      sourceDisks.pop();
      targetDisks.push(movingDisk);

      const newPegs = { ...pegs, [selectedPeg]: sourceDisks, [pegKey]: targetDisks };
      setPegs(newPegs);
      setMoves((m) => m + 1);
      setSelectedPeg(null);

      // Check win condition (all disks on Peg C in correct order)
      if (newPegs.C.length === numDisks) {
        sound.playSuccess();
        confetti({ particleCount: 100, spread: 70 });
        setStatusMsg(`🎉 VICTORY! Solved in ${moves + 1} moves (Optimal minimum: ${minMoves})!`);
        setStatusType("success");
        setIsTimerRunning(false);
      } else {
        setStatusMsg(`Moved disk ${movingDisk} from Peg ${selectedPeg} to Peg ${pegKey}.`);
        setStatusType("info");
      }
    }
  };

  // Fetch C++ Recursive Solution steps
  const fetchCppSolution = async () => {
    setLoading(true);
    setStatusMsg("Calculating C++ Recursive Move Sequence...");
    try {
      const res = await fetch("/api/dsa/hanoi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size: numDisks }),
      });
      const data = await res.json();

      if (data.moves) {
        sound.playSolve();
        setSolutionSteps(data.moves);
        setCurrentStepIdx(-1);
        setStatusMsg(`Loaded C++ solution sequence (${data.moves.length} moves). Press Play or Step Forward.`);
        setStatusType("success");
      }
    } catch (e) {
      setStatusMsg("Error loading C++ solution.");
      setStatusType("error");
    } finally {
      setLoading(false);
    }
  };

  // Step Auto Solver forward
  const stepForward = () => {
    if (solutionSteps.length === 0) return;
    const nextIdx = currentStepIdx + 1;
    if (nextIdx >= solutionSteps.length) {
      setIsPlayingAuto(false);
      sound.playSuccess();
      confetti({ particleCount: 80, spread: 60 });
      setStatusMsg("🎉 Auto Solver Completed Hanoi Puzzle!");
      setStatusType("success");
      return;
    }

    const move = solutionSteps[nextIdx];
    setCurrentStepIdx(nextIdx);

    setPegs((prevPegs) => {
      const src = [...prevPegs[move.from]];
      const dst = [...prevPegs[move.to]];
      const disk = src.pop();
      if (disk !== undefined) dst.push(disk);
      return { ...prevPegs, [move.from]: src, [move.to]: dst };
    });

    sound.playPlace();
    setMoves(nextIdx + 1);
  };

  // Auto solver interval loop
  useEffect(() => {
    if (isPlayingAuto) {
      autoTimerRef.current = setTimeout(() => {
        stepForward();
      }, autoSpeed);
    } else {
      clearTimeout(autoTimerRef.current);
    }
    return () => clearTimeout(autoTimerRef.current);
  }, [isPlayingAuto, currentStepIdx, autoSpeed, solutionSteps]);

  // Validate state
  const validateState = () => {
    // Check all pegs for inverted disks
    for (const [pegKey, diskArr] of Object.entries(pegs)) {
      for (let i = 0; i < diskArr.length - 1; i++) {
        if (diskArr[i] < diskArr[i + 1]) {
          sound.playError();
          setStatusMsg(`❌ Invalid state detected on Peg ${pegKey}!`);
          setStatusType("error");
          return;
        }
      }
    }
    sound.playSuccess();
    const solved = pegs.C.length === numDisks;
    if (solved) setIsTimerRunning(false);
    setStatusMsg(solved ? "🎉 Puzzle fully solved! Timer stopped." : "✅ Valid Hanoi state! Disks are legally stacked.");
    setStatusType("success");
  };

  const showHanoiHint = () => {
    const pegNames: (keyof PegsState)[] = ["A", "B", "C"];
    for (const peg of pegNames) {
      const stack = pegs[peg];
      if (stack.some((disk, index) => index < stack.length - 1 && disk < stack[index + 1])) {
        setAiHint(`Mistake found on Peg ${peg}: a larger disk cannot sit on a smaller disk. Fix that stack before making another move.`);
        return;
      }
    }
    if (pegs.C.length === numDisks) {
      setAiHint("No mistakes—every disk is on Peg C. The puzzle is complete!");
      return;
    }
    for (const from of pegNames) for (const to of pegNames) {
      if (from === to || pegs[from].length === 0) continue;
      const disk = pegs[from][pegs[from].length - 1];
      const target = pegs[to][pegs[to].length - 1];
      if (!target || disk < target) {
        setAiHint(`No mistakes so far. A legal next move is disk ${disk} from Peg ${from} to Peg ${to}. Keep the smallest disk on top.`);
        return;
      }
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-4 md:p-6 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">🗼</span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
              Tower of Hanoi Solver
            </h2>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Recursive algorithm solver ($T(n) = 2^n - 1$) with interactive step-by-step controls.
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
          <label className="text-xs font-medium text-slate-400 block mb-1">Disk Count (N)</label>
          <select
            value={numDisks}
            onChange={(e) => setNumDisks(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 text-white text-sm font-semibold rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            {[3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} Disks ({Math.pow(2, n) - 1} moves)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Moves / Optimal</label>
          <div className="text-lg font-bold text-emerald-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-center font-mono">
            {moves} / {minMoves}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Timer</label>
          <div className="text-lg font-bold text-cyan-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-center font-mono">
            {formatTimer(timer)}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Selection State</label>
          <div className="text-sm font-bold text-amber-400 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 text-center">
            {selectedPeg ? `Selected Peg ${selectedPeg}` : "Click a Peg to pick up"}
          </div>
        </div>
      </div>

      {/* Algo Specs Drawer */}
      {showAlgoInfo && (
        <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl text-xs space-y-2 text-slate-300 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-emerald-400 text-sm">C++ Recursive Divide & Conquer Algorithm</span>
            <span className="text-slate-500">Recurrence Relation: T(N) = 2T(N-1) + 1</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
            <div>
              <span className="text-slate-400 block font-medium">Time Complexity:</span>
              <span className="font-mono text-emerald-300">O(2^N) exponential</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Space Complexity:</span>
              <span className="font-mono text-emerald-300">O(N) recursion call stack</span>
            </div>
          </div>
        </div>
      )}

      {/* Pegs Display Area */}
      <div className="flex flex-col items-center">
        <div className="w-full bg-slate-950 p-6 md:p-8 rounded-2xl border-2 border-slate-800 shadow-2xl relative min-h-[320px] flex items-end justify-around">
          {(["A", "B", "C"] as const).map((pegKey) => {
            const diskList = pegs[pegKey];
            const isSelected = selectedPeg === pegKey;

            return (
              <div
                key={pegKey}
                onClick={() => handlePegClick(pegKey)}
                className={`relative flex flex-col items-center justify-end w-1/3 max-w-[200px] h-64 cursor-pointer group rounded-xl transition-all p-2 ${
                  isSelected ? "bg-amber-500/10 border-2 border-dashed border-amber-400/80" : "hover:bg-slate-900/60"
                }`}
              >
                {/* Vertical Pole */}
                <div className="absolute bottom-6 w-3 h-52 bg-slate-700 rounded-t-full group-hover:bg-slate-600 transition" />

                {/* Base Platform */}
                <div className="absolute bottom-2 w-full h-4 bg-slate-800 rounded-lg border border-slate-700 shadow-lg flex items-center justify-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Peg {pegKey} {pegKey === "C" ? "(Target)" : ""}
                  </span>
                </div>

                {/* Disks stacked bottom to top */}
                <div className="z-10 flex flex-col-reverse items-center gap-1.5 mb-5 w-full">
                  {diskList.map((diskSize, idx) => {
                    const widthPct = 25 + (diskSize / numDisks) * 70; // Width scaling
                    const isTopDisk = idx === diskList.length - 1;
                    const colorClass = DISK_COLORS[(diskSize - 1) % DISK_COLORS.length];

                    return (
                      <div
                        key={diskSize}
                        style={{ width: `${widthPct}%` }}
                        className={`h-7 rounded-lg border flex items-center justify-center font-extrabold text-xs shadow-md transition-all transform ${colorClass} ${
                          isSelected && isTopDisk ? "-translate-y-4 scale-105 shadow-amber-500/50 ring-2 ring-amber-300" : ""
                        }`}
                      >
                        Disk {diskSize}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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

      {/* Action Bar & AI Hint */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Game controls */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Check Your Progress
          </h3>

          <button
            onClick={validateState}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow transition"
          >
            <CheckCircle2 className="w-4 h-4" /> Validate Current State
          </button>

          <button
            onClick={() => initPuzzle(numDisks)}
            className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Puzzle
          </button>
        </div>

        {/* Right: AI Smart Hint */}
        <div className="bg-slate-950 border border-indigo-500/40 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Progress Hint</span>
            </div>
            <button
              onClick={showHanoiHint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Check Mistakes & Next Move</span>
            </button>
          </div>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed italic">
            {aiHint || 'Click "Check Mistakes & Next Move" for feedback on your current position.'}
          </p>
        </div>
      </div>
    </div>
  );
}
