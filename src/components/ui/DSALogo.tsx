interface DSALogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function DSALogo({ className = '', size = 'md' }: DSALogoProps) {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <svg
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Circle */}
      <circle
        cx="16"
        cy="16"
        r="15"
        fill="url(#gradient1)"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.1"
      />
      
      {/* Tree Structure (representing data structures) */}
      <g stroke="currentColor" strokeWidth="1.5" fill="none">
        {/* Root node */}
        <circle cx="16" cy="8" r="2" fill="currentColor" />
        
        {/* Level 1 nodes */}
        <circle cx="10" cy="14" r="1.5" fill="currentColor" />
        <circle cx="22" cy="14" r="1.5" fill="currentColor" />
        
        {/* Level 2 nodes */}
        <circle cx="7" cy="20" r="1.2" fill="currentColor" />
        <circle cx="13" cy="20" r="1.2" fill="currentColor" />
        <circle cx="19" cy="20" r="1.2" fill="currentColor" />
        <circle cx="25" cy="20" r="1.2" fill="currentColor" />
        
        {/* Connecting lines */}
        <line x1="16" y1="10" x2="10" y2="12" />
        <line x1="16" y1="10" x2="22" y2="12" />
        <line x1="10" y1="15.5" x2="7" y2="18.8" />
        <line x1="10" y1="15.5" x2="13" y2="18.8" />
        <line x1="22" y1="15.5" x2="19" y2="18.8" />
        <line x1="22" y1="15.5" x2="25" y2="18.8" />
      </g>
      
      {/* Algorithm flow arrows */}
      <g stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.7">
        <path d="M4 26 L6 24 L4 22" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M28 26 L26 24 L28 22" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>
    </svg>
  );
}
