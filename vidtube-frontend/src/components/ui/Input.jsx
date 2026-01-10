import { forwardRef } from "react";
import clsx from "clsx";

const Input = forwardRef(
  ({ label, error, className = "", required, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-textSecondary">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            "block w-full rounded-md border bg-surface px-3 py-2 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
            error ? "border-red-500" : "border-zinc-700",
            className
          )}
          required={required}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${props.id || props.name}-error` : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${props.id || props.name || 'input'}-error`}
            className="text-xs text-red-500"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
