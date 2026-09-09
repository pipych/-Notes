import React from 'react';

export interface MaterialIconProps {
  name: string;
  filled?: boolean;
  size?: number | string;
  weight?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const MaterialIcon: React.FC<MaterialIconProps> = ({
  name,
  filled = false,
  size = 24,
  weight = 400,
  className = '',
  style,
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;
  return (
    <span
      className={`material-symbols-rounded leading-none select-none flex-shrink-0 ${filled ? 'filled' : ''} ${className}`}
      style={{
        fontSize: pixelSize,
        width: pixelSize,
        height: pixelSize,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${typeof size === 'number' ? size : 24}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
};
