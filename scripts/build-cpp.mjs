import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const outputDirectory = join(root, "bin");
const extension = process.platform === "win32" ? ".exe" : "";

mkdirSync(outputDirectory, { recursive: true });

for (const name of ["nqueens", "sudoku", "hanoi", "tictactoe"]) {
  const result = spawnSync("g++", ["-O3", join(root, "cpp", `${name}.cpp`), "-o", join(outputDirectory, `${name}${extension}`)], {
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
