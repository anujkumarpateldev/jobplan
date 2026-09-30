export default function Logo({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="tu-grad" x1="0" y1="40" x2="40" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="tu-arrow" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.85)" />
        </linearGradient>
      </defs>

      {/* Background rounded square */}
      <rect width="40" height="40" rx="9" fill="url(#tu-grad)" />

      {/* Upward arrow — arrowhead */}
      <path d="M20 7 L29 21 H23 V33 H17 V21 H11 Z" fill="white" opacity="0.97" />

      {/* Small horizontal accent bar below arrow (speed lines) */}
      <rect x="14" y="35.5" width="5" height="1.5" rx="0.75" fill="white" opacity="0.45" />
      <rect x="21" y="35.5" width="5" height="1.5" rx="0.75" fill="white" opacity="0.45" />
    </svg>
  )
}
