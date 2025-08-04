import React from 'react';

export interface ModernCardProps {
  children: React.ReactNode;
  variant?: 'glass' | 'neon';
  className?: string;
  onClick?: () => void;
}

const ModernCard: React.FC<ModernCardProps> = ({
  children,
  variant = 'glass',
  className = '',
  onClick,
}) => {
  const variantClasses = {
    glass: 'modern-mesh-card hover-lift',
    neon: 'neon-glow',
  };

  return (
    <div
      className={`content-card ${variantClasses[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default ModernCard;
