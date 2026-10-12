import React from 'react';

interface PorzuuLogoProps {
  className?: string;
  size?: number | string;
}

export const PorzuuLogo: React.FC<PorzuuLogoProps> = ({
  className = 'w-9 h-9',
  size
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="none"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Porzuu Logo"
      role="img"
    >
      {/* Outer Black Sticker Border */}
      <path
        d="M 256 54
           L 198 142
           L 124 96
           C 112 145 102 195 106 236
           C 107 245 110 252 112 256
           C 94 280 82 312 82 344
           C 82 416 160 464 256 464
           C 352 464 430 416 430 344
           C 430 312 418 280 400 256
           C 402 252 405 245 406 236
           C 410 195 400 145 388 96
           L 314 142
           Z"
        fill="#000000"
        stroke="#000000"
        strokeWidth="50"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Middle White Sticker Contour */}
      <path
        d="M 256 54
           L 198 142
           L 124 96
           C 112 145 102 195 106 236
           C 107 245 110 252 112 256
           C 94 280 82 312 82 344
           C 82 416 160 464 256 464
           C 352 464 430 416 430 344
           C 430 312 418 280 400 256
           C 402 252 405 245 406 236
           C 410 195 400 145 388 96
           L 314 142
           Z"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="32"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Inner Berry Pink Mascot Body */}
      <path
        d="M 256 54
           L 198 142
           L 124 96
           C 112 145 102 195 106 236
           C 107 245 110 252 112 256
           C 94 280 82 312 82 344
           C 82 416 160 464 256 464
           C 352 464 430 416 430 344
           C 430 312 418 280 400 256
           C 402 252 405 245 406 236
           C 410 195 400 145 388 96
           L 314 142
           Z"
        fill="#DC2865"
      />

      {/* White Vertical Oval Eyes */}
      <ellipse cx="206" cy="318" rx="21" ry="52" fill="#FFFFFF" />
      <ellipse cx="306" cy="318" rx="21" ry="52" fill="#FFFFFF" />
    </svg>
  );
};
