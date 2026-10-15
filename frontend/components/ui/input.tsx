"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type HTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = HTMLMotionProps<"input"> & { label?: string };

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, ...props }, ref) =>
    label ? (
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium leading-none">{label}</span>
        <motion.input
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-300 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          whileFocus={{ scale: 1.01, borderColor: "hsl(var(--primary))" }}
          {...props}
        />
      </label>
    ) : (
      <motion.input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-300 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        whileFocus={{ scale: 1.01, borderColor: "hsl(var(--primary))" }}
        {...props}
      />
    )
);
Input.displayName = "Input";

export const Label = forwardRef<HTMLLabelElement, HTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    />
  )
);
Label.displayName = "Label";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
      {...props}
    />
  )
);
Select.displayName = "Select";
