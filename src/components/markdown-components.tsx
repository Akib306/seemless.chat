// lib/markdownComponents.tsx
import { Components } from "react-markdown";
// Prefer Vercel AI Elements CodeBlock so code in AI responses uses their UI
import {
	CodeBlock as AICodeBlock,
	CodeBlockCopyButton,
} from "@/components/ai-elements/code-block";
import { ReactNode } from "react";

export const markdownComponents: Components = {
	// Tables
	table: ({ children, ...props }) => (
		<div className="overflow-x-auto my-8 rounded-lg border border-border shadow-sm">
			<table
				className="min-w-full table-auto border-collapse text-[15px] leading-7 text-foreground"
				{...props}
			>
				{children}
			</table>
		</div>
	),
	thead: ({ children, ...props }) => (
		<thead className="bg-card border-b border-border" {...props}>
			{children}
		</thead>
	),
	th: ({ children, ...props }) => (
		<th
			className="px-5 py-3 text-left font-semibold text-foreground whitespace-nowrap border-r border-border last:border-r-0"
			{...props}
		>
			{children}
		</th>
	),
	td: ({ children, ...props }) => (
		<td
			className="px-5 py-3 align-top text-muted-foreground border-t border-border border-r last:border-r-0"
			{...props}
		>
			{children}
		</td>
	),

	// Code blocks and inline code
	code({ children, className, ...props }) {
		const match = /language-(\w+)/.exec(className || "");
		const codeString = String(children).replace(/\n$/, "");

		// Robust detection: treat as block only if language is present or content is multi-line
		const isBlock = Boolean(match) || codeString.includes("\n");

		if (isBlock) {
			const language = match ? match[1] : "plaintext";
			return (
				<AICodeBlock code={codeString} language={language}>
					<CodeBlockCopyButton />
				</AICodeBlock>
			);
		}

		// Inline code
		return (
			<code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-[0.92em] font-mono break-words whitespace-pre-wrap max-w-full">
				{children}
			</code>
		);
	},

	// Headings
	h1: (props) => (
		<h1 className="text-3xl font-semibold mt-8 mb-3 text-foreground" {...props} />
	),
	h2: (props) => (
		<h2 className="text-2xl font-semibold mt-7 mb-3 text-foreground" {...props} />
	),
	h3: (props) => (
		<h3 className="text-xl font-medium mt-6 mb-2 text-foreground" {...props} />
	),
	h4: (props) => (
		<h4 className="text-lg font-medium mt-5 mb-2 text-foreground" {...props} />
	),

	// Paragraphs and lists
	p: (props) => (
		<p className="my-3 leading-7 text-foreground break-words" {...props} />
	),
	ul: ({ children, ...props }) => (
		<ul
			className="list-disc list-outside ml-6 my-4 space-y-2 text-foreground"
			{...props}
		>
			{children}
		</ul>
	),
	ol: ({ children, ...props }) => (
		<ol
			className="list-decimal list-outside ml-6 my-3 space-y-2 text-foreground"
			{...props}
		>
			{children}
		</ol>
	),
	li: ({ children, ...props }) => (
		<li className="leading-7" {...props}>
			{children}
		</li>
	),
	// Text styles
	strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
	em: (props) => <em className="italic text-muted-foreground" {...props} />,

	// Quotes
	blockquote: (props) => (
		<blockquote
			className="my-5 rounded-xl border border-border bg-accent/60 p-4 text-muted-foreground shadow-sm"
			{...props}
		/>
	),

	// Divider
	hr: (props) => <hr className="my-7 border-border" {...props} />,
};
