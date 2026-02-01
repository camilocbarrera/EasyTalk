"use client";

import { useUser, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { CreateSessionForm } from "@/components/session/create-session-form";
import { JoinSessionForm } from "@/components/session/join-session-form";
import { PixelGlobe } from "@/components/ui/pixel-globe";
import { ArrowRight, Globe, Zap, Users } from "lucide-react";
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
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-background pointer-events-none" />

        {/* Pixel Globe - Hero Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative opacity-30">
            <PixelGlobe density={60} animated size={800} />
          </div>
        </div>

        {/* Radial gradient overlay for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_70%)] pointer-events-none" />

        {/* Main content */}
        <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/80 backdrop-blur-sm border border-border/50 text-sm text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Real-time translation powered by AI
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground">
                Speak Your Language.
                <br />
                <span className="text-muted-foreground">Connect with Everyone.</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Real-time chat that automatically translates every message.
                Everyone speaks their native language, everyone understands.
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <SignInButton mode="modal">
                <Button
                  size="lg"
                  className="h-12 px-8 text-base font-medium tracking-wide shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </SignInButton>
              <span className="text-sm text-muted-foreground">
                No credit card required
              </span>
            </div>
          </div>

          {/* Feature cards */}
          <div className="mt-20 w-full max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="group p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-border hover:bg-card/80 transition-all">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Instant</h3>
                <p className="text-sm text-muted-foreground">
                  Messages translate in real-time as you type
                </p>
              </div>

              <div className="group p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-border hover:bg-card/80 transition-all">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Globe className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">12+ Languages</h3>
                <p className="text-sm text-muted-foreground">
                  Support for major world languages
                </p>
              </div>

              <div className="group p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-border hover:bg-card/80 transition-all">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Simple Sharing</h3>
                <p className="text-sm text-muted-foreground">
                  Share a code and start talking instantly
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    );
  }

  // Signed in - show create/join options
  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background pointer-events-none" />

      {/* Pixel Globe - subtle background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative opacity-10">
          <PixelGlobe density={40} animated size={600} />
        </div>
      </div>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Start Talking
            </h1>
            <p className="text-muted-foreground">
              Create a new session or join an existing one
            </p>
          </div>

          {/* Forms */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50">
              <CreateSessionForm />
            </div>

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

            <div className="p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50">
              <JoinSessionForm />
            </div>
          </div>

          {/* Dashboard link */}
          <div className="text-center">
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
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
