/**
 * Base Skeleton component with animated dark-theme pulse
 */
export function Skeleton({ className = "", rounded = "rounded-lg", ...props }) {
  return (
    <div
      className={`animate-pulse bg-white/[0.08] ${rounded} ${className}`}
      {...props}
    />
  );
}

export default Skeleton;
