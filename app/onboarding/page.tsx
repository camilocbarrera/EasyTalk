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
import { MultiLanguageSelector } from "@/components/user/multi-language-selector";
import { type LanguageCode } from "@/lib/constants/languages";
import { Loader2, Globe2 } from "lucide-react";
import { toast } from "sonner";
import { useUserLanguages, useUpdateUserLanguages } from "@/lib/query/hooks/use-user";

export default function OnboardingPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [languages, setLanguages] = useState<LanguageCode[]>(["en"]);

  // TanStack Query hooks
  const { data: languagePrefs, isLoading: isLoadingLanguages } = useUserLanguages();
  const updateLanguages = useUpdateUserLanguages();

  // Sync local state with query data
  useEffect(() => {
    if (languagePrefs && languagePrefs.length > 0) {
      setLanguages(languagePrefs.map((p) => p.languageCode));
    }
  }, [languagePrefs]);

  const handleSubmit = async () => {
    try {
      await updateLanguages.mutateAsync(languages);
      toast.success("Language preferences saved!");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to save preferences. Please try again.");
    }
  };

  const isSyncing = !isLoaded || isLoadingLanguages;

  if (isSyncing) {
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
            Choose your preferred languages for chat translations. Select up to 3
            languages - your first choice will be your primary language.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <MultiLanguageSelector
            value={languages}
            onChange={setLanguages}
            disabled={updateLanguages.isPending}
          />
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={updateLanguages.isPending || languages.length === 0}
          >
            {updateLanguages.isPending ? (
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
