"use client";

import { useUser, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { CreateSessionForm } from "@/components/session/create-session-form";
import { JoinSessionForm } from "@/components/session/join-session-form";
import { ArrowRight, Globe2, MessageSquare, Users } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        {/* Hero Section */}
        <main className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="max-w-3xl text-center space-y-6">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Globe2 className="h-12 w-12" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
              Chat Without
              <br />
              Language Barriers
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              EasyTalk automatically translates messages in real-time, so everyone
              can chat in their native language.
            </p>
            <SignInButton mode="modal">
              <Button size="lg" className="rounded-full">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </SignInButton>
          </div>

          {/* Features */}
          <div className="mt-16 grid gap-8 sm:grid-cols-3 max-w-4xl">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                Real-time Chat
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Instant messaging with live presence indicators
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Globe2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                12+ Languages
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Auto-translate to your preferred language
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                Easy Sharing
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Share a simple code to invite anyone
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Signed in - show create/join options
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Welcome to EasyTalk
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Create a new session or join an existing one
            </p>
          </div>

          <CreateSessionForm />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-50 dark:bg-black px-2 text-zinc-500">
                Or
              </span>
            </div>
          </div>

          <JoinSessionForm />

          <div className="text-center">
            <Button variant="link" asChild>
              <Link href="/dashboard">View my sessions</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
