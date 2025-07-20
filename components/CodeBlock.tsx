"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
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
		<div className="my-6 overflow-hidden rounded-md ring-1 ring-[#2a2a2a] bg-[#1e1e1e]">
			<div className="flex justify-between items-center px-4 py-2 text-xs text-gray-400 bg-[#2a2a2a]">
				<span className="">{language}</span>
				<button
					onClick={handleCopy}
					className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors"
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
				style={vscDarkPlus}
				customStyle={{
					background: "transparent",
					padding: "1rem",
					margin: 0,
					fontSize: "0.875rem",
					lineHeight: "1.5",
				}}
			>
				{value}
			</SyntaxHighlighter>
		</div>
	);
}
