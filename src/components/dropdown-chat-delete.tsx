"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import * as db from "@/lib/db/client";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface DropdownChatDeleteProps {
  chatId: string;
}

export function DropdownChatDelete({ chatId }: DropdownChatDeleteProps) {
  const router = useRouter();
  
  const handleDeleteChat = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await db.chats.deleteChat(chatId);
      router.push('/chat');
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  return (
    <DropdownMenuItem
      onClick={handleDeleteChat}
      className="text-destructive focus:text-destructive"
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </DropdownMenuItem>
  );
}