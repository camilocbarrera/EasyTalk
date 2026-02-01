"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, Share2 } from "lucide-react";
import Link from "next/link";
import type { Session, User, SessionParticipant } from "@/lib/db/schema";

interface SessionWithRelations extends Session {
  creator: User;
  participants: (SessionParticipant & { user: User })[];
}

interface SessionCardProps {
  session: SessionWithRelations;
  onShare?: (session: SessionWithRelations) => void;
}

export function SessionCard({ session, onShare }: SessionCardProps) {
  const isExpired = session.expiresAt
    ? new Date(session.expiresAt) < new Date()
    : false;

  return (
    <div
      className={`group relative flex flex-col rounded-lg border bg-card p-4 transition-colors hover:border-foreground/20 ${
        isExpired ? "opacity-50" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground truncate">
            {session.name}
          </h3>
          <p className="font-mono text-xs text-muted-foreground mt-0.5 tracking-wider">
            {session.code}
          </p>
        </div>
        {isExpired && (
          <Badge variant="outline" className="shrink-0 text-xs">
            Expired
          </Badge>
        )}
      </div>

      {/* Participants */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex -space-x-1.5">
          {session.participants.slice(0, 4).map(({ user }) => (
            <Avatar
              key={user.id}
              className="size-6 border-2 border-card ring-0"
            >
              <AvatarImage src={user.imageUrl || undefined} />
              <AvatarFallback className="text-[10px] bg-muted">
                {user.firstName?.[0] || user.username?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
          ))}
          {session.participants.length > 4 && (
            <div className="size-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium border-2 border-card">
              +{session.participants.length - 4}
            </div>
          )}
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Users className="size-3" />
          {session.participants.length}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border">
        {onShare && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onShare(session)}
            disabled={isExpired}
            className="text-muted-foreground hover:text-foreground"
          >
            <Share2 className="size-4" />
          </Button>
        )}
        <Button
          asChild
          size="sm"
          variant="ghost"
          className="flex-1 justify-between text-muted-foreground hover:text-foreground"
          disabled={isExpired}
        >
          <Link href={`/session/${session.id}`}>
            <span>Enter</span>
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
