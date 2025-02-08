"use client"

import { Check, ChevronsUpDown } from "lucide-react"
import * as React from "react"

import { Button } from "~/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { cn } from "~/lib/utils"

type Option = {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: Option[]
  placeholder?: string
  emptyMessage?: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
}

export function SearchableSelect({
  options,
  placeholder = "Select an option",
  emptyMessage = "No results found.",
  value,
  onChange,
  ...props
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={props.disabled}>
        <Button variant="outline" aria-expanded={open} className="w-full justify-between rounded-full">
          {value ? options.find((option) => option.value === value)?.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
        <Command className="w-full">
          <CommandInput placeholder="Search options..." className="w-full" />
          <CommandList className="w-full">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className="w-full">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue: string) => {
                    setSelectedValue(currentValue)
                    onChange?.(currentValue)
                    setOpen(false)
                  }}
                  className="w-full flex items-center justify-between"
                >
                  <span>{option.label}</span>
                  <Check className={cn("h-4 w-4 shrink-0", selectedValue === option.value ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

