"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function JoinSessionForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      toast.error("Please enter a session code");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/join/${cleanCode}`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to join session");
      }

      const session = await res.json();
      toast.success(
        session.alreadyJoined ? "Rejoining session..." : "Joined session!"
      );
      router.push(`/session/${session.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to join session"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <label
          htmlFor="session-code"
          className="text-sm font-medium text-foreground"
        >
          Join a session
        </label>
        <p className="text-xs text-muted-foreground">
          Enter an 8-character session code
        </p>
      </div>
      <div className="flex gap-2">
        <Input
          id="session-code"
          placeholder="ABCD1234"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={8}
          className="flex-1 font-mono text-center tracking-[0.25em] uppercase"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading} className="shrink-0">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <ArrowRight className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-2">Join</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
