import type React from "react";
import { Search } from "lucide-react";

import { Label } from "@/src/app/components/ui/label";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarInput,
} from "@/src/app/components/ui/sidebar";

interface SearchFormProps extends React.ComponentProps<"form"> {
	placeholder?: string;
}

export function SearchForm({
	placeholder = "Search...",
	...props
}: SearchFormProps) {
	return (
		<form {...props}>
			<SidebarGroup className="py-0">
				<SidebarGroupContent className="relative">
					<Label htmlFor="search" className="sr-only">
						Search
					</Label>
					<SidebarInput
						id="search"
						placeholder={placeholder}
						className="pl-8"
					/>
					<Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
				</SidebarGroupContent>
			</SidebarGroup>
		</form>
	);
}
