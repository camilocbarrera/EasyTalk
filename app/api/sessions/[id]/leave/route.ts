import { auth } from "@clerk/nextjs/server";
import { db, sessions, sessionParticipants } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, id),
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Creator cannot leave (they must delete the session instead)
  if (session.creatorId === userId) {
    return NextResponse.json(
      { error: "Creator cannot leave the session. Delete the session instead." },
      { status: 400 }
    );
  }

  // Remove from participants
  await db
    .delete(sessionParticipants)
    .where(
      and(
        eq(sessionParticipants.sessionId, id),
        eq(sessionParticipants.userId, userId)
      )
    );

  return NextResponse.json({ success: true });
}
