import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  trend?: string;
}

// Helper functions to map light theme colors to dark theme variants
const getDarkBgColor = (lightBgColor: string): string => {
  const colorMap: { [key: string]: string } = {
    'bg-orange-100': 'dark:bg-orange-900/30',
    'bg-green-100': 'dark:bg-green-900/30',
    'bg-blue-100': 'dark:bg-blue-900/30',
    'bg-purple-100': 'dark:bg-purple-900/30',
    'bg-red-100': 'dark:bg-red-900/30',
    'bg-yellow-100': 'dark:bg-yellow-900/30',
    'bg-pink-100': 'dark:bg-pink-900/30',
    'bg-indigo-100': 'dark:bg-indigo-900/30',
  };
  return colorMap[lightBgColor] || 'dark:bg-gray-700';
};

const getDarkColor = (lightColor: string): string => {
  const colorMap: { [key: string]: string } = {
    'text-orange-600': 'dark:text-orange-400',
    'text-green-600': 'dark:text-green-400',
    'text-blue-600': 'dark:text-blue-400',
    'text-purple-600': 'dark:text-purple-400',
    'text-red-600': 'dark:text-red-400',
    'text-yellow-600': 'dark:text-yellow-400',
    'text-pink-600': 'dark:text-pink-400',
    'text-indigo-600': 'dark:text-indigo-400',
  };
  return colorMap[lightColor] || 'dark:text-gray-400';
};

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  bgColor, 
  trend 
}: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
          {trend && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{trend}</p>
          )}
        </div>
        <div className={`w-12 h-12 ${bgColor} ${getDarkBgColor(bgColor)} rounded-lg flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${color} ${getDarkColor(color)}`} />
        </div>
      </div>
    </div>
  );
}