import clsx from 'clsx';

const base =
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variants = {
  primary: 'bg-primary text-white hover:bg-red-600',
  secondary: 'bg-secondary text-white hover:bg-emerald-700',
  outline:
    'border border-zinc-700 text-text hover:bg-zinc-800 bg-transparent',
};

export default function Button({
  children,
  variant = 'primary',
  className,
  isLoading = false,
  ...props
}) {
  return (
    <button
      className={clsx(
        base,
        variants[variant],
        isLoading && 'cursor-wait',
        'px-4 py-2',
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-transparent" />
      )}
      {children}
    </button>
  );
}


