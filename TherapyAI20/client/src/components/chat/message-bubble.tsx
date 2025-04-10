import { Message } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function MessageBubble({ message }: { message: Message }) {
  return (
    <div
      className={cn(
        "max-w-[80%] rounded-lg p-4",
        message.isAi
          ? "bg-secondary text-secondary-foreground ml-4"
          : "bg-primary text-primary-foreground ml-auto mr-4"
      )}
    >
      {message.content}
    </div>
  );
}
