import { streamText } from "ai"
import { google } from "@ai-sdk/google"


export async function POST(req: Request) {
    const body = await req.json();

    const stream = await streamText({
        model: google("models/gemini-2.0-flash"),
        messages: [
            {
                role: "user",
                content: body,
            },
        ],
    });

    return stream.toTextStreamResponse();
}