import { NextResponse } from "next/server";
import { db } from "@/db";
import { gameScores } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const game = searchParams.get("game");

    let query = db.select().from(gameScores);
    if (game) {
      // @ts-ignore
      query = query.where(eq(gameScores.game, game));
    }

    const scores = await query.orderBy(desc(gameScores.score)).limit(10);
    return NextResponse.json({ scores });
  } catch (error: any) {
    return NextResponse.json({ scores: [], error: error.message });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { game, playerName, difficulty, movesCount, timeSeconds, score } = body;

    const newScore = await db.insert(gameScores).values({
      game,
      playerName: playerName || "Player",
      difficulty: difficulty || "medium",
      movesCount: movesCount || 0,
      timeSeconds: timeSeconds || 0,
      score: score || 100,
    }).returning();

    return NextResponse.json({ success: true, score: newScore[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
