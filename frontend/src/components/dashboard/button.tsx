"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-color focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-lightest-bw",
  {
    variants: {
      variant: {
        default: "bg-theme-color text-white hover:bg-dark-color",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border border-light-bw bg-transparent hover:bg-lighter-bw hover:text-theme-color text-dark-text-bw",
        secondary: "bg-lighter-bw text-dark-text-bw hover:bg-light-bw/80",
        ghost: "hover:bg-lighter-bw hover:text-theme-color text-dark-text-bw",
        link: "underline-offset-4 hover:underline text-theme-color",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
