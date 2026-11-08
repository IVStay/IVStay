import React from 'react';

// Minimal stand-in for next/image when the partner pages run inside the Vite app.
// Next-only props are dropped so they don't reach the DOM (React warns about them),
// and a caller's `style` is merged with the `fill` sizing instead of replacing it.
const NextImage = ({
  src,
  alt,
  fill,
  className,
  width,
  height,
  style,
  priority,
  quality,
  placeholder,
  blurDataURL,
  loader,
  unoptimized,
  ...props
}: any) => {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      style={fill ? { width: '100%', height: '100%', objectFit: 'cover', ...style } : style}
      {...props}
    />
  );
};

export default NextImage;
