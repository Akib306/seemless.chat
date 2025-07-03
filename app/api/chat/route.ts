import { streamText} from "ai"
import { google } from "@ai-sdk/google"
import { openai } from '@ai-sdk/openai';
import { type Message } from "@ai-sdk/react";
// Set this to true to use debug responses instead of real AI calls

export async function POST(req: Request) {
    let { messages, model } = await req.json();

    // Define the system prompt with LaTeX instructions
    const systemPrompt = `You are a helpful AI assistant. All mathematical expressions and formulas must be rendered using LaTeX. For inline equations, enclose the expression in single dollar signs ($). Example: $E=mc^2$. For block-level or display equations, enclose the expression in double dollar signs ($$). Example: $$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$.`;

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
            system: systemPrompt,
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


