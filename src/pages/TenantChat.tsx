import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import TenantLayout from "@/components/dashboard/TenantLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface ChatMessage {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender_name?: string;
}

const TenantChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState("");
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("tenant_assignments")
      .select("property_id, properties(name)")
      .eq("tenant_id", user.id)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPropertyId(data.property_id);
          setPropertyName((data as any).properties?.name || "Community");
        }
      });
  }, [user]);

  useEffect(() => {
    if (!propertyId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("community_messages")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: true })
        .limit(200);

      if (data) {
        setMessages(data);
        // Fetch sender names
        const senderIds = [...new Set(data.map(m => m.sender_id))];
        if (senderIds.length > 0) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", senderIds);
          const map: Record<string, string> = {};
          (profs ?? []).forEach(p => { map[p.user_id] = p.full_name; });
          setProfiles(map);
        }
      }
    };

    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`chat-${propertyId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "community_messages",
        filter: `property_id=eq.${propertyId}`,
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        setMessages(prev => [...prev, newMsg]);
        // Fetch name if we don't have it
        if (!profiles[newMsg.sender_id]) {
          supabase.from("profiles").select("user_id, full_name").eq("user_id", newMsg.sender_id).maybeSingle()
            .then(({ data }) => {
              if (data) setProfiles(prev => ({ ...prev, [data.user_id]: data.full_name }));
            });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [propertyId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !propertyId || !user) return;
    setSending(true);
    await supabase.from("community_messages").insert({
      property_id: propertyId,
      sender_id: user.id,
      message: newMessage.trim(),
    });
    setNewMessage("");
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <TenantLayout>
      <div className="space-y-4 h-[calc(100vh-8rem)]">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary" />
            Community Chat
          </h1>
          <p className="text-muted-foreground">{propertyName} — Chat with your fellow tenants</p>
        </div>

        <Card className="flex-1 flex flex-col" style={{ height: "calc(100vh - 14rem)" }}>
          <ScrollArea className="flex-1 p-4" style={{ height: "calc(100% - 70px)" }}>
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"}`}>
                      {!isMe && (
                        <p className="text-xs font-semibold mb-0.5 opacity-70">
                          {profiles[msg.sender_id] || "Tenant"}
                        </p>
                      )}
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {format(new Date(msg.created_at), "hh:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-border flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
            />
            <Button onClick={handleSend} disabled={sending || !newMessage.trim()} className="gradient-primary shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </TenantLayout>
  );
};

export default TenantChat;
