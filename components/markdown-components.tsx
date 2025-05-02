import { useState } from "react";
import { Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";

export const markdownComponents: Components = {
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