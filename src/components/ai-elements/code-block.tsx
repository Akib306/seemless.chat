"use client";

import * as React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type AICodeBlockProps = React.HTMLAttributes<HTMLDivElement> & {
	code: string;
	language: string;
	showLineNumbers?: boolean;
	className?: string;
	children?: React.ReactNode; // typically <CodeBlockCopyButton />
};

type CodeCtx = { code: string };
const CodeBlockContext = React.createContext<CodeCtx | null>(null);

export function CodeBlock({
	code,
	language,
	showLineNumbers = false,
	className,
	children,
	...rest
}: AICodeBlockProps) {
	const label = (language || "plaintext").toUpperCase();
	return (
		<CodeBlockContext.Provider value={{ code }}>
			<div
				className={cn(
					"relative my-6 overflow-hidden rounded-xl border border-border bg-background/60 backdrop-blur-sm",
					className,
				)}
				{...rest}
			>
				{/* Header with language label and optional actions */}
				<div className="flex items-center justify-between px-4 py-2 text-[11px] uppercase tracking-wide text-muted-foreground bg-card border-b border-border">
					<span>{label}</span>
					<div className="flex items-center gap-1">{children}</div>
				</div>
				<SyntaxHighlighter
					language={language}
					style={oneDark}
					showLineNumbers={showLineNumbers}
					customStyle={{
						background: "transparent",
						padding: "1rem",
						margin: 0,
						fontSize: "1rem",
						lineHeight: "1.5",
						fontFamily: "JetBrains Mono",
					}}
					codeTagProps={{
						style: { background: "transparent" },
					}}
				>
					{code}
				</SyntaxHighlighter>
			</div>
		</CodeBlockContext.Provider>
	);
}

type CopyButtonProps = React.ComponentProps<typeof Button> & {
	timeout?: number;
	onCopy?: () => void;
	onError?: (error: Error) => void;
};

export function CodeBlockCopyButton({
	className,
	timeout = 2000,
	onCopy,
	onError,
	...props
}: CopyButtonProps) {
	const ctx = React.useContext(CodeBlockContext);
	const [copied, setCopied] = React.useState(false);

	const handleCopy = React.useCallback(async () => {
		try {
			await navigator.clipboard.writeText(ctx?.code ?? "");
			setCopied(true);
			onCopy?.();
			setTimeout(() => setCopied(false), timeout);
		} catch (err) {
			onError?.(err as Error);
		}
	}, [ctx?.code, onCopy, onError, timeout]);

	return (
		<Button
			size="sm"
			variant="ghost"
			className={cn("h-7 px-2 text-muted-foreground hover:text-foreground", className)}
			onClick={handleCopy}
			{...props}
		>
			{copied ? (
				<Check className="h-3.5 w-3.5" />
			) : (
				<Copy className="h-3.5 w-3.5" />
			)}
		</Button>
	);
}
