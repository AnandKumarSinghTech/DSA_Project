import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/db";
import { aiHintLogs } from "@/db/schema";
import { fallbackSudokuSolve, runCppBinary } from "@/lib/dsaRunner";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { gameState, gameName, extraInfo } = body;

    // Sudoku hints are deterministic: point out a conflict, or reveal only one next cell.
    // This avoids sending the entire board to an LLM and prevents an accidental full solve.
    if (gameName === "Sudoku") {
      const boardStr = String(extraInfo?.boardStr ?? "").replace(/[^0-9]/g, "").padEnd(81, "0").slice(0, 81);
      const grid = Array.from({ length: 9 }, (_, row) =>
        Array.from({ length: 9 }, (_, col) => Number(boardStr[row * 9 + col]))
      );
      const conflicts: { row: number; col: number }[] = [];
      const addDuplicates = (cells: { row: number; col: number }[]) => {
        const positions = new Map<number, { row: number; col: number }[]>();
        cells.forEach(({ row, col }) => {
          const value = grid[row][col];
          if (value) positions.set(value, [...(positions.get(value) ?? []), { row, col }]);
        });
        positions.forEach((matches) => {
          if (matches.length > 1) conflicts.push(...matches);
        });
      };
      for (let index = 0; index < 9; index++) {
        addDuplicates(Array.from({ length: 9 }, (_, col) => ({ row: index, col })));
        addDuplicates(Array.from({ length: 9 }, (_, row) => ({ row, col: index })));
      }
      for (let boxRow = 0; boxRow < 9; boxRow += 3) {
        for (let boxCol = 0; boxCol < 9; boxCol += 3) {
          addDuplicates(Array.from({ length: 9 }, (_, index) => ({ row: boxRow + Math.floor(index / 3), col: boxCol + (index % 3) })));
        }
      }
      const uniqueConflicts = conflicts.filter((cell, index, all) =>
        all.findIndex((other) => other.row === cell.row && other.col === cell.col) === index
      );
      if (uniqueConflicts.length) {
        const cell = uniqueConflicts[0];
        return NextResponse.json({
          source: "puzzle_hint",
          conflicts: uniqueConflicts,
          hint: `The highlighted value at Row ${cell.row + 1}, Column ${cell.col + 1} duplicates a number in its row, column, or 3×3 box. Change that entry before continuing.`,
        });
      }

      const result = await runCppBinary("sudoku", ["hint", boardStr]);
      const hint = result.error ? (() => {
        const solved = fallbackSudokuSolve(boardStr);
        if (solved.status !== "success") return { status: "no_hint" };
        const index = grid.flat().findIndex((value) => value === 0);
        return index < 0 ? { status: "no_hint" } : { status: "hint", row: Math.floor(index / 9), col: index % 9, suggestedValue: solved.solution[Math.floor(index / 9)][index % 9] };
      })() : result;
      if (hint.status === "hint") {
        return NextResponse.json({
          source: "puzzle_hint",
          hint: `Try Row ${hint.row + 1}, Column ${hint.col + 1}: ${hint.suggestedValue} is the only value that fits this next constraint step.`,
        });
      }
      return NextResponse.json({ source: "puzzle_hint", hint: "No mistake found. The board is complete or this configuration cannot be solved." });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    let hint = "";
    let source = "gemini";

    if (!apiKey) {
      source = "dsa_fallback";
      if (gameName === "N-Queens") {
        hint = "💡 Backtracking Hint: Ensure no queen shares a row, column, or diagonal. Look for empty columns where placement does not conflict with existing queens.";
      } else if (gameName === "Sudoku") {
        hint = "💡 Constraint Propagation Hint: Find cells that have only 1 valid remaining choice (Naked Single) or rows/columns missing just one digit.";
      } else if (gameName === "Tower of Hanoi") {
        hint = "💡 Recursive Strategy Hint: Remember that odd-numbered steps always move the smallest disk in a repeating pattern across pegs.";
      } else {
        hint = "💡 Tactical Minimax Hint: Center control gives the highest number of winning line opportunities. Priority 1 is blocking opponent winning moves!";
      }
    } else {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Try flash model or gemini-pro
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are an expert DSA (Data Structures & Algorithms) coach for puzzle games.
The player is currently playing "${gameName}".
Current Board State / Game Data: ${JSON.stringify(gameState)}
Additional details: ${JSON.stringify(extraInfo || {})}

Provide a clear, engaging, and highly instructive 2-3 sentence hint.
1. Mention the best next move or point out a mistake if there is one.
2. Briefly explain the underlying algorithmic reasoning (e.g. Backtracking, Constraint Satisfaction, Minimax Tree Search, or Recursion).
Keep it encouraging and brief!`;

        const result = await model.generateContent(prompt);
        hint = result.response.text();
      } catch (geminiError: any) {
        console.error("Gemini API call failed:", geminiError);
        source = "dsa_fallback";
        hint = `💡 Smart Engine Hint: Analyze available moves by testing safe candidates. Check whether your last placement caused any line or diagonal conflict!`;
      }
    }

    // Optionally record to PostgreSQL database asynchronously
    try {
      await db.insert(aiHintLogs).values({
        game: gameName || "Unknown",
        prompt: JSON.stringify(gameState),
        response: hint,
        source: source,
      });
    } catch (dbError) {
      // Ignore DB log errors if table not synced yet
    }

    return NextResponse.json({ hint, source });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
