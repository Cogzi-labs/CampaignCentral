import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "./input"

interface ComboboxProps {
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyText?: string
  className?: string
  allowCustomValue?: boolean
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  emptyText = "No options found.",
  className,
  allowCustomValue = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [customValue, setCustomValue] = React.useState("")
  const [showCustomInput, setShowCustomInput] = React.useState(false)

  // Find if current value matches any option
  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value ? (
            selectedOption ? selectedOption.label : value
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>
              {emptyText}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            
            {allowCustomValue && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  {!showCustomInput ? (
                    <CommandItem
                      onSelect={() => {
                        setShowCustomInput(true);
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add custom value
                    </CommandItem>
                  ) : (
                    <div className="flex items-center gap-2 p-2">
                      <Input
                        value={customValue}
                        onChange={(e) => setCustomValue(e.target.value)}
                        className="h-8"
                        placeholder="Enter custom value..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customValue) {
                            e.preventDefault();
                            onChange(customValue);
                            setOpen(false);
                            setShowCustomInput(false);
                            setCustomValue("");
                          }
                        }}
                        autoFocus
                      />
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => {
                          if (customValue) {
                            onChange(customValue);
                            setOpen(false);
                            setShowCustomInput(false);
                            setCustomValue("");
                          }
                        }}
                        disabled={!customValue}
                      >
                        Add
                      </Button>
                    </div>
                  )}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}