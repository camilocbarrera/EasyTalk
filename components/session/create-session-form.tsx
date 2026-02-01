"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export function CreateSessionForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a session name");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create session");
      }

      const session = await res.json();
      toast.success("Session created!");
      router.push(`/session/${session.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create session"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <label
          htmlFor="session-name"
          className="text-sm font-medium text-foreground"
        >
          Create a session
        </label>
        <p className="text-xs text-muted-foreground">
          Start a new multilingual chat room
        </p>
      </div>
      <div className="flex gap-2">
        <Input
          id="session-name"
          placeholder="e.g., Team Standup"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading} className="shrink-0">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-2">Create</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
