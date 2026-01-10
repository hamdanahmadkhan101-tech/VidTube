import { Check, X } from "lucide-react";

export default function PasswordStrength({ password = "" }) {
  const requirements = [
    {
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      label: "Contains uppercase letter (A-Z)",
      met: /[A-Z]/.test(password),
    },
    {
      label: "Contains lowercase letter (a-z)",
      met: /[a-z]/.test(password),
    },
    {
      label: "Contains number (0-9)",
      met: /[0-9]/.test(password),
    },
    {
      label: "Contains special character (!@#$%^&*)",
      // Use a simple negated alphanumeric check to avoid escape headaches
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const metCount = requirements.filter((req) => req.met).length;
  const strength =
    metCount === 0
      ? "none"
      : metCount <= 2
      ? "weak"
      : metCount <= 3
      ? "fair"
      : metCount <= 4
      ? "good"
      : "strong";

  const strengthColors = {
    none: "bg-gray-400",
    weak: "bg-red-500",
    fair: "bg-yellow-500",
    good: "bg-blue-500",
    strong: "bg-green-500",
  };

  const strengthLabels = {
    none: "No requirements met",
    weak: "Weak password",
    fair: "Fair password",
    good: "Good password",
    strong: "Strong password",
  };

  return (
    <div className="mt-3 space-y-3">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-textSecondary">Password strength:</span>
          <span
            className={`text-xs font-medium ${
              strength === "strong"
                ? "text-green-400"
                : strength === "good"
                ? "text-blue-400"
                : strength === "fair"
                ? "text-yellow-400"
                : strength === "weak"
                ? "text-red-400"
                : "text-gray-400"
            }`}
          >
            {strengthLabels[strength]}
          </span>
        </div>
        <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strengthColors[strength]}`}
            style={{ width: `${(metCount / requirements.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-2 p-3 bg-surface-light rounded-md border border-zinc-700">
        <p className="text-xs font-medium text-textSecondary">
          Password requirements:
        </p>
        <div className="space-y-2">
          {requirements.map((req, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              {req.met ? (
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : (
                <X className="h-4 w-4 text-red-500 flex-shrink-0" />
              )}
              <span
                className={req.met ? "text-green-400" : "text-textSecondary"}
              >
                {req.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
