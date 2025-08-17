// lib/markdownComponents.tsx
import { Components } from "react-markdown";
import { CodeBlock } from "@/components/code-block";
import { ReactNode } from "react";

export const markdownComponents: Components = {
	// Tables
	table: ({ children, ...props }) => (
		<div className="overflow-x-auto my-8 rounded-lg border border-gray-700 shadow-sm">
			<table
				className="min-w-full table-auto border-collapse text-sm text-gray-200"
				{...props}
			>
				{children}
			</table>
		</div>
	),
	thead: ({ children, ...props }) => (
		<thead className="bg-gray-800 border-b border-gray-700" {...props}>
			{children}
		</thead>
	),
	th: ({ children, ...props }) => (
		<th
			className="px-6 py-4 text-left font-semibold text-white whitespace-nowrap border-r border-gray-700 last:border-r-0"
			{...props}
		>
			{children}
		</th>
	),
	td: ({ children, ...props }) => (
		<td
			className="px-6 py-4 align-top text-gray-300 border-t border-gray-700 border-r last:border-r-0"
			{...props}
		>
			{children}
		</td>
	),

	// Code blocks and inline code
	code({ children, className, ...props }) {
		const match = /language-(\w+)/.exec(className || "");
		const isInline = (props as any).inline;
		const codeString = String(children).replace(/\n$/, "");

		if (!isInline && match) {
			return <CodeBlock language={match[1]} value={codeString} />;
		}

		return (
			<code className="bg-[#2a2a2a] text-gray-100 px-1.5 py-0.5 rounded text-[0.875em] break-words whitespace-pre-wrap max-w-full">
				{children}
			</code>
		);
	},

	// Headings
	h1: (props) => (
		<h1 className="text-3xl font-bold mt-10 mb-4 text-white" {...props} />
	),
	h2: (props) => (
		<h2 className="text-2xl font-semibold mt-8 mb-3 text-white" {...props} />
	),
	h3: (props) => (
		<h3 className="text-xl font-medium mt-6 mb-2 text-white" {...props} />
	),
	h4: (props) => (
		<h4 className="text-lg font-medium mt-6 mb-2 text-white" {...props} />
	),

	// Paragraphs and lists
	p: (props) => <p className="my-4 leading-relaxed text-gray-300 break-words" {...props} />,
	ul: (props) => (
		<ul className="list-disc list-inside ml-6 my-4 text-gray-300" {...props} />
	),
	ol: ({ children, ...props }) => (
		<ol className="list-decimal ml-6 my-6 space-y-4 text-gray-300" {...props}>
			{children}
		</ol>
	),
	li: ({ children, ...props }) => (
		<li className="space-y-2 leading-relaxed" {...props}>
			{children}
		</li>
	),
	// Text styles
	strong: (props) => <strong className="font-semibold text-white" {...props} />,
	em: (props) => <em className="italic text-gray-300" {...props} />,

	// Quotes
	blockquote: (props) => (
		<blockquote
			className="border-l-4 border-gray-700 pl-4 italic text-gray-400 my-6"
			{...props}
		/>
	),

	// Divider
	hr: (props) => <hr className="my-8 border-gray-700" {...props} />,
};
