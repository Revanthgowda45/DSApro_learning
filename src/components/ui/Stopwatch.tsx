import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';

interface StopwatchProps {
  onTimeUpdate?: (timeInSeconds: number) => void;
  autoStart?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Stopwatch({ 
  onTimeUpdate, 
  autoStart = false, 
  className = '',
  size = 'md'
}: StopwatchProps) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => {
          const newTime = prevTime + 1;
          onTimeUpdate?.(newTime);
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onTimeUpdate]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    onTimeUpdate?.(0);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'text-xs',
          time: 'text-sm font-mono',
          button: 'p-1',
          icon: 'h-3 w-3'
        };
      case 'lg':
        return {
          container: 'text-base',
          time: 'text-xl font-mono',
          button: 'p-3',
          icon: 'h-5 w-5'
        };
      default: // md
        return {
          container: 'text-sm',
          time: 'text-lg font-mono',
          button: 'p-2',
          icon: 'h-4 w-4'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`flex items-center space-x-2 ${sizeClasses.container} ${className}`}>
      <div className="flex items-center space-x-1">
        <Timer className={`${sizeClasses.icon} text-gray-500 dark:text-gray-400`} />
        <span className={`${sizeClasses.time} text-gray-900 dark:text-gray-100 tabular-nums`}>
          {formatTime(time)}
        </span>
      </div>
      
      <div className="flex items-center space-x-1">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className={`${sizeClasses.button} text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
            title="Start timer"
          >
            <Play className={`${sizeClasses.icon} fill-current`} />
          </button>
        ) : (
          <button
            onClick={handlePause}
            className={`${sizeClasses.button} text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
            title="Pause timer"
          >
            <Pause className={sizeClasses.icon} />
          </button>
        )}
        
        <button
          onClick={handleReset}
          className={`${sizeClasses.button} text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
          title="Reset timer"
        >
          <RotateCcw className={sizeClasses.icon} />
        </button>
      </div>
    </div>
  );
}
