"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#a78bfa] text-white hover:bg-[#b89dfc] active:bg-[#9676e8]",
  secondary:
    "bg-[#252530] text-white border border-[#2d2d38] hover:bg-[#1c1c1f] active:bg-[#111113]",
  danger:
    "bg-red-500/10 text-red-400 hover:bg-red-500/20 active:bg-red-500/30",
  ghost:
    "bg-transparent text-white hover:bg-[#252530] active:bg-[#1c1c1f]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", disabled, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={[
          "rounded-xl px-6 py-3 font-medium transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]/50",
          variantStyles[variant],
          disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : "cursor-pointer",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
