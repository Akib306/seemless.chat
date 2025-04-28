import { streamText } from "ai"
import { google } from "@ai-sdk/google"
import { openai } from '@ai-sdk/openai';

interface Message {
    role: "user" | "assistant";
    content: string;
}

export async function POST(req: Request) {
    const { messages, model } = await req.json();
    try {
        let modelProvider;

        switch (model) {
            case "gemini-2.0-flash":
                modelProvider = google("models/gemini-2.0-flash");
                break;
            case "gemini-1.5-flash":
                modelProvider = google("models/gemini-1.5-flash");
                break;
            case "gemini-1.5-pro":
                modelProvider = google("models/gemini-1.5-pro");
                break;
            case "gpt-4.1-nano":
                modelProvider = openai("gpt-4.1-nano");
                break;
            default:
                modelProvider = google("models/gemini-2.0-flash")
        }

        const stream = await streamText({
            model: modelProvider,
            messages: messages.map(({ role, content }: Message) => ({
                role: role === "user" ? "user" : "assistant",
                content
            })),
        });

        return stream.toDataStreamResponse();
    } catch (error) {
        console.error('Error processing chat request:', error);
        return new Response(JSON.stringify({ 
            message: "An error occurred while processing your request." 
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}