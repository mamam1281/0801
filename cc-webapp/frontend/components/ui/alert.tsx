import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  className?: string;
}

export const Alert = ({
  children,
  className = '',
  ...props
}: AlertProps & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={`p-4 rounded-lg border bg-background ${className}`}
      role="alert"
      {...props}
    >
      {children}
    </div>
  );
};

export const AlertDescription = ({
  children,
  className = '',
  ...props
}: AlertProps & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`text-sm ${className}`} {...props}>
      {children}
    </div>
  );
};
