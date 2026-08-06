import { NextResponse } from "next/server";
import { runCppBinary, fallbackHanoi } from "@/lib/dsaRunner";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const size = body.size ?? 3;

    const res = await runCppBinary("hanoi", [String(size)]);
    if (res.error) {
      const fallback = fallbackHanoi(size);
      return NextResponse.json({ ...fallback, engine: "typescript_fallback" });
    }
    return NextResponse.json({ ...res, engine: "cpp_binary" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
