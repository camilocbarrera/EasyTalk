import { auth } from "@clerk/nextjs/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from "@/lib/translation/service";

export async function PATCH(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { language } = body;

  if (!language || !(language in SUPPORTED_LANGUAGES)) {
    return NextResponse.json(
      {
        error: "Invalid language. Supported: " + Object.keys(SUPPORTED_LANGUAGES).join(", "),
      },
      { status: 400 }
    );
  }

  await db
    .update(users)
    .set({
      languagePreference: language as LanguageCode,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return NextResponse.json(user);
}
