import { Maximize, Minimize } from 'lucide-react';
import { useFullscreen } from '../../hooks/useFullscreen';

interface FullscreenButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
}

export default function FullscreenButton({ 
  className = '', 
  size = 'md',
  variant = 'ghost'
}: FullscreenButtonProps) {
  const { isFullscreen, isSupported, toggleFullscreen } = useFullscreen();

  // Don't render if fullscreen is not supported
  if (!isSupported) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-8 w-8 p-1.5',
    md: 'h-9 w-9 p-2',
    lg: 'h-10 w-10 p-2.5'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const variantClasses = {
    default: 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100',
    outline: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
  };

  return (
    <button
      onClick={toggleFullscreen}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-lg
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
        active:scale-95
        group
        ${className}
      `}
      title={isFullscreen ? 'Exit Fullscreen (ESC)' : 'Enter Fullscreen (F11)'}
      aria-label={isFullscreen ? 'Exit fullscreen mode' : 'Enter fullscreen mode'}
    >
      {isFullscreen ? (
        <Minimize className={`${iconSizes[size]} transition-transform group-hover:scale-110`} />
      ) : (
        <Maximize className={`${iconSizes[size]} transition-transform group-hover:scale-110`} />
      )}
    </button>
  );
}
