import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Combobox component for searchable dropdown with custom input support
// Allows users to select from a list OR type a custom value
export interface ComboboxProps {
  options: string[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  emptyText?: string
  className?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "اختر أو اكتب...",
  emptyText = "لا توجد نتائج",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value || "")

  // Update input value when value prop changes
  React.useEffect(() => {
    if (value !== undefined) {
      setInputValue(value)
    }
  }, [value])

  // Handle selection from dropdown
  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue)
    onValueChange(selectedValue)
    setOpen(false)
  }

  // Handle custom input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onValueChange(newValue)
  }

  // Handle input focus - open dropdown
  const handleInputFocus = () => {
    setOpen(true)
  }

  // Filter options based on input value for dropdown display
  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options
    const lowerInput = inputValue.toLowerCase()
    return options.filter((option) =>
      option.toLowerCase().includes(lowerInput)
    )
  }, [options, inputValue])

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              placeholder={placeholder}
              className={cn(
                "bg-background/50 border-border/50 focus:border-primary pr-10",
                className
              )}
              dir="rtl"
            />
            <ChevronsUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
          </div>
        </PopoverTrigger>
        {open && filteredOptions.length > 0 && (
          <PopoverContent 
            className="w-[var(--radix-popover-trigger-width)] p-0 backdrop-nature border-0" 
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command>
              <CommandList>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={() => handleSelect(option)}
                      className="cursor-pointer"
                      dir="rtl"
                    >
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4",
                          inputValue === option ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
    </div>
  )
}
