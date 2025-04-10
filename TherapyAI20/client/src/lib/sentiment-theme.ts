import { z } from "zod";

// Theme schema matching theme.json
export const themeSchema = z.object({
  variant: z.enum(["professional", "tint", "vibrant"]),
  primary: z.string(),
  appearance: z.enum(["light", "dark", "system"]),
  radius: z.number(),
});

export type Theme = z.infer<typeof themeSchema>;

// Mood-based theme configurations
const moodThemes: Record<string, Theme> = {
  positive: {
    variant: "vibrant",
    primary: "hsl(150, 60%, 45%)", // Calming green
    appearance: "light",
    radius: 0.75,
  },
  neutral: {
    variant: "professional",
    primary: "hsl(206, 36%, 45%)", // Default blue
    appearance: "system",
    radius: 0.5,
  },
  negative: {
    variant: "tint",
    primary: "hsl(271, 49%, 45%)", // Supportive purple
    appearance: "system",
    radius: 0.5,
  },
};

// Enhanced sentiment analysis function with more emotion keywords
export function analyzeSentiment(text: string): "positive" | "neutral" | "negative" {
  const positiveWords = new Set([
    "happy", "joy", "excited", "great", "better", "good", "wonderful", "peaceful",
    "calm", "relieved", "hopeful", "confident", "grateful", "thankful", "love",
    "excellent", "fantastic", "amazing", "awesome", "delighted", "pleased",
    "proud", "comfortable", "satisfied", "optimistic"
  ]);

  const negativeWords = new Set([
    "sad", "angry", "anxious", "worried", "stressed", "depressed", "overwhelmed",
    "frustrated", "afraid", "scared", "unhappy", "terrible", "awful", "hopeless",
    "hurt", "lonely", "miserable", "upset", "disappointed", "confused", "lost",
    "troubled", "concerned", "exhausted", "tired", "pain", "struggle"
  ]);

  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach(word => {
    if (positiveWords.has(word)) positiveCount++;
    if (negativeWords.has(word)) negativeCount++;
  });

  if (positiveCount > negativeCount) return "positive";
  if (negativeCount > positiveCount) return "negative";
  return "neutral";
}

export function getMoodTheme(mood: "positive" | "neutral" | "negative"): Theme {
  return moodThemes[mood];
}