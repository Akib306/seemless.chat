"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send } from "lucide-react";
import { useChat } from "@ai-sdk/react"; 
import Markdown from "react-markdown";

export default function ChatPage() {
  const [model, setModel] = useState("gemini-2.0-flash"); 

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll whenever messages are updated
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-screen w-[75%] mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">AI Chat Assistant</h1>
        {/* Model selection dropdown - allows switching between different AI models */}
        <div className="w-full max-w-xs">
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger>
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
              <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
              <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
              <SelectItem value="gpt-4.1-nano">GPT 4.1 Nano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chat message display area with conditional rendering */}
      <div className="h-[60vh] w-full overflow-y-auto mb-4 border rounded-md p-4 bg-secondary/20">
        {messages.length === 0 ? (
          // Show placeholder when no messages exist
          <div className="text-center text-muted-foreground h-full flex items-center justify-center">
            <p>Start a conversation by typing a message below.</p>
          </div>
        ) : (
          // Render each message with appropriate styling based on role
          messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${
                message.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-wrap">
                  <Markdown>{message.content}</Markdown>
                </p>
              </div>
            </div>
          ))
        )}
        {/* Reference element for auto-scrolling to the bottom */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input form with loading state handling */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? (
            // Show loading spinner when waiting for response
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
    </div>
  );
}
