import { NextResponse } from "next/server";
import { runCppBinary, fallbackNQueens } from "@/lib/dsaRunner";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const size = body.size ?? 8;
    const mode = body.mode ?? "solve";
    const boardStr = body.boardStr ?? "";

    const res = await runCppBinary("nqueens", [String(size), mode, boardStr]);
    if (res.error) {
      const fallback = fallbackNQueens(size, boardStr);
      return NextResponse.json({ ...fallback, engine: "typescript_fallback" });
    }
    return NextResponse.json({ ...res, engine: "cpp_binary" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
