import { NextResponse } from "next/server";
import { runCppBinary, fallbackSudokuSolve, fallbackSudokuValidate } from "@/lib/dsaRunner";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const boardStr = body.boardStr ?? "";
    const mode = body.mode ?? "solve";

    const res = await runCppBinary("sudoku", [mode, boardStr]);
    if (res.error) {
      if (mode === "solve") {
        const fallback = fallbackSudokuSolve(boardStr);
        return NextResponse.json({ ...fallback, engine: "typescript_fallback" });
      }
      if (mode === "validate") {
        return NextResponse.json({ ...fallbackSudokuValidate(boardStr), engine: "typescript_fallback" });
      }
    }
    return NextResponse.json({ ...res, engine: "cpp_binary" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
