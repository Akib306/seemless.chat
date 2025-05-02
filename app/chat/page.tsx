"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Copy, Check } from "lucide-react";
import { useChat } from "@ai-sdk/react"; 

// Markdown and syntax highlighting
import ReactMarkdown, { Components } from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "katex/dist/katex.min.css";
import remarkGfm from "remark-gfm";


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

  // Use CodeProps for proper typing of the code renderer
  const markdownComponents: Components = {
    table: ({ children, ...props }) => (
      <table className="table-auto w-full border-collapse mb-4 border-2" {...props}>
        {children}
      </table>
    ),
    th: ({ children, ...props }) => (
      <th className="border-2 border-gray-400 px-4 py-2 bg-gray-700 text-white text-left font-bold" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="border-2 border-gray-300 px-4 py-2" {...props}>
        {children}
      </td>
    ),
    code: ({ inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || "");
      // State to track if code has been copied to the clipboard
      const [copied, setCopied] = useState(false);
      
      // Function to copy code to clipboard and show visual feedback
      const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code).then(() => {
          // Set copied state to true to show success feedback
          setCopied(true);
          // Reset copied state after 2 seconds
          setTimeout(() => setCopied(false), 2000);
        });
      };
      
      if (!inline && match) {
        // Extract code string and language from the markdown code block
        const codeString = String(children).replace(/\n$/, "");
        const language = match[1];
        
        return (
          // Container for the code block with header
          <div className="relative group">
            {/* Header bar containing language name and copy button */}
            <div className="flex items-center justify-between bg-gray-800 px-4 py-1 text-xs text-gray-400 rounded-t">
              {/* Display the programming language name */}
              <span>{language}</span>
              {/* Copy button with visual feedback on click */}
              <button
                onClick={() => copyToClipboard(codeString)}
                className="flex items-center gap-1 text-gray-300 hover:text-white"
                aria-label="Copy code"
              >
                {/* Toggle between Check icon (copied) and Copy icon (not copied) */}
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            {/* SyntaxHighlighter with adjusted styling to work with our custom header */}
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={language}
              PreTag="div"
              {...props}
              className="rounded-t-none !mt-0"
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        );
      }
      // For inline code, use regular code element without copy functionality
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
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
                
                {/* Render Markdown with code highlighting and LaTeX */}
                <ReactMarkdown
                  remarkPlugins={[remarkGfm,remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={markdownComponents}
                >
                  {message.content}
                </ReactMarkdown>

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
