"use client";

import { useRouter } from "next/navigation";
import * as db from "@/lib/db/client";

/**
 * Custom hook for managing chat actions like delete, rename, etc.
 */
export function useChatActions() {
  const router = useRouter();

  /**
   * Returns a delete handler function that can be used directly in onClick events
   */
  const handleDeleteChat = (chatId: string) => {
    return async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      try {
        await db.chats.deleteChat(chatId);
        router.push('/chat');
      } catch (error) {
        console.error("Failed to delete chat:", error);
        // Could extend this to show user-facing error messages
      }
    };
  };

  return {
    handleDeleteChat,
  };
} 