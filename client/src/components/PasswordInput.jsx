import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••",
  id,
  name = "password",
  autoComplete = "current-password",
  required = false,
  minLength,
  disabled = false,
  className = "",
  containerClassName = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`relative flex items-center ${containerClassName}`}>
      <input
        type={showPassword ? "text" : "password"}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        disabled={disabled}
        autoComplete={autoComplete}
        className={`w-full rounded-lg bg-surface-3 border border-line pl-3.5 pr-11 py-2.5 sm:py-2 text-base sm:text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        disabled={disabled}
        tabIndex={0}
        aria-label={showPassword ? "Hide password" : "Show password"}
        title={showPassword ? "Hide password" : "Show password"}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-muted hover:text-ink focus:text-ink focus:outline-none rounded-lg transition-colors touch-manipulation"
      >
        {showPassword ? (
          <EyeOff size={16} className="shrink-0" />
        ) : (
          <Eye size={16} className="shrink-0" />
        )}
      </button>
    </div>
  );
}
