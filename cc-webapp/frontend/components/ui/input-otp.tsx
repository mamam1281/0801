"use client";

import * as React from "react";
import { MinusIcon } from "lucide-react";
import { cn } from "./utils";

// Mock OTPInput context and components
const OTPInputContext = React.createContext<{
  slots: { char?: string; hasFakeCaret?: boolean; isActive?: boolean }[]
}>({ slots: [] });

export interface InputOTPProps extends React.InputHTMLAttributes<HTMLInputElement> {
  maxLength?: number;
  render?: (props: any) => React.ReactElement;
  containerClassName?: string;
  pushPasswordManagerStrategy?: "none" | "increase-width";
}

export const InputOTP = React.forwardRef<HTMLInputElement, InputOTPProps>(
  ({ className, containerClassName, ...props }, ref) => (
    <OTPInputContext.Provider value={{ slots: [] }}>
      <div className={cn("flex items-center gap-2", containerClassName)}>
        <input
          ref={ref}
          type="text"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base",
            className
          )}
          {...props}
        />
      </div>
    </OTPInputContext.Provider>
  )
);
InputOTP.displayName = "InputOTP";

export const InputOTPGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
));
InputOTPGroup.displayName = "InputOTPGroup";

export const InputOTPSlot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { index: number }
>(({ index, className, ...props }, ref) => {
  const context = React.useContext(OTPInputContext);
  const slot = context?.slots?.[index] || {};
  const { char, hasFakeCaret, isActive } = slot;

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-base transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-2 ring-ring ring-offset-background",
        className
      )}
      data-slot="otp-slot"
      data-slot-index={index}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
});
InputOTPSlot.displayName = "InputOTPSlot";

export const InputOTPSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    className={cn("text-muted-foreground", className)}
    {...props}
  >
    <MinusIcon className="h-4 w-4" />
  </div>
));
InputOTPSeparator.displayName = "InputOTPSeparator";
