"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// Import all available Prism themes
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";

type CodeBlockProps = {
	language: string;
	value: string;
};

export function CodeBlock({ language, value }: CodeBlockProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(value).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	return (
		<div className="my-6 overflow-hidden rounded-md ring-1 ring-border bg-card">
			<div className="flex justify-between items-center px-4 py-2 text-xs text-muted-foreground bg-card border-b border-border">
				<span className="">{language}</span>
				<button
					onClick={handleCopy}
					className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
				>
					{copied ? (
						<Check className="h-4 w-4" />
					) : (
						<Copy className="h-4 w-4" />
					)}
					{copied ? "Copied" : "Copy"}
				</button>
			</div>
			<SyntaxHighlighter
				language={language}
				style={oneDark}
				customStyle={{
					background: "transparent",
					padding: "1rem",
					margin: 0,
					fontSize: "1rem",
					lineHeight: "1.5",
					fontFamily: "JetBrains Mono",
				}}
				codeTagProps={{
					style: {
						background: "transparent",
					},
				}}
			>
				{value}
			</SyntaxHighlighter>
		</div>
	);
}
