import { streamText } from "ai"
import { google } from "@ai-sdk/google"

interface Message {
    role: "user" | "assistant";
    content: string;
}

export async function POST(req: Request) {
    const { messages } = await req.json();

    try {
        const stream = await streamText({
            model: google("models/gemini-2.0-flash"),
            messages: messages.map(({ role, content }: Message) => ({
                role: role === "user" ? "user" : "assistant",
                content
            })),
        });

        return stream.toTextStreamResponse();
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