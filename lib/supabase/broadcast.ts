import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function broadcastTranslation(
  sessionId: string,
  messageId: string,
  language: string,
  content: string
) {
  // Use service role client for server-side broadcasting
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const roomName = `session:${sessionId}`;

  const channel = supabase.channel(roomName);

  await channel.subscribe();

  await channel.send({
    type: "broadcast",
    event: "translation",
    payload: { messageId, language, content },
  });

  // Clean up the channel after sending
  await supabase.removeChannel(channel);
}
