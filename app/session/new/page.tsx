"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { CreateSessionForm } from "@/components/session/create-session-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewSessionPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 pt-20">
      <div className="max-w-md mx-auto space-y-6">
        <Button variant="ghost" asChild className="-ml-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>

        <CreateSessionForm />
      </div>
    </div>
  );
}
