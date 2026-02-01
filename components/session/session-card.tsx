"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const isExpired = session.expiresAt ? new Date(session.expiresAt) < new Date() : false;

  return (
    <Card className={isExpired ? "opacity-60" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{session.name}</CardTitle>
            <CardDescription className="font-mono text-xs">
              Code: {session.code}
            </CardDescription>
          </div>
          {isExpired && <Badge variant="destructive">Expired</Badge>}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div className="flex -space-x-2">
            {session.participants.slice(0, 5).map(({ user }) => (
              <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={user.imageUrl || undefined} />
                <AvatarFallback className="text-[10px]">
                  {user.firstName?.[0] || user.username?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
            ))}
            {session.participants.length > 5 && (
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-background">
                +{session.participants.length - 5}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {session.participants.length} participant
            {session.participants.length !== 1 ? "s" : ""}
          </span>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        {onShare && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onShare(session)}
            disabled={isExpired}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        )}
        <Button asChild size="sm" className="flex-1" disabled={isExpired}>
          <Link href={`/session/${session.id}`}>
            Enter Chat
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
