import React, { createContext, useContext, useState, useEffect } from 'react';

// Define available languages
export type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation function that loads translations dynamically
const loadTranslations = async (language: Language) => {
  try {
    const translations = await import(`../locales/${language}.json`);
    return translations.default;
  } catch (error) {
    console.error(`Failed to load translations for language: ${language}`);
    // Fallback to English if language file doesn't exist
    const fallback = await import('../locales/en.json');
    return fallback.default;
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load saved language preference from localStorage
    const savedLanguage = localStorage.getItem('selectedLanguage') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    // Load translations when language changes
    const loadLanguageTranslations = async () => {
      const newTranslations = await loadTranslations(language);
      setTranslations(newTranslations);
    };
    
    loadLanguageTranslations();
    
    // Save language preference to localStorage
    localStorage.setItem('selectedLanguage', language);
  }, [language]);

  // Translation function
  const t = (key: string): string => {
    return translations[key] || key; // Return the key if translation not found
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};