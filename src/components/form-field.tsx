import { type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  id: string;
  type: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  children?: ReactNode;
  className?: string;
}

export function FormField({
  label,
  id,
  type,
  placeholder,
  value,
  onChange,
  error,
  children,
  className,
  ...inputProps
}: FormFieldProps & Omit<React.ComponentProps<"input">, keyof FormFieldProps>) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label
        htmlFor={id}
        className="text-sm font-medium text-foreground/80"
      >
        {label}
      </label>
      {children ? (
        <div className="relative">
          <Input
            id={id}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className={cn(!!error && "pr-10", children && "pr-10")}
            aria-invalid={!!error}
            {...inputProps}
          />
          {children}
        </div>
      ) : (
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          aria-invalid={!!error}
          {...inputProps}
        />
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
