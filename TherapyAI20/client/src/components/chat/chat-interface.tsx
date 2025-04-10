import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Message } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Sun, Cloud, CloudRain } from "lucide-react";
import MessageBubble from "./message-bubble";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { analyzeSentiment, getMoodTheme } from "@/lib/sentiment-theme";

export default function ChatInterface({ sessionId }: { sessionId: number }) {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [message, setMessage] = useState("");
  const [currentMood, setCurrentMood] = useState<"positive" | "neutral" | "negative">("neutral");

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: [`/api/sessions/${sessionId}/messages`],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Analyze sentiment and update theme
      const mood = analyzeSentiment(content);
      setCurrentMood(mood);
      const newTheme = getMoodTheme(mood);
      console.log("Detected mood:", mood); // Add logging
      setTheme(newTheme);

      const res = await apiRequest(
        "POST",
        `/api/sessions/${sessionId}/messages`,
        { content }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/sessions/${sessionId}/messages`],
      });
      setMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const MoodIcon = {
    positive: Sun,
    neutral: Cloud,
    negative: CloudRain
  }[currentMood];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (message.trim()) {
              sendMessageMutation.mutate(message);
            }
          }}
          className="flex gap-2"
        >
          <div className="flex items-center mr-2">
            <MoodIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={sendMessageMutation.isPending}
          />
          <Button
            type="submit"
            disabled={sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}