import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Language {
  value: string;
  label: string;
  defaultCode: string;
}

interface LanguageCategories {
  [category: string]: Language[];
}

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  languageCategories: LanguageCategories;
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  languageCategories,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current language label
  const getCurrentLanguageLabel = () => {
    for (const category of Object.values(languageCategories)) {
      const lang = category.find(l => l.value === selectedLanguage);
      if (lang) return lang.label;
    }
    return 'Select Language';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageSelect = (language: string) => {
    onLanguageChange(language);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
      >
        <span className="truncate">{getCurrentLanguageLabel()}</span>
        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Mobile Modal / Desktop Dropdown */}
      {isOpen && (
        <>
          {/* Mobile Modal Overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 sm:hidden" onClick={() => setIsOpen(false)} />
          
          {/* Mobile Modal / Desktop Dropdown */}
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 max-h-[80vh] sm:absolute sm:top-full sm:left-0 sm:mt-1 sm:inset-x-auto sm:translate-y-0 sm:w-auto sm:min-w-[480px] sm:max-w-[600px] sm:shadow-lg sm:border sm:border-gray-300 sm:dark:border-gray-600">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600 sm:hidden">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Language</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <span className="text-xl text-gray-500 dark:text-gray-400">×</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 p-4 sm:p-2 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
            {Object.entries(languageCategories).map(([categoryName, languages]) => (
              <div key={categoryName} className="p-2">
                {/* Category Header */}
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 px-2 sm:mb-2 border-b border-gray-200 dark:border-gray-600 pb-2 sm:border-b-0 sm:pb-0">
                  {categoryName}
                </div>
                
                {/* Languages in Category */}
                <div className="space-y-1 sm:space-y-1">
                  {languages.map((language) => (
                    <button
                      key={language.value}
                      onClick={() => handleLanguageSelect(language.value)}
                      className={`w-full text-left px-3 py-2.5 sm:px-2 sm:py-1.5 text-sm rounded transition-colors flex items-center justify-between group touch-manipulation ${
                        selectedLanguage === language.value
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600'
                      }`}
                    >
                      <span className="truncate">{language.label}</span>
                      {selectedLanguage === language.value && (
                        <Check className="w-4 h-4 sm:w-3 sm:h-3 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
            {/* Footer with case tabs (visual element) - Responsive */}
            <div className="border-t border-gray-200 dark:border-gray-600 px-3 py-2 sm:px-4 sm:py-2 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg">
              <div className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-4 text-xs text-gray-500 dark:text-gray-400 overflow-x-auto">
                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded whitespace-nowrap">Case 1</span>
                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded whitespace-nowrap">Case 2</span>
                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded whitespace-nowrap">Case 3</span>
                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded whitespace-nowrap hidden sm:inline">Case 4</span>
                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded whitespace-nowrap hidden sm:inline">Case 5</span>
                <button className="px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors touch-manipulation">
                  +
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
