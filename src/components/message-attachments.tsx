"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { File as FileIcon, FileText, FileVideo, FileAudio } from "lucide-react";

type AttachmentRecord = {
  id: string;
  message_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  created_at: string;
};

type MessageAttachmentsProps = {
  messageId: string;
  chatId: string;
  content: string;
  isUser: boolean;
};

type PreviewState = {
  id: string;
  url: string;
  mimeType: string;
  name: string;
} | null;

/**
 * Renders persisted attachments for a given message. Fetches once and
 * subscribes to realtime inserts so thumbnails appear as soon as uploads finalize.
 */
export function MessageAttachments({ messageId, chatId, content, isUser }: MessageAttachmentsProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [attachments, setAttachments] = useState<AttachmentRecord[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<PreviewState>(null);
  const [resolvedMessageId, setResolvedMessageId] = useState<string>(messageId);

  const loadAttachments = useCallback(async (targetMessageId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("attachments")
      .select(
        "id, message_id, storage_path, file_name, mime_type, file_size, created_at",
      )
      .eq("message_id", targetMessageId)
      .order("created_at", { ascending: true });
    if (error || !data) {
      setLoading(false);
      return;
    }
    setAttachments(data as AttachmentRecord[]);
    setLoading(false);
    const entries = await Promise.all(
      (data as AttachmentRecord[]).map(async (a) => {
        const { data: urlData } = await supabase.storage
          .from("chat_attachments")
          .createSignedUrl(a.storage_path, 60 * 60);
        return [a.id, urlData?.signedUrl ?? ""] as const;
      }),
    );
    setSignedUrls((prev) => {
      const next = { ...prev } as Record<string, string>;
      for (const [id, url] of entries) next[id] = url;
      return next;
    });
  }, [supabase]);

  // Resolve DB message id for user messages in case the UI id differs from DB id
  useEffect(() => {
    let isCancelled = false;
    async function resolveIdIfNeeded() {
      if (!isUser) return; // attachments are for user-sent messages
      // If we already have attachments under the provided id, skip
      // Otherwise, attempt to find the DB message by content and chat
      const { data, error } = await supabase
        .from("messages")
        .select("id, created_at")
        .eq("chat_id", chatId)
        .eq("content", content)
        .eq("role", "user")
        .order("created_at", { ascending: false })
        .limit(1);
      if (!isCancelled && !error && data && data.length > 0) {
        const foundId = (data[0] as { id: string }).id;
        setResolvedMessageId(foundId);
      } else {
        setResolvedMessageId(messageId);
      }
    }
    resolveIdIfNeeded();
    return () => {
      isCancelled = true;
    };
  }, [chatId, content, isUser, messageId, supabase]);

  useEffect(() => {
    if (resolvedMessageId) loadAttachments(resolvedMessageId);

    // Realtime: listen for new attachments for this message
    let channel: ReturnType<typeof supabase.channel> | null = null;
    if (resolvedMessageId) {
      channel = supabase
        .channel(`attachments:message:${resolvedMessageId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "attachments",
            filter: `message_id=eq.${resolvedMessageId}`,
          },
          async (payload: any) => {
            const record = payload?.new as AttachmentRecord | undefined;
            if (!record) return;
            setAttachments((prev) => {
              const exists = prev.some((p) => p.id === record.id);
              return exists ? prev : [...prev, record];
            });
            const { data: urlData } = await supabase.storage
              .from("chat_attachments")
              .createSignedUrl(record.storage_path, 60 * 60);
            setSignedUrls((prev) => ({ ...prev, [record.id]: urlData?.signedUrl ?? "" }));
          },
        )
        .subscribe();
    }

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch {}
    };
  }, [resolvedMessageId, supabase, loadAttachments]);

  // Event-driven refresh for immediate UI update after finalize
  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ messageId: string }>;
      const incomingId = ev?.detail?.messageId;
      if (!incomingId) return;
      // If event corresponds to this message, update resolved id and refresh
      if (incomingId === resolvedMessageId || incomingId === messageId) {
        setResolvedMessageId(incomingId);
        loadAttachments(incomingId);
      }
    };
    window.addEventListener("chat:attachments-finalized", handler as EventListener);
    return () => window.removeEventListener("chat:attachments-finalized", handler as EventListener);
  }, [messageId, resolvedMessageId, loadAttachments]);

  if (loading) {
    return null;
  }

  if (!attachments.length) {
    return null;
  }

  const openPreview = (att: AttachmentRecord) => {
    const url = signedUrls[att.id];
    if (!url) return;
    setPreview({ id: att.id, url, mimeType: att.mime_type, name: att.file_name });
  };

  const isImage = (m: string) => m.startsWith("image/");
  const isPdf = (m: string) => m === "application/pdf";
  const isVideo = (m: string) => m.startsWith("video/");
  const isAudio = (m: string) => m.startsWith("audio/");

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {attachments.map((att) => {
        const url = signedUrls[att.id];
        const mime = att.mime_type || "";
        return (
          <div
            key={att.id}
            className="relative w-20 h-20 rounded-md overflow-hidden bg-muted border border-border cursor-pointer"
            onClick={() => openPreview(att)}
            title={att.file_name}
          >
            {isImage(mime) && url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt={att.file_name} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full text-foreground-muted">
                {isPdf(mime) ? (
                  <FileText className="w-6 h-6" />
                ) : isVideo(mime) ? (
                  <FileVideo className="w-6 h-6" />
                ) : isAudio(mime) ? (
                  <FileAudio className="w-6 h-6" />
                ) : (
                  <FileIcon className="w-6 h-6" />
                )}
                <div className="mt-1 px-1 text-[10px] max-w-[72px] truncate text-center text-foreground-secondary">
                  {att.file_name}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <Dialog open={!!preview} onOpenChange={(open) => (!open ? setPreview(null) : null)}>
        <DialogContent className="max-w-3xl w-[95vw]">
          <DialogHeader>
            <DialogTitle className="truncate">{preview?.name ?? "Preview"}</DialogTitle>
          </DialogHeader>
          <div className="w-full">
            {preview && preview.mimeType.startsWith("image/") && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.url} alt={preview.name} className="max-h-[80vh] w-auto h-auto mx-auto rounded" />
            )}
            {preview && preview.mimeType === "application/pdf" && (
              <iframe src={preview.url} className="w-full h-[80vh] rounded border" />
            )}
            {preview && preview.mimeType.startsWith("video/") && (
              <video src={preview.url} controls className="w-full max-h-[80vh] rounded" />
            )}
            {preview && preview.mimeType.startsWith("audio/") && (
              <audio src={preview.url} controls className="w-full" />
            )}
            {preview &&
              !preview.mimeType.startsWith("image/") &&
              preview.mimeType !== "application/pdf" &&
              !preview.mimeType.startsWith("video/") &&
              !preview.mimeType.startsWith("audio/") && (
                <div className="text-sm text-foreground-secondary">
                  No preview available. You can download the file.
                  <div className="mt-2">
                    <a href={preview.url} download={preview.name} className="underline text-foreground-primary">
                      Download {preview.name}
                    </a>
                  </div>
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MessageAttachments;


