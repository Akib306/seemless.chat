"use client"
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Paperclip, X } from "lucide-react";
import { useChatContext } from "@/contexts/chat-context";
import * as db from "@/lib/db/client";
import { useRouter } from "next/navigation";

export function ChatInput() {
  const { 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading, 
    model, 
    setModel,
    chatId,
    setChatId
  } = useChatContext();

  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Auto-resize textarea as content grows
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  // Handle file removal
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  // Prevent default behavior for drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && files.length === 0) return;

    try {
      let currentChatId = chatId;

      if (!currentChatId) {
        const chat = await db.chats.createChat("New Chat");
        currentChatId = chat.id;
        console.log(currentChatId)

        setChatId(currentChatId);
      }
      
      // Navigate to the chat page immediately
      router.push(`/chat/${currentChatId}`);
      
      await db.messages.createMessage(currentChatId, input, 'user', model);

      if (files.length > 0) {
        const fileNames = files.map(f => f.name).join(", ");
        console.log("Files to upload:", fileNames);
      }

      handleSubmit(e);
      
      setFiles([]);

    } catch (error) {
      console.error("Error in chat submission:", error);
    }
  };

  return (
    <div className="p-4 flex justify-center" style={{ borderColor: "#333333" }}>
      <form onSubmit={onSubmit} className="relative w-full max-w-3xl">
        {/* File previews */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {files.map((file, index) => (
              <div 
                key={index} 
                className="relative p-2 rounded-md flex items-center gap-2"
                style={{ backgroundColor: "#2A2A2A" }}
              >
                <span className="text-sm truncate max-w-[150px]" style={{ color: "#F5F5F5" }}>
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-[#CCCCCC] hover:text-[#FF4C4C]"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input area */}
        <div 
          className="flex flex-col rounded-xl p-2"
          style={{ backgroundColor: "rgba(42, 42, 42, 0.7)" }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 bg-transparent border-none resize-none outline-none min-h-[48px] max-h-[200px] px-3 py-2"
            style={{ color: "#F5F5F5" }}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                onSubmit(e);
              }
            }}
          />
          
          <div className="flex items-center gap-2 mt-2">
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger 
  className="w-auto min-w-[140px] h-9 px-3 rounded-md  bg-transparent text-[#F5F5F5] hover:bg-[#3A3A3A] focus:outline-none focus:ring-0 focus:ring-offset-0 transition-colors"
  style={{ color: "#F5F5F5" }}
              >
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: "#2A2A2A", color: "#F5F5F5", borderColor: "#333333" }}>
                <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                <SelectItem value="gpt-4.1-nano">GPT 4.1 Nano</SelectItem>
                <SelectItem value="claude-3">Claude 3</SelectItem>
                <SelectItem value="llama-3">Llama 3</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-[#333333] flex items-center justify-center"
                style={{ color: "#CCCCCC" }}
              >
                <Paperclip size={20} />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                />
              </button>
              
              <Button 
                type="submit" 
                disabled={isLoading || (!input.trim() && files.length === 0)}
                className="rounded-full p-2 flex items-center justify-center"
                style={{ 
                  backgroundColor: isLoading || (!input.trim() && files.length === 0) ? "#333333" : "#6A8DAD",
                  color: "#F5F5F5"
                }}
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#F5F5F5] border-t-transparent" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
} 