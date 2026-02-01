import { auth } from "@clerk/nextjs/server";
import { db, sessions, sessionParticipants, users } from "@/lib/db";
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

  // Verify user exists in our DB
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found. Please refresh and try again." },
      { status: 404 }
    );
  }

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, id),
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Check if session has expired
  if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Session has expired" }, { status: 410 });
  }

  // Check if already a participant
  const existingParticipant = await db.query.sessionParticipants.findFirst({
    where: and(
      eq(sessionParticipants.sessionId, id),
      eq(sessionParticipants.userId, userId)
    ),
  });

  if (existingParticipant) {
    // Already a participant, just return success
    return NextResponse.json({ success: true, alreadyJoined: true });
  }

  // Add as participant
  await db.insert(sessionParticipants).values({
    sessionId: id,
    userId,
  });

  return NextResponse.json({ success: true, alreadyJoined: false });
}
