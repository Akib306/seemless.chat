import { updateChatTitle } from "@/lib/db/chats";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

async function generateTitle(message: string): Promise<string> {
  try {
    const result = await generateText({
      model: google("models/gemini-1.5-flash"), // Cheap and fast
      prompt: `Generate a concise, descriptive title (max 4-5 words) for a chat that starts with this user message: "${message}"

      Guidelines:
      - Be specific and descriptive
      - Avoid generic words like "chat", "conversation", "help"
      - Focus on the main topic or question
      - Avoid using any punctuation
      - Keep under 30 characters total
      - Examples: "React Auth Setup", "Database Design", "Python Debug"

      Title:`,
      maxTokens: 15, // Reduced for shorter titles
    });

    // Clean up the response and ensure it's not too long
    const title = result.text.trim().replace(/^["']|["']$/g, ''); // Remove quotes if any
    return title.length > 30 ? title.substring(0, 27) + "..." : title;
    
  } catch (error) {
    console.error('Title generation failed:', error);
    return "New Chat"; // Fallback to default
  }
}

export async function POST(req: Request) {
  const { message, chatId } = await req.json();

  const title = await generateTitle(message);

  await updateChatTitle(chatId, title);
  
  return Response.json({ title });
}