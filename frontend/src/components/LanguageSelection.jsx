import React from 'react';
import { Globe, ArrowRight } from 'lucide-react';

const LanguageSelection = ({ onLanguageSelect }) => {
  const languages = [
    { 
      code: 'en', 
      name: 'English', 
      flag: '🇺🇸',
      greeting: 'Welcome to Hospital Registration'
    },
    { 
      code: 'zh', 
      name: '中文', 
      flag: '🇨🇳',
      greeting: '欢迎来到医院登记处'
    }
  ];

  return (
    <div className="h-auto bg-gradient-to-br from-blue-50 to-indigo-100 flex items-start justify-center pt-12 pb-12 px-6">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <Globe className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Select Language</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">选择语言</h2>
          <p className="text-gray-600">Choose your preferred language</p>
          <p className="text-gray-600">选择您的首选语言</p>
        </div>

        <div className="space-y-4">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => onLanguageSelect(lang.code)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-3xl">{lang.flag}</span>
                  <div className="text-left">
                    <p className="text-lg font-semibold text-gray-900">{lang.name}</p>
                    <p className="text-sm text-gray-600">{lang.greeting}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSelection;