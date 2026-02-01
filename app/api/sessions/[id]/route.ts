import { auth } from "@clerk/nextjs/server";
import { db, sessions } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
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
    with: {
      creator: true,
      participants: {
        with: {
          user: true,
        },
      },
      messages: {
        with: {
          user: true,
          translations: true,
        },
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Check if user is participant
  const isParticipant = session.participants.some((p) => p.userId === userId);
  const isCreator = session.creatorId === userId;

  if (!isParticipant && !isCreator) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  return NextResponse.json(session);
}

export async function DELETE(
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

  // Only creator can delete
  if (session.creatorId !== userId) {
    return NextResponse.json(
      { error: "Only the creator can delete the session" },
      { status: 403 }
    );
  }

  await db.delete(sessions).where(eq(sessions.id, id));

  return NextResponse.json({ success: true });
}
