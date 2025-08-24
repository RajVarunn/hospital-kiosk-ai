import React from 'react';
import { Globe } from 'lucide-react';

const LanguageSelector = ({ currentLanguage, onLanguageChange }) => {
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ];

  return (
    <div className="flex items-center space-x-2 bg-white rounded-lg shadow-sm p-2">
      <Globe className="w-4 h-4 text-gray-600" />
      <select
        value={currentLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="bg-transparent border-none outline-none text-sm font-medium"
      >
        {languages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;