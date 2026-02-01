import { currentUser } from "@clerk/nextjs/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

/**
 * Ensures the current Clerk user exists in our database.
 * If not, syncs them from Clerk.
 * Returns the user or null if not authenticated.
 */
export async function ensureUserInDb(userId: string) {
  // Check if user exists
  let user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (user) {
    return user;
  }

  // User doesn't exist, sync from Clerk
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const primaryEmail =
    clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

  if (!primaryEmail) {
    return null;
  }

  // Insert user
  const newUser = {
    id: clerkUser.id,
    email: primaryEmail,
    username: clerkUser.username || null,
    firstName: clerkUser.firstName || null,
    lastName: clerkUser.lastName || null,
    imageUrl: clerkUser.imageUrl || null,
  };

  await db.insert(users).values(newUser).onConflictDoNothing();

  // Fetch and return
  user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return user;
}
