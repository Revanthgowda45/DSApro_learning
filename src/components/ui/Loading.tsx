interface LoadingProps {
  text?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Enhanced Loading component for smooth authentication transitions
 * Based on CityFixApp's loading patterns
 */
export const Loading = ({ 
  text = "Loading...", 
  fullScreen = false, 
  size = 'md' 
}: LoadingProps) => {
  const sizeClasses = {
    sm: 'h-8 w-8 border-2',
    md: 'h-12 w-12 border-4', 
    lg: 'h-16 w-16 border-4'
  };

  const containerClasses = fullScreen 
    ? "min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300"
    : "flex items-center justify-center p-8";

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-4">
        <div className={`animate-spin rounded-full border-gray-300 dark:border-gray-600 border-t-blue-500 dark:border-t-blue-400 ${sizeClasses[size]}`}></div>
        <p className="text-gray-600 dark:text-gray-400 text-sm animate-pulse">{text}</p>
      </div>
    </div>
  );
};

export default Loading;
