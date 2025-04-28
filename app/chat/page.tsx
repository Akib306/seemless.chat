"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send } from "lucide-react";

// Define the structure for chat messages
interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  // State management for chat functionality
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Initialize with Gemini 2.0 Flash as the default model
  const [model, setModel] = useState("gemini-2.0-flash");
  // Reference to automatically scroll to the bottom of the chat
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to scroll to the most recent message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll whenever messages are updated
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Create and add the user's message to the chat
    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Send the conversation history and selected model to the API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model, // The selected AI model from the dropdown
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Create an empty placeholder for the assistant's response
      // This will be filled incrementally as we receive the streaming response
      const assistantMessage: Message = {
        role: "assistant",
        content: "",
      };
      
      // Add the empty assistant message to the messages array
      // This creates a placeholder that will be incrementally filled
      // as the streaming response comes in from the API
      // The spread operator (...) creates a copy of the previous messages array
      // and then adds the assistantMessage as a new item at the end
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Set up streaming response handling
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error("No response body");
      }
      
      // Process the stream chunk by chunk
      let done = false;
      while (!done) {
        // Read the next chunk from the stream
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          // Decode the chunk and append it to the assistant's message
          const text = decoder.decode(value);
          setMessages((prev) => {
            const newMessages = [...prev];
            // Find the last message (which should be the assistant's)
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === "assistant") {
              // Append the new text to the existing content
              lastMessage.content += text;
            }
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error("Error:", error);
      // Add an error message if the request fails
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, there was an error processing your request." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

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
                <p className="whitespace-pre-wrap">{message.content}</p>
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
          onChange={(e) => setInput(e.target.value)}
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
