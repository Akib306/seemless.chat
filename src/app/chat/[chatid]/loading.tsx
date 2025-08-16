import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div
			className="h-screen w-full flex flex-col overflow-hidden"
			style={{ backgroundColor: "#1A1A1A" }}
		>
			<div className="flex-1 min-h-0 overflow-auto flex justify-center">
				<div className="w-full max-w-3xl px-4 py-6 space-y-4">
					{/* Simulated message bubbles */}
					<div className="flex gap-3 justify-end">
						<div className="flex-1 space-y-2 max-w-xl">
							<Skeleton className="h-4 w-full bg-zinc-800" />
							<Skeleton className="h-4 w-2/3 bg-zinc-800" />
						</div>
						<Skeleton className="h-10 w-10 rounded-full bg-zinc-800" />
					</div>
					<div className="flex gap-3">
						<Skeleton className="h-10 w-10 rounded-full bg-zinc-800" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-3/4 bg-zinc-800" />
							<Skeleton className="h-4 w-1/2 bg-zinc-800" />
						</div>
					</div>
					<div className="flex gap-3 justify-end">
						<div className="flex-1 space-y-2 max-w-xl">
							<Skeleton className="h-4 w-5/6 bg-zinc-800" />
							<Skeleton className="h-4 w-1/3 bg-zinc-800" />
						</div>
						<Skeleton className="h-10 w-10 rounded-full bg-zinc-800" />
					</div>
					<div className="flex gap-3">
						<Skeleton className="h-10 w-10 rounded-full bg-zinc-800" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-2/3 bg-zinc-800" />
							<Skeleton className="h-4 w-1/4 bg-zinc-800" />
						</div>
					</div>
				</div>
			</div>

			{/* Sticky input area placeholder */}
			<div
				className="flex-shrink-0"
				style={{ position: "sticky", bottom: 0, left: 0, width: "100%", background: "#1A1A1A", zIndex: 10 }}
			>
				<div className="px-4 pb-6">
					<Skeleton className="h-14 w-full bg-zinc-800" />
				</div>
			</div>
		</div>
	);
}


