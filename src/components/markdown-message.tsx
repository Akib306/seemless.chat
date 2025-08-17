"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { markdownComponents } from "@/components/markdown-components";

interface MarkdownMessageProps {
	content: string;
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
	return (
		<ReactMarkdown
			remarkPlugins={[remarkGfm, remarkMath]}
			rehypePlugins={[rehypeRaw, rehypeKatex]}
			components={markdownComponents}
		>
			{content}
		</ReactMarkdown>
	);
}
