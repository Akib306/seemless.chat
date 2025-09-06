"use client";

import { useEffect, useState } from "react";
import { X, File as FileIcon, FileText, FileVideo, FileAudio } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type AttachmentUploadItem = {
	id: string;
	file: File;
	preUploadPath?: string;
	status: "queued" | "uploading" | "uploaded" | "error";
	error?: string;
};

type AttachmentPreviewGridProps = {
	uploads: AttachmentUploadItem[];
	onRemove: (id: string) => void;
};

export function AttachmentPreviewGrid({ uploads, onRemove }: AttachmentPreviewGridProps) {
	const [objectUrls, setObjectUrls] = useState<Record<string, string>>({});
	const [preview, setPreview] = useState<{
		id: string;
		url: string;
		mimeType: string;
		name: string;
		tempUrl: boolean;
	} | null>(null);

	// Build image object URLs for thumbnails; cleanup when entries change
	useEffect(() => {
		const nextUrls: Record<string, string> = {};
		uploads.forEach((u) => {
			if (u.file.type.startsWith("image/")) {
				nextUrls[u.id] = URL.createObjectURL(u.file);
			}
		});
		Object.entries(objectUrls).forEach(([id, url]) => {
			if (!(id in nextUrls)) {
				URL.revokeObjectURL(url);
			}
		});
		setObjectUrls(nextUrls);
		return () => {
			Object.values(nextUrls).forEach((url) => URL.revokeObjectURL(url));
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [uploads]);

	const openPreview = (item: AttachmentUploadItem) => {
		let url = objectUrls[item.id];
		let tempUrl = false;
		if (!url) {
			url = URL.createObjectURL(item.file);
			tempUrl = true;
		}
		setPreview({ id: item.id, url, mimeType: item.file.type, name: item.file.name, tempUrl });
	};

	const closePreview = () => {
		if (preview) {
			if (preview.tempUrl) {
				URL.revokeObjectURL(preview.url);
			}
			setPreview(null);
		}
	};

	if (uploads.length === 0) return null;

	return (
		<div className="flex flex-wrap gap-2 mb-2">
			{uploads.map((item) => {
				const isImage = item.file.type.startsWith("image/");
				const isPdf = item.file.type === "application/pdf";
				const isVideo = item.file.type.startsWith("video/");
				const isAudio = item.file.type.startsWith("audio/");
				return (
					<div
						key={item.id}
						className="relative w-20 h-20 rounded-md overflow-hidden bg-muted border border-border cursor-pointer group"
						onClick={() => openPreview(item)}
						title={item.file.name}
					>
						{isImage && objectUrls[item.id] ? (
							<img
								src={objectUrls[item.id]}
								alt={item.file.name}
								className="w-full h-full object-cover"
							/>
						) : (
							<div className="flex flex-col items-center justify-center w-full h-full text-foreground-muted">
								{isPdf ? (
									<FileText className="w-6 h-6" />
								) : isVideo ? (
									<FileVideo className="w-6 h-6" />
								) : isAudio ? (
									<FileAudio className="w-6 h-6" />
								) : (
									<FileIcon className="w-6 h-6" />
								)}
								<div className="mt-1 px-1 text-[10px] max-w-[72px] truncate text-center text-foreground-secondary">
									{item.file.name}
								</div>
							</div>
						)}

						{/* Remove button */}
						<button
							type="button"
							className="absolute top-1 right-1 rounded-full p-1 bg-background/80 text-foreground-muted hover:text-destructive shadow-xs"
							onClick={(e) => {
								e.stopPropagation();
								onRemove(item.id);
							}}
						>
							<X size={14} />
						</button>

						{/* Uploading spinner overlay */}
						{item.status === "uploading" && (
							<div className="absolute inset-0 bg-background/50 flex items-center justify-center">
								<div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
							</div>
						)}
					</div>
				);
			})}

			{/* Preview modal */}
			<Dialog open={!!preview} onOpenChange={(open) => (!open ? closePreview() : null)}>
				<DialogContent className="max-w-3xl w-[95vw]">
					<DialogHeader>
						<DialogTitle className="truncate">{preview?.name ?? "Preview"}</DialogTitle>
					</DialogHeader>
					<div className="w-full">
						{preview && preview.mimeType.startsWith("image/") && (
							<img src={preview.url} alt={preview.name} className="max-h-[80vh] w-auto h-auto mx-auto rounded" />
						)}
						{preview && preview.mimeType === "application/pdf" && (
							<iframe src={preview.url} className="w-full h-[80vh] rounded border" />
						)}
						{preview && preview.mimeType.startsWith("video/") && (
							<video src={preview.url} controls className="w-full max-h-[80vh] rounded" />
						)}
						{preview && preview.mimeType.startsWith("audio/") && (
							<audio src={preview.url} controls className="w-full" />
						)}
						{preview &&
							!preview.mimeType.startsWith("image/") &&
							preview.mimeType !== "application/pdf" &&
							!preview.mimeType.startsWith("video/") &&
							!preview.mimeType.startsWith("audio/") && (
							<div className="text-sm text-foreground-secondary">
								No preview available. You can download the file.
								<div className="mt-2">
									<a
										href={preview.url}
										download={preview.name}
										className="underline text-foreground-primary"
										>
										Download {preview.name}
										</a>
								</div>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}


