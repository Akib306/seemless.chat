import { type Message } from "@ai-sdk/react";

// utils/debug-chat.ts
export const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_MODE === "true";

const debugResponses = [
	"I'm a debug response. This is a placeholder message that would normally come from the AI model.",
	"Debug mode is active. This response is not using any AI model to save costs.",
	"This is a simulated response. In production, this would be a real AI-generated message.",
	"Debug placeholder: The actual AI model is not being called right now.",
	"Test response: This message is generated locally without using any AI services.",
];

export async function* debugStream(messages: Message[]) {
	const randomResponse =
		debugResponses[Math.floor(Math.random() * debugResponses.length)];
	const words = randomResponse.split(" ");

	for (const word of words) {
		// Simulate network delay
		await new Promise((resolve) => setTimeout(resolve, 50));
		yield word + " ";
	}
}

export function createDebugStream(messages: Message[]) {
	const encoder = new TextEncoder();
	const stream = new ReadableStream({
		async start(controller) {
			try {
				for await (const chunk of debugStream(messages)) {
					controller.enqueue(encoder.encode(chunk));
				}
				controller.close();
			} catch (error) {
				controller.error(error);
			}
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
}

export async function handleDebugSubmit(
	input: string,
	messages: Message[],
	setMessages: (messages: Message[]) => void,
	setInput: (input: string) => void,
) {
	if (!input.trim()) return;

	// Add user message immediately
	const userMessage: Message = {
		role: "user",
		content: input,
		id: Date.now().toString(),
	};
	setMessages([...messages, userMessage]);
	setInput("");

	// Simulate AI response
	const response = await createDebugStream([...messages, userMessage]);
	const reader = response.body?.getReader();
	if (!reader) return;

	let aiMessage = "";
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		const text = new TextDecoder().decode(value);
		aiMessage += text;
		const assistantMessage: Message = {
			role: "assistant",
			content: aiMessage,
			id: (Date.now() + 1).toString(),
		};
		setMessages([...messages, userMessage, assistantMessage]);
	}
}
