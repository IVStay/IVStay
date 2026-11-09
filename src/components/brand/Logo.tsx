import React from 'react';

/**
 * The IvStay mark: an "I" and a "V" drawn as one weight of rounded stroke. The V's arms rise a
 * little higher than the I, like two hills either side of a path, and the whole thing sits on a
 * shared baseline. Colour comes from `currentColor`, so it works on light and dark backgrounds.
 */
export const LogoMark: React.FC<{ size?: number; className?: string; title?: string }> = ({
  size = 32,
  className,
  title,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth={3.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={title ? 'img' : undefined}
    aria-hidden={title ? undefined : true}
    aria-label={title}
  >
    <path d="M6.5 9.5v15" />
    <path d="M12.5 6.5l6.75 18L26 6.5" />
  </svg>
);

/** Mark + "ivstay" wordmark, as used in the header and footer. */
export const Logo: React.FC<{ className?: string; showWordmark?: boolean; size?: number }> = ({
  className = '',
  showWordmark = true,
  size = 30,
}) => (
  <span className={`inline-flex items-center gap-1.5 text-ivy ${className}`}>
    <LogoMark size={size} title={showWordmark ? undefined : 'IvStay'} />
    {showWordmark && (
      <span className="text-[22px] font-extrabold tracking-tightest leading-none lowercase">ivstay</span>
    )}
  </span>
);
