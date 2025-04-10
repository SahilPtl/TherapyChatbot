import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatSession, Message } from "@shared/schema";
import { useState } from "react";
import { Loader2, Archive, Search, Edit2, Check, BarChart2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ChatInterface from "@/components/chat/chat-interface";
import SessionReport from "@/components/reports/session-report";
import { useToast } from "@/hooks/use-toast";

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSession, setEditingSession] = useState<number | null>(null);
  const [newSessionName, setNewSessionName] = useState("");
  const [showReport, setShowReport] = useState(false);

  const { data: sessions, isLoading: sessionsLoading } = useQuery<ChatSession[]>({
    queryKey: ["/api/sessions"],
  });

  const createSessionMutation = useMutation({
    mutationFn: async (content: string) => {
      const sessionName = content.split(' ').slice(0, 5).join(' ') + (content.split(' ').length > 5 ? '...' : '');

      const sessionRes = await apiRequest("POST", "/api/sessions", { 
        name: sessionName
      });
      const session = await sessionRes.json();

      const messageRes = await apiRequest(
        "POST",
        `/api/sessions/${session.id}/messages`,
        { content }
      );
      await messageRes.json();

      return session;
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/sessions/${session.id}/messages`]
      });
      setSelectedSession(session.id);
      setNewMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create conversation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const renameSessionMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      await apiRequest("PATCH", `/api/sessions/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      setEditingSession(null);
      setNewSessionName("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to rename session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const archiveSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      await apiRequest("POST", `/api/sessions/${sessionId}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      setSelectedSession(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to archive session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (sessionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const filteredSessions = sessions?.filter(session => 
    session.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-sidebar p-4 flex flex-col">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredSessions?.map((session) => (
            <div
              key={session.id}
              className={`p-2 rounded flex justify-between items-center cursor-pointer ${
                selectedSession === session.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50"
              }`}
              onClick={() => setSelectedSession(session.id)}
            >
              {editingSession === session.id ? (
                <form
                  className="flex-1 flex gap-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newSessionName.trim()) {
                      renameSessionMutation.mutate({
                        id: session.id,
                        name: newSessionName,
                      });
                    }
                  }}
                >
                  <Input
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    type="submit"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <>
                  <span className="truncate">{session.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSession(session.id);
                        setNewSessionName(session.name);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveSessionMutation.mutate(session.id);
                      }}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedSession ? (
          <>
            <div className="border-b p-2 flex justify-between items-center">
              <h2 className="font-medium">
                {sessions?.find(s => s.id === selectedSession)?.name}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReport(!showReport)}
              >
                <BarChart2 className="h-4 w-4 mr-2" />
                {showReport ? "Show Chat" : "Show Report"}
              </Button>
            </div>
            {showReport ? (
              <SessionReport sessionId={selectedSession} />
            ) : (
              <ChatInterface sessionId={selectedSession} />
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center px-4 -mt-32">
            <div className="w-full max-w-2xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newMessage.trim()) {
                    createSessionMutation.mutate(newMessage);
                  }
                }}
                className="space-y-4"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Send a message to start a new conversation..."
                  className="text-lg py-6 shadow-sm"
                  disabled={createSessionMutation.isPending}
                />
                <p className="text-sm text-muted-foreground text-center">
                  Press Enter to start the conversation
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}