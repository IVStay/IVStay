import React from 'react';
import { Link } from 'react-router-dom';

const NextLink = ({ href, children, className, ...props }: any) => {
  return (
    <Link to={href} className={className} {...props}>
      {children}
    </Link>
  );
};

export default NextLink;
