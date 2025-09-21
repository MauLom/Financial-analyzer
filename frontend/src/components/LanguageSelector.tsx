import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center space-x-2">
        <Languages className="h-5 w-5 text-gray-500" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
          className="block appearance-none bg-transparent border-none text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          title={t('language.select')}
        >
          <option value="en">{t('language.english')}</option>
          <option value="es">{t('language.spanish')}</option>
        </select>
      </div>
    </div>
  );
};

export default LanguageSelector;