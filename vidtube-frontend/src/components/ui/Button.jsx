import clsx from "clsx";
import { forwardRef } from "react";

const base =
  "inline-flex items-center justify-center font-semibold transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed select-none cursor-pointer";

const variants = {
  primary:
    "bg-primary text-white shadow-sm hover:bg-[#cc0000] hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] active:shadow-sm",
  secondary:
    "bg-secondary text-white shadow-sm hover:bg-[#059669] hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] active:shadow-sm",
  outline:
    "border-2 border-border text-text bg-transparent hover:bg-[#272727] hover:border-zinc-500 active:bg-surface",
  ghost: "text-text hover:bg-[#272727] hover:text-white active:bg-surface",
};

const sizes = {
  sm: "h-9 px-3 text-sm rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-lg gap-2",
  lg: "h-12 px-6 text-base rounded-xl gap-2",
  xl: "h-14 px-8 text-lg rounded-xl gap-2.5",
};

const Button = forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "md",
      className,
      isLoading = false,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Component = asChild ? "span" : "button";

    return (
      <Component
        ref={ref}
        className={clsx(
          base,
          variants[variant],
          sizes[size],
          isLoading && "cursor-wait opacity-70",
          className
        )}
        disabled={!asChild && (isLoading || props.disabled)}
        aria-busy={isLoading}
        aria-disabled={!asChild && (isLoading || props.disabled)}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </Component>
    );
  }
);

Button.displayName = "Button";

export default Button;
