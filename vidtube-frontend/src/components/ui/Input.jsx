export default function Input({
  label,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-textSecondary">
          {label}
        </label>
      )}
      <input
        className="block w-full rounded-md border border-zinc-700 bg-surface px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}


