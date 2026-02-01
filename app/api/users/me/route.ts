import { auth, currentUser } from "@clerk/nextjs/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Try to find user in DB
  let user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  // If not found, sync from Clerk
  if (!user) {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const primaryEmail =
      clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

    if (!primaryEmail) {
      return NextResponse.json(
        { error: "No email found for user" },
        { status: 400 }
      );
    }

    const newUser = {
      id: clerkUser.id,
      email: primaryEmail,
      username: clerkUser.username || null,
      firstName: clerkUser.firstName || null,
      lastName: clerkUser.lastName || null,
      imageUrl: clerkUser.imageUrl || null,
    };

    await db.insert(users).values(newUser);

    user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
  }

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { languagePreference } = body;

  if (!languagePreference) {
    return NextResponse.json(
      { error: "languagePreference is required" },
      { status: 400 }
    );
  }

  await db
    .update(users)
    .set({
      languagePreference,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return NextResponse.json(user);
}
