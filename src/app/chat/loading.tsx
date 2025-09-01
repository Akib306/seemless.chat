export default function Loading() {
  return (
    <div
				className="h-screen w-full flex flex-col overflow-hidden bg-background"
			>
				<div className="flex-1 min-h-0 overflow-auto flex justify-center">
					<div className="w-full max-w-3xl px-4 py-6 space-y-4">
						{/* Simulated message bubbles */}
						<div className="flex gap-3 justify-end">
							<div className="flex-1 space-y-2 max-w-xl">
								<div className="h-4 w-full bg-card rounded animate-pulse" />
								<div className="h-4 w-2/3 bg-card rounded animate-pulse" />
							</div>
							<div className="h-10 w-10 rounded-full bg-card animate-pulse" />
						</div>
						<div className="flex gap-3">
							<div className="h-10 w-10 rounded-full bg-card animate-pulse" />
							<div className="flex-1 space-y-2">
								<div className="h-4 w-3/4 bg-card rounded animate-pulse" />
								<div className="h-4 w-1/2 bg-card rounded animate-pulse" />
							</div>
						</div>
					</div>
				</div>
		</div>
  )
}