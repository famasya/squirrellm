import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { Button } from "~/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "~/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

type Option = {
	value: string;
	label: string;
	description?: string;
};

interface SearchableSelectProps {
	options: Option[];
	placeholder?: string;
	emptyMessage?: string;
	value?: string;
	onChange?: (option: Option) => void;
	disabled?: boolean;
	className?: string;
	trimCharacters?: number;
}

export function SearchableSelect({
	options,
	placeholder = "Select an option",
	emptyMessage = "No results found.",
	value,
	onChange,
	trimCharacters,
	...props
}: SearchableSelectProps) {
	const [open, setOpen] = React.useState(false);
	const [selectedValue, setSelectedValue] = React.useState(value);

	const memoizedOptions = React.useMemo(() => options, [options]);

	const placeholderValue = React.useMemo(() => {
		const label = memoizedOptions.find((option) => option.value === value)
			?.label as string;
		if (trimCharacters) {
			return label.length > trimCharacters
				? `${label.substring(0, trimCharacters)}...`
				: label;
		}
		return label;
	}, [memoizedOptions, value, trimCharacters]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild disabled={props.disabled}>
				<Button
					variant="outline"
					aria-expanded={open}
					className={cn(
						"w-full justify-between rounded-full truncate overflow-hidden border-2",
					)}
				>
					{value ? placeholderValue : placeholder}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
				<Command className="w-full">
					<CommandInput placeholder="Search options..." className="w-full" />
					<CommandList className="w-full">
						<CommandEmpty>{emptyMessage}</CommandEmpty>
						<CommandGroup className="w-full">
							{memoizedOptions.map((option) => (
								<CommandItem
									key={option.value}
									value={option.value}
									onSelect={(currentValue: string) => {
										setSelectedValue(currentValue);
										onChange?.(
											memoizedOptions.find((o) => o.value === currentValue) as Option,
										);
										setOpen(false);
									}}
									className="w-full flex items-center justify-between"
								>
									<div className="flex flex-col">
										{option.label}
										<div>
											{option.description && (
												<span className="text-muted-foreground text-xs">
													{option.description}
												</span>
											)}
										</div>
									</div>
									<Check
										className={cn(
											"h-4 w-4 shrink-0",
											selectedValue === option.value
												? "opacity-100"
												: "opacity-0",
										)}
									/>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
