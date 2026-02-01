"use client";

import { useUser, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { CreateSessionForm } from "@/components/session/create-session-form";
import { JoinSessionForm } from "@/components/session/join-session-form";
import { PixelGlobe } from "@/components/ui/pixel-globe";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="size-2 bg-foreground animate-pulse"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="relative flex min-h-screen flex-col bg-background overflow-hidden">
        {/* Pixel Globe - positioned asymmetrically */}
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 opacity-90 pointer-events-none select-none sm:right-0 lg:right-[5%]">
          <PixelGlobe density={50} animated />
        </div>

        {/* Main content - anchored left */}
        <main className="relative z-10 flex flex-1 flex-col justify-end px-6 pb-16 sm:px-12 lg:px-20 lg:pb-24">
          {/* Features - subtle, top section */}
          <div className="mb-auto pt-24 sm:pt-32">
            <div className="flex flex-wrap gap-8 text-sm text-muted-foreground max-w-md">
              <div className="space-y-1">
                <div className="font-mono text-xs uppercase tracking-wider text-foreground/60">
                  01
                </div>
                <div className="font-medium text-foreground">Real-time</div>
                <div className="text-xs">Instant translation</div>
              </div>
              <div className="space-y-1">
                <div className="font-mono text-xs uppercase tracking-wider text-foreground/60">
                  02
                </div>
                <div className="font-medium text-foreground">12+ Languages</div>
                <div className="text-xs">Native support</div>
              </div>
              <div className="space-y-1">
                <div className="font-mono text-xs uppercase tracking-wider text-foreground/60">
                  03
                </div>
                <div className="font-medium text-foreground">Simple</div>
                <div className="text-xs">Share a code</div>
              </div>
            </div>
          </div>

          {/* Tagline and title */}
          <div className="max-w-xl space-y-6">
            <p className="text-sm font-medium tracking-wide text-muted-foreground">
              Communication Without Boundaries
            </p>
            <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              EasyTalk
            </h1>
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              Real-time chat that automatically translates every message.
              Everyone speaks their native language.
            </p>

            <div className="flex items-center gap-4 pt-4">
              <SignInButton mode="modal">
                <Button
                  size="lg"
                  className="h-12 px-8 text-base font-medium tracking-wide"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </SignInButton>
              <span className="text-xs text-muted-foreground">
                Free to use
              </span>
            </div>
          </div>
        </main>

        {/* Bottom decorative line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-border via-border/50 to-transparent" />
      </div>
    );
  }

  // Signed in - show create/join options
  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Start Talking
            </h1>
            <p className="text-muted-foreground">
              Create a new session or join an existing one
            </p>
          </div>

          {/* Forms */}
          <div className="space-y-6">
            <CreateSessionForm />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-xs uppercase tracking-wider text-muted-foreground">
                  or join
                </span>
              </div>
            </div>

            <JoinSessionForm />
          </div>

          {/* Dashboard link */}
          <div className="pt-4 text-center">
            <Button variant="ghost" asChild className="text-muted-foreground">
              <Link href="/dashboard">
                View my sessions
                <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
