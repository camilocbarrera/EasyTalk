"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LanguageSelector } from "@/components/user/language-selector";
import { type LanguageCode } from "@/lib/constants/languages";
import { Loader2, Globe2 } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);

  // Sync user to DB on mount
  useEffect(() => {
    if (isSignedIn) {
      fetch("/api/users/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.languagePreference) {
            setLanguage(data.languagePreference as LanguageCode);
          }
          setIsSyncing(false);
        })
        .catch(() => {
          setIsSyncing(false);
        });
    }
  }, [isSignedIn]);

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/users/me/language", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      });

      if (!res.ok) {
        throw new Error("Failed to save preference");
      }

      toast.success("Language preference saved!");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to save preference. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded || isSyncing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!isSignedIn) {
    router.push("/");
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Globe2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome, {user.firstName || "there"}!</CardTitle>
          <CardDescription>
            Choose your preferred language for chat translations. You can change
            this later in settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <LanguageSelector
            value={language}
            onChange={setLanguage}
            disabled={isLoading}
          />
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
