"use client";

import { useState, useRef, useEffect } from "react";
import { useChat, type Message } from "@ai-sdk/react";
import { FormMessage, Message as FormMessageType } from "@/components/form-message";
import { ChatInput } from "@/components/chat-input";
import { Badge } from "@/components/ui/badge";
import { DEBUG_MODE, handleDebugSubmit } from "@/utils/debug-chat";

export default function ChatPage() {
  const [model, setModel] = useState("gemini-2.0-flash");
  const [statusMessage, setStatusMessage] = useState<FormMessageType | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    isLoading,
    error,
    stop,
    reload,
    setInput,
    append,
    setMessages,
  } = useChat({
    api: "/api/chat",
    body: {
      model,
    },
    onFinish: (message) => {
      console.log("Finished receiving:", message);
    },
  });

  // Custom submit handler that uses debug mode when enabled
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (DEBUG_MODE) {
      await handleDebugSubmit(input, messages, setMessages, setInput);
    } else {
      originalHandleSubmit(e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll whenever messages are updated
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-screen w-full mx-auto p-0" style={{ backgroundColor: "#1A1A1A" }}>
      {/* Debug mode indicator */}
      
      { DEBUG_MODE && <div className="w-full flex justify-center p-2" style={{ backgroundColor: "#2A2A2A" }}>
        <Badge variant="secondary" className="text-xs">
          Debug Mode Active
        </Badge>
      </div> }

      {/* Chat message display area */}
      <div className="flex-1 overflow-y-auto p-4 mb-4" style={{ color: "#F5F5F5" }}>
        {messages.length === 0 ? (
          <div className="text-center h-full flex items-center justify-center" style={{ color: "#CCCCCC" }}>
            <p>Start a conversation by typing a message below.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`mb-6 ${
                message.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block p-4 rounded-2xl max-w-[80%] ${
                  message.role === "user"
                    ? "bg-[#6A8DAD] text-[#F5F5F5]"
                    : "bg-[#2A2A2A] text-[#F5F5F5]"
                }`}
                style={{ 
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  animation: "fadeIn 0.3s ease-in-out"
                }}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Status message display */}
      {statusMessage && (
        <div className="px-4 mb-2">
          <FormMessage message={statusMessage} />
        </div>
      )}

      {/* Chat Input Component */}
      <ChatInput
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        model={model}
        setModel={setModel}
      />
    </div>
  );
}