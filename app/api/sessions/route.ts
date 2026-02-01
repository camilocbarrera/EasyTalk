import { auth } from "@clerk/nextjs/server";
import { db, sessions, sessionParticipants } from "@/lib/db";
import { eq, or, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { generateSessionCode } from "@/lib/utils/session-code";
import { ensureUserInDb } from "@/lib/auth/ensure-user";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get sessions where user is creator or participant
  const userSessions = await db.query.sessions.findMany({
    where: or(eq(sessions.creatorId, userId)),
    with: {
      creator: true,
      participants: {
        with: {
          user: true,
        },
      },
    },
    orderBy: [desc(sessions.updatedAt)],
  });

  // Also get sessions where user is a participant
  const participantSessions = await db.query.sessionParticipants.findMany({
    where: eq(sessionParticipants.userId, userId),
    with: {
      session: {
        with: {
          creator: true,
          participants: {
            with: {
              user: true,
            },
          },
        },
      },
    },
  });

  // Merge and deduplicate
  const allSessions = [
    ...userSessions,
    ...participantSessions.map((p) => p.session),
  ];

  const uniqueSessions = allSessions.filter(
    (session, index, self) => index === self.findIndex((s) => s.id === session.id)
  );

  return NextResponse.json(uniqueSessions);
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure user exists in database (sync from Clerk if needed)
  const user = await ensureUserInDb(userId);
  if (!user) {
    return NextResponse.json(
      { error: "Failed to sync user. Please try again." },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { name, expiresAt } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Generate unique session code
  let code = generateSessionCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const existing = await db.query.sessions.findFirst({
      where: eq(sessions.code, code),
    });

    if (!existing) break;
    code = generateSessionCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    return NextResponse.json(
      { error: "Failed to generate unique code" },
      { status: 500 }
    );
  }

  const [session] = await db
    .insert(sessions)
    .values({
      name: name.trim(),
      code,
      creatorId: userId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })
    .returning();

  // Add creator as participant
  await db.insert(sessionParticipants).values({
    sessionId: session.id,
    userId,
  });

  // Return full session with relations
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

  return NextResponse.json(fullSession, { status: 201 });
}
