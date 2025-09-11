import type { Message, MessagePart, MessagePartInsert } from "@/types/db";
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


export function mapUiPartsToDbParts(
    parts: AppUIMessage["parts"],
): Array<Omit<MessagePartInsert, "message_id">> {
    if (!parts || parts.length === 0) return [];

    const rows: Array<Omit<MessagePartInsert, "message_id">> = [];

    for (let i = 0; i < parts.length; i += 1) {
        const part = parts[i] as any;

        // text / reasoning
        if (part.type === "text" || part.type === "reasoning") {
            if (typeof part.text === "string") {
                rows.push({ idx: i, type: part.type, text: part.text });
            }
            continue;
        }

        // file (images and other files are represented as file with mediaType)
        if (part.type === "file") {
            rows.push({
                idx: i,
                type: "file",
                url: part.url ?? null,
                media_type: part.mediaType ?? null,
                filename: part.filename ?? null,
            });
            continue;
        }

        // data-* -> type: data + data_name
        if (typeof part.type === "string" && part.type.startsWith("data-")) {
            const dataName = part.type.slice("data-".length);
            rows.push({
                idx: i,
                type: "data",
                data_name: dataName,
                data: (part.data as any) ?? null,
            });
            continue;
        }

        // tool-* -> type: tool + tool_name
        if (typeof part.type === "string" && part.type.startsWith("tool-")) {
            const toolName = part.type.slice("tool-".length);
            rows.push({
                idx: i,
                type: "tool",
                tool_name: toolName,
                tool_call_id: part.toolCallId ?? null,
                state: part.state ?? null,
                tool_input: part.input ?? null,
                tool_output: part.output ?? null,
                error_text: part.errorText ?? null,
            });
            continue;
        }

        // Unknown part types are ignored to avoid DB errors, but log for awareness
        try {
            // eslint-disable-next-line no-console
            console.warn("[message-mapper] skipping unknown UI part type", part?.type);
        } catch {}
    }

    return rows;
}