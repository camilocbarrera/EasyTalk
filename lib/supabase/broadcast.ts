import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!;
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

// Single channel per session, created lazily
const channelCache = new Map<string, ReturnType<SupabaseClient["channel"]>>();
const pendingSubscriptions = new Map<string, Promise<ReturnType<SupabaseClient["channel"]>>>();

async function getChannel(sessionId: string) {
  const roomName = `session:${sessionId}`;

  // Return cached channel
  if (channelCache.has(roomName)) {
    return channelCache.get(roomName)!;
  }

  // Wait for pending subscription
  if (pendingSubscriptions.has(roomName)) {
    return pendingSubscriptions.get(roomName)!;
  }

  // Create new channel
  const subscriptionPromise = (async () => {
    const channel = getSupabase().channel(roomName);

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Subscription timeout")), 10000);
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(timeout);
          resolve();
        } else if (status === "CHANNEL_ERROR") {
          clearTimeout(timeout);
          reject(new Error("Channel error"));
        }
      });
    });

    channelCache.set(roomName, channel);
    pendingSubscriptions.delete(roomName);
    return channel;
  })();

  pendingSubscriptions.set(roomName, subscriptionPromise);

  try {
    return await subscriptionPromise;
  } catch (error) {
    pendingSubscriptions.delete(roomName);
    throw error;
  }
}

export async function broadcastTranslation(
  sessionId: string,
  messageId: string,
  language: string,
  content: string
) {
  try {
    const channel = await getChannel(sessionId);
    await channel.send({
      type: "broadcast",
      event: "translation",
      payload: { messageId, language, content },
    });
  } catch (error) {
    console.error("Broadcast failed:", error);
  }
}
