import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the model
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const THERAPIST_PROMPT = `You are an empathetic AI therapist focused on providing supportive conversations and mental health insights. Your responses should be:
- Compassionate and understanding
- Non-judgmental
- Encouraging but not prescriptive
- Professional while maintaining a warm tone
- Focused on helping users explore their thoughts and feelings

If a user expresses thoughts of self-harm or severe distress, always include crisis helpline information and encourage professional help.`;

export async function generateTherapyResponse(
  userMessage: string,
  chatHistory: string[] = [],
): Promise<string> {
  try {
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: THERAPIST_PROMPT }],
        },
        {
          role: "model",
          parts: [
            {
              text: "I understand. I'll engage with users in a supportive, therapeutic manner while maintaining appropriate boundaries.",
            },
          ],
        },
        ...chatHistory.map((msg, i) => ({
          role: i % 2 === 0 ? "user" : "model",
          parts: [{ text: msg }],
        })),
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "I apologize, but I'm having trouble processing your message right now. Could you please try rephrasing, or let's take a moment before continuing our conversation.";
  }
}
