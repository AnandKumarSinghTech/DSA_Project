import { NextResponse } from "next/server";
import { runCppBinary } from "@/lib/dsaRunner";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const size = body.size ?? 3;
    const player = body.player ?? "O";
    const boardStr = body.boardStr ?? "_________";
    const mode = body.mode ?? "move";

    const res = await runCppBinary("tictactoe", [String(size), player, boardStr, mode]);
    return NextResponse.json({ ...res, engine: "cpp_binary" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
