import { streamText } from "ai"
import { google } from "@ai-sdk/google"
import { openai } from '@ai-sdk/openai';
import { createDebugStream, DEBUG_MODE } from "@/utils/debug-chat";
import { type Message } from "@ai-sdk/react";

// Set this to true to use debug responses instead of real AI calls

export async function POST(req: Request) {
    const { messages, model } = await req.json();

    // If debug mode is active, return a placeholder response
    if (DEBUG_MODE) {
        return createDebugStream(messages);
    }

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
            onFinish: ({ usage }) => {
                const { promptTokens, completionTokens, totalTokens } = usage;
                // for saving the chat history or recording usage
                console.log('Prompt tokens:', promptTokens);
                console.log('Completion tokens:', completionTokens);
                console.log('Total tokens:', totalTokens);
            }
        });
        console.log(stream.usage);
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