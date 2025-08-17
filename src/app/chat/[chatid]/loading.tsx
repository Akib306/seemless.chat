// Lightweight loading component without heavy Skeleton dependencies
export default function Loading() {
	return (
		<div
			className="h-screen w-full flex flex-col overflow-hidden"
			style={{ backgroundColor: "#1A1A1A" }}
		>
			<div className="flex-1 min-h-0 overflow-auto flex justify-center">
				<div className="w-full max-w-3xl px-4 py-6 space-y-4">
					{/* Simulated message bubbles with pure CSS */}
					<div className="flex gap-3 justify-end">
						<div className="flex-1 space-y-2 max-w-xl">
							<div className="h-4 w-full bg-zinc-800 rounded animate-pulse" />
							<div className="h-4 w-2/3 bg-zinc-800 rounded animate-pulse" />
						</div>
						<div className="h-10 w-10 rounded-full bg-zinc-800 animate-pulse" />
					</div>
					<div className="flex gap-3">
						<div className="h-10 w-10 rounded-full bg-zinc-800 animate-pulse" />
						<div className="flex-1 space-y-2">
							<div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse" />
							<div className="h-4 w-1/2 bg-zinc-800 rounded animate-pulse" />
						</div>
					</div>
					<div className="flex gap-3 justify-end">
						<div className="flex-1 space-y-2 max-w-xl">
							<div className="h-4 w-5/6 bg-zinc-800 rounded animate-pulse" />
							<div className="h-4 w-1/3 bg-zinc-800 rounded animate-pulse" />
						</div>
						<div className="h-10 w-10 rounded-full bg-zinc-800 animate-pulse" />
					</div>
					<div className="flex gap-3">
						<div className="h-10 w-10 rounded-full bg-zinc-800 animate-pulse" />
						<div className="flex-1 space-y-2">
							<div className="h-4 w-2/3 bg-zinc-800 rounded animate-pulse" />
							<div className="h-4 w-1/4 bg-zinc-800 rounded animate-pulse" />
						</div>
					</div>
				</div>
			</div>

			{/* Sticky input area placeholder */}
			<div
				className="flex-shrink-0"
				style={{
					position: "sticky",
					bottom: 0,
					left: 0,
					width: "100%",
					background: "#1A1A1A",
					zIndex: 10,
				}}
			>
				<div className="px-4 pb-6">
					<div className="h-14 w-full bg-zinc-800 rounded animate-pulse" />
				</div>
			</div>
		</div>
	);
}
