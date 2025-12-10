import { convertToModelMessages, streamText } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";



export async function POST(req: Request) {
	let { messages, model } = await req.json();

	// Default to GPT 4.1 Nano if no model specified (Gemini quota often exceeded)
	if (!model) {
		model = "gpt-4.1-nano";
	}
	
	console.log("Model:", model);
	console.log("First message:", messages[0]);

	// Define the system prompt with LaTeX instructions
	const systemPrompt = `You are a helpful AI assistant. Follow these formatting rules for mathematical content:

    **LaTeX Math (use $ or $$):**
    - Complex equations and formulas: $E=mc^2$, $$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$
    - Mathematical expressions with fractions, integrals, summations, etc.
    - Greek letters and mathematical symbols in equations

    **Plain Text/HTML (do NOT use LaTeX):**
    - **Time/Space Complexity:** Use HTML superscript tags. Examples:
      - O(n<sup>2</sup>) NOT $O(n^2)$
      - O(log n) NOT $O(\log n)$
      - O(n<sup>3</sup>) NOT $O(n^3)$
    - **Algorithm Analysis:** Keep complexity notation as plain text with HTML tags
    - **Currency:** Write dollar amounts as plain text: "The total cost is $500."
    - **Simple mathematical notation:** Basic expressions like x^2, n^3 can use HTML <sup> tags

    **Key Rule:** Only use LaTeX ($...$) for complex mathematical formulas that require special symbols, fractions, or advanced notation. For algorithm complexity and simple expressions, use plain text with HTML tags.`;

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
			modelProvider = openai("gpt-4.1-nano-2025-04-14");
			break;
			default:
				// Default to GPT 4.1 Nano to avoid Gemini quota issues
				modelProvider = openai("gpt-4.1-nano-2025-04-14");
		}

		const stream = await streamText({
			model: modelProvider,
			system: systemPrompt,
			messages: convertToModelMessages(messages),
			onFinish: ({ usage }) => {
				// for saving the chat history or recording usage
				console.log();
				console.log(usage);
				console.log();
			},
		});
		return stream.toUIMessageStreamResponse();
	} catch (error) {
		console.error("Error processing chat request:", error);
		return new Response(
			JSON.stringify({
				message: "An error occurred while processing your request.",
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	}
}
