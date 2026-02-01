import { auth } from "@clerk/nextjs/server";
import { db, sessions, sessionParticipants, users } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { userId } = await auth();
  const { code } = await params;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find session by code (case-insensitive)
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.code, code.toUpperCase()),
    with: {
      creator: true,
      participants: {
        with: {
          user: true,
        },
      },
    },
  });

  if (!session) {
    return NextResponse.json(
      { error: "Session not found with that code" },
      { status: 404 }
    );
  }

  // Check if session has expired
  if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Session has expired" }, { status: 410 });
  }

  // Check if user is already a participant
  const isParticipant = session.participants.some((p) => p.userId === userId);

  return NextResponse.json({
    ...session,
    isParticipant,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { userId } = await auth();
  const { code } = await params;

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

  // Find session by code
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.code, code.toUpperCase()),
  });

  if (!session) {
    return NextResponse.json(
      { error: "Session not found with that code" },
      { status: 404 }
    );
  }

  // Check if session has expired
  if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Session has expired" }, { status: 410 });
  }

  // Check if already a participant
  const existingParticipant = await db.query.sessionParticipants.findFirst({
    where: and(
      eq(sessionParticipants.sessionId, session.id),
      eq(sessionParticipants.userId, userId)
    ),
  });

  if (!existingParticipant) {
    // Add as participant
    await db.insert(sessionParticipants).values({
      sessionId: session.id,
      userId,
    });
  }

  // Return full session data
  const fullSession = await db.query.sessions.findFirst({
    where: eq(sessions.id, session.id),
    with: {
      creator: true,
      participants: {
        with: {
          user: true,
        },
      },
    },
  });

  return NextResponse.json({
    ...fullSession,
    alreadyJoined: !!existingParticipant,
  });
}
