import { useQuery } from "@tanstack/react-query";
import { ChatSession, Message } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Loader2, TrendingUp, Heart, Brain, Sparkles, ClipboardList } from "lucide-react";

interface MessageStats {
  date: string;
  count: number;
}

interface SessionReportProps {
  sessionId: number;
}

export default function SessionReport({ sessionId }: SessionReportProps) {
  const { data: session, isLoading: sessionLoading } = useQuery<ChatSession>({
    queryKey: [`/api/sessions/${sessionId}`],
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/sessions/${sessionId}/messages`],
  });

  if (sessionLoading || messagesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session || !messages) {
    return null;
  }

  // Calculate message statistics
  const totalMessages = messages.length;
  const userMessages = messages.filter(m => !m.isAi);
  const aiMessages = messages.filter(m => m.isAi);
  const responseRate = (aiMessages.length / userMessages.length * 100).toFixed(1);

  // Calculate average message length and consistency
  const userMessageLengths = userMessages.map(m => m.content.length);
  const averageLength = Math.round(userMessageLengths.reduce((a, b) => a + b, 0) / userMessageLengths.length);
  const messageLengthVariance = Math.round(
    userMessageLengths.reduce((acc, len) => acc + Math.pow(len - averageLength, 2), 0) / userMessageLengths.length
  );
  const expressionConsistency = Math.min(100, Math.max(0, 100 - (messageLengthVariance / 1000)));

  // Calculate session duration and frequency
  const sessionStart = new Date(session.createdAt!);
  const lastMessage = new Date(messages[messages.length - 1].createdAt!);
  const sessionDurationHours = Math.round((lastMessage.getTime() - sessionStart.getTime()) / (1000 * 60 * 60));

  // Therapeutic engagement score (0-100)
  const engagementScore = Math.min(100, Math.round(
    (expressionConsistency * 0.4) + // Consistent expression is important
    (Math.min(totalMessages, 20) * 2.5) + // Regular participation up to 20 messages
    (Number(responseRate) * 0.3) // Healthy back-and-forth
  ));

  // Message timeline data
  const messagesByDate = messages.reduce((acc: { [key: string]: number }, msg) => {
    const date = format(new Date(msg.createdAt!), 'MM/dd');
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const chartData: MessageStats[] = Object.entries(messagesByDate).map(([date, count]) => ({
    date,
    count,
  }));

  // Prepare chronological emotional summary for clinical review
  const userMessagesSummary = userMessages.map(msg => ({
    timestamp: new Date(msg.createdAt!),
    content: msg.content,
  })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Analysis functions
  const getExpressionInsight = () => {
    if (averageLength > 100) {
      return "You tend to express yourself in detail, which can be helpful for processing complex emotions and thoughts.";
    } else if (averageLength > 50) {
      return "Your responses show a good balance of reflection and conciseness.";
    }
    return "Your responses are brief and focused. Consider elaborating more to explore your thoughts deeply.";
  };

  const getEngagementInsight = () => {
    if (engagementScore >= 80) {
      return "You're showing strong commitment to self-reflection and growth through consistent, meaningful dialogue.";
    } else if (engagementScore >= 60) {
      return "You're maintaining a steady therapeutic rhythm. Regular engagement helps build lasting insights.";
    }
    return "You're taking initial steps in your therapeutic journey. Remember, progress comes with regular reflection.";
  };

  const getProgressIndicator = () => {
    if (totalMessages < 5) return "Initial Exploration";
    if (totalMessages < 15) return "Building Rapport";
    if (totalMessages < 30) return "Active Engagement";
    return "Deep Exploration";
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Therapeutic Journey Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">{getProgressIndicator()}</h3>
              <p className="text-sm text-muted-foreground">
                Session started {format(sessionStart, 'MMMM d, yyyy')}
                {sessionDurationHours > 0 && ` • ${sessionDurationHours} hours of reflection`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Clinical Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Session Overview</h4>
                <p className="text-sm text-muted-foreground">
                  Patient engaged in {totalMessages} exchanges over {sessionDurationHours} hours, 
                  demonstrating {engagementScore >= 70 ? "consistent" : "variable"} participation 
                  with {Math.round(expressionConsistency)}% expression consistency.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Chronological Response Analysis</h4>
                <div className="space-y-2">
                  {userMessagesSummary.map((msg, index) => (
                    <div key={index} className="text-sm border-l-2 border-muted pl-4 py-2">
                      <p className="text-muted-foreground mb-1">
                        {format(msg.timestamp, 'MMM d, yyyy HH:mm')}
                      </p>
                      <p className="line-clamp-2">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Communication Pattern Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Average response length: {averageLength} characters
                  <br />
                  Response consistency: {Math.round(expressionConsistency)}%
                  <br />
                  Dialogue engagement rate: {responseRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Engagement & Expression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{totalMessages}</p>
                <p className="text-sm text-muted-foreground">Reflective Exchanges</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{Math.round(expressionConsistency)}</p>
                <p className="text-sm text-muted-foreground">Expression Consistency</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{engagementScore}</p>
                <p className="text-sm text-muted-foreground">Therapeutic Engagement</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{responseRate}%</p>
                <p className="text-sm text-muted-foreground">Dialogue Balance</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Engagement Pattern</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis 
                      dataKey="date"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Therapeutic Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Expression Style</h4>
                <p className="text-sm text-muted-foreground">
                  {getExpressionInsight()}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Engagement Pattern</h4>
                <p className="text-sm text-muted-foreground">
                  {getEngagementInsight()}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Growth Opportunities
                </h4>
                <p className="text-sm text-muted-foreground">
                  {engagementScore < 70 
                    ? "Consider setting aside regular time for reflection and self-expression. Consistency in therapy leads to deeper insights."
                    : "You're maintaining a meaningful therapeutic dialogue. Continue exploring your thoughts and feelings with this level of dedication."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}