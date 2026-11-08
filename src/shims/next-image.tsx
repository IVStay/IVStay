import React from 'react';

const NextImage = ({ src, alt, fill, className, width, height, ...props }: any) => {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      style={fill ? { width: '100%', height: '100%', objectFit: 'cover' } : undefined}
      {...props}
    />
  );
};

export default NextImage;
