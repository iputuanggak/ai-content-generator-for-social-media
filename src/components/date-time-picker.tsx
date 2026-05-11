"use client";

import { useState } from "react";
import { format, setHours, setMinutes } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon } from "@hugeicons/core-free-icons";

interface DateTimePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  disabled = false,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  const timeString = value ? format(value, "HH:mm") : "00:00";

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(":").map(Number);
    const base = value ?? new Date();
    let next = setHours(base, hours);
    next = setMinutes(next, minutes);
    next.setSeconds(0);
    next.setMilliseconds(0);
    onChange(next);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined);
      return;
    }
    const hours = value ? value.getHours() : 0;
    const minutes = value ? value.getMinutes() : 0;
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
    onChange(date);
  };

  const displayValue = value
    ? `${format(value, "MMM d, yyyy")} ${format(value, "HH:mm")}`
    : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="mr-2 size-4" />
          {displayValue ?? placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          defaultMonth={value ?? new Date()}
          onSelect={handleDateSelect}
          autoFocus
        />
        <div className="border-t p-3">
          <label className="text-sm font-medium text-foreground/80 mb-1 block">
            Time
          </label>
          <Input
            type="time"
            value={timeString}
            onChange={handleTimeChange}
            aria-label="Time"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
