import { execFile, execSync } from "child_process";
import path from "path";
import fs from "fs";

const projectRoot = process.cwd();
const binDir = path.join(projectRoot, "bin");
const cppDir = path.join(projectRoot, "cpp");
const executableName = (name: string) => `${name}${process.platform === "win32" ? ".exe" : ""}`;

// Helper to ensure C++ binaries are compiled
export function ensureCppBinaries(): void {
  try {
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }

    const binaries = ["nqueens", "sudoku", "hanoi"];
    for (const bin of binaries) {
      const binPath = path.join(binDir, executableName(bin));
      const cppPath = path.join(cppDir, `${bin}.cpp`);

      if (!fs.existsSync(binPath) && fs.existsSync(cppPath)) {
        try {
          execSync(`g++ -O3 "${cppPath}" -o "${binPath}"`, { stdio: "ignore" });
        } catch (e) {
          console.warn(`Could not compile C++ binary ${bin}:`, e);
        }
      }
    }
  } catch (e) {
    console.warn("ensureCppBinaries error:", e);
  }
}

// Execute C++ binary
export function runCppBinary(binaryName: string, args: string[]): Promise<any> {
  return new Promise((resolve) => {
    ensureCppBinaries();
    const binPath = path.join(binDir, executableName(binaryName));

    if (!fs.existsSync(binPath)) {
      resolve({ error: `Binary ${binaryName} not found` });
      return;
    }

    execFile(binPath, args, { timeout: 8000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing C++ binary ${binaryName}:`, stderr || error.message);
        resolve({ error: stderr || error.message });
        return;
      }
      try {
        const json = JSON.parse(stdout.trim());
        resolve(json);
      } catch (e) {
        resolve({ rawOutput: stdout.trim() });
      }
    });
  });
}

/* ============================================================
   TYPESCRIPT FALLBACK ALGORITHMS
   ============================================================ */

export function fallbackNQueens(N: number, boardStr?: string): any {
  const board: number[][] = Array(N).fill(0).map(() => Array(N).fill(0));
  if (boardStr && boardStr.length >= N * N) {
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        board[i][j] = boardStr[i * N + j] === "1" ? 1 : 0;
      }
    }
  }

  function isSafe(b: number[][], row: number, col: number) {
    for (let i = 0; i < col; i++) if (b[row][i] === 1) return false;
    for (let i = row, j = col; i >= 0 && j >= 0; i--, j--) if (b[i][j] === 1) return false;
    for (let i = row, j = col; i < N && j >= 0; i++, j--) if (b[i][j] === 1) return false;
    return true;
  }

  function solve(col: number): boolean {
    if (col >= N) return true;
    for (let i = 0; i < N; i++) {
      if (isSafe(board, i, col)) {
        board[i][col] = 1;
        if (solve(col + 1)) return true;
        board[i][col] = 0;
      }
    }
    return false;
  }

  const success = solve(0);
  return success ? { status: "success", N, board } : { status: "no_solution", N };
}

export function fallbackSudokuSolve(boardStr: string): any {
  const grid: number[][] = Array(9).fill(0).map(() => Array(9).fill(0));
  for (let i = 0; i < 81; i++) {
    const val = parseInt(boardStr[i] || "0", 10);
    grid[Math.floor(i / 9)][i % 9] = isNaN(val) ? 0 : val;
  }

  function isValid(r: number, c: number, num: number): boolean {
    for (let i = 0; i < 9; i++) {
      if (grid[r][i] === num && i !== c) return false;
      if (grid[i][c] === num && i !== r) return false;
    }
    const boxR = Math.floor(r / 3) * 3;
    const boxC = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const nr = boxR + i, nc = boxC + j;
        if (grid[nr][nc] === num && (nr !== r || nc !== c)) return false;
      }
    }
    return true;
  }

  function solve(): boolean {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(r, c, num)) {
              grid[r][c] = num;
              if (solve()) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  const success = solve();
  return success ? { status: "success", solution: grid } : { status: "no_solution" };
}

export function fallbackSudokuValidate(boardStr: string): any {
  const grid = Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => Number.parseInt(boardStr[row * 9 + col] || "0", 10) || 0)
  );
  const conflicts: { row: number; col: number; val: number }[] = [];
  const recordDuplicates = (cells: { row: number; col: number }[]) => {
    const values = new Map<number, { row: number; col: number }[]>();
    cells.forEach(({ row, col }) => {
      const value = grid[row][col];
      if (value) values.set(value, [...(values.get(value) ?? []), { row, col }]);
    });
    values.forEach((positions, value) => {
      if (positions.length > 1) positions.forEach((position) => conflicts.push({ ...position, val: value }));
    });
  };
  for (let index = 0; index < 9; index++) {
    recordDuplicates(Array.from({ length: 9 }, (_, col) => ({ row: index, col })));
    recordDuplicates(Array.from({ length: 9 }, (_, row) => ({ row, col: index })));
  }
  for (let boxRow = 0; boxRow < 9; boxRow += 3) {
    for (let boxCol = 0; boxCol < 9; boxCol += 3) {
      recordDuplicates(Array.from({ length: 9 }, (_, index) => ({ row: boxRow + Math.floor(index / 3), col: boxCol + (index % 3) })));
    }
  }
  const uniqueConflicts = conflicts.filter((cell, index, all) =>
    all.findIndex((other) => other.row === cell.row && other.col === cell.col) === index
  );
  const emptyCount = grid.flat().filter((value) => value === 0).length;
  return {
    status: uniqueConflicts.length ? "invalid" : emptyCount ? "valid" : "completed",
    emptyCount,
    conflicts: uniqueConflicts,
  };
}

export function fallbackHanoi(disks: number): any {
  const moves: { step: number; disk: number; from: string; to: string }[] = [];
  let step = 1;

  function solve(n: number, src: string, dst: string, aux: string) {
    if (n <= 0) return;
    solve(n - 1, src, aux, dst);
    moves.push({ step: step++, disk: n, from: src, to: dst });
    solve(n - 1, aux, dst, src);
  }

  solve(disks, "A", "C", "B");
  return { disks, minMoves: Math.pow(2, disks) - 1, moves };
}
