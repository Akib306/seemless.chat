import type { Message, MessagePart } from "@/types/db";
import type { AppUIMessage } from "@/types/ui";


export function mapDbPartsToUiParts(parts: MessagePart[]): AppUIMessage["parts"] {
    if (!parts || parts.length === 0) {
        return [] as AppUIMessage["parts"];
    }

    const mapped = parts
        .slice()
        .sort((a, b) => a.idx - b.idx)
        .flatMap((p) => {
            try {
                // text / reasoning
                if (p.type === "text" || p.type === "reasoning") {
                    if (p.text == null) {
                        console.warn("[message-mapper] missing text for part", { partId: p.id, type: p.type });
                        return [];
                    }
                    return [p.type === "reasoning" ? ({ type: "reasoning", text: p.text } as any) : ({ type: "text", text: p.text } as any)];
                }

                // file
                if (p.type === "file") {
                    if (!p.url || !p.media_type) {
                        console.error("[message-mapper] invalid file part (url/mediaType required)", { partId: p.id });
                        return [];
                    }
                    return [{ type: "file", mediaType: p.media_type, url: p.url, filename: p.filename ?? undefined } as any];
                }

                // data
                if (p.type === "data") {
                    if (!p.data_name) {
                        console.error("[message-mapper] invalid data part (data_name required)", { partId: p.id });
                        return [];
                    }
                    return [{ type: `data-${p.data_name}`, data: (p.data as unknown) } as any];
                }

                // tool
                if (p.type === "tool") {
                    if (!p.tool_name || !p.tool_call_id) {
                        console.error("[message-mapper] invalid tool part (tool_name and tool_call_id required)", { partId: p.id });
                        return [];
                    }
                    const type = `tool-${p.tool_name}` as const;

                    if (p.error_text != null) {
                        return [{ type, toolCallId: p.tool_call_id, state: "output-error", input: (p.tool_input ?? undefined) as any, errorText: p.error_text } as any];
                    }
                    if (p.tool_output != null) {
                        return [{ type, toolCallId: p.tool_call_id, state: "output-available", input: (p.tool_input as any) ?? undefined, output: p.tool_output as any } as any];
                    }
                    if (p.state === "input-available" && p.tool_input != null) {
                        return [{ type, toolCallId: p.tool_call_id, state: "input-available", input: p.tool_input as any } as any];
                    }
                    // default to input-streaming if no output/error
                    return [{ type, toolCallId: p.tool_call_id, state: "input-streaming", input: (p.tool_input as any) ?? undefined } as any];
                }

                console.warn("[message-mapper] unknown part type", { partId: p.id, type: p.type });
                return [];
            } catch (err) {
                console.error("[message-mapper] failed to map part", { partId: p.id, error: err });
                return [];
            }
        });

    return mapped as AppUIMessage["parts"];
}

export function convertToUIMessage(message: Message, parts: MessagePart[]): AppUIMessage {
    const uiMessage: AppUIMessage = {
        id: message.id,
        role: message.role as "system" | "user" | "assistant",
        parts: mapDbPartsToUiParts(parts),
        metadata: {
            chatId: message.chat_id,
            userId: message.user_id,
            createdAt: message.created_at,
            modelUsed: message.model_used ?? null,
            tokensUsed: message.tokens_used,
        },
    };

    return uiMessage;
}

export function convertManyToUIMessages(
    messages: Message[],
    partsByMessageId: Record<string, MessagePart[]>
): AppUIMessage[] {
    return messages.map((m) => convertToUIMessage(m, partsByMessageId[m.id] ?? []));
}