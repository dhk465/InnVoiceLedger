// src/contexts/LocaleContext.jsx
import React, { createContext, useState, useContext, useMemo } from 'react';
// Import date-fns locales
import enUS from 'date-fns/locale/en-US';
import cs from 'date-fns/locale/cs';
import ko from 'date-fns/locale/ko';

// Define supported locales map (key: language code, value: date-fns locale object)
const supportedLocales = {
    'en-US': { code: 'en-US', name: 'English (US)', dateFns: enUS },
    'cs-CZ': { code: 'cs-CZ', name: 'Čeština', dateFns: cs },
    'ko-KR': { code: 'ko-KR', name: '한국어', dateFns: ko },
};

// Helper to get browser default or fallback
const getDefaultLocaleCode = () => {
    const browserLang = navigator.language || navigator.userLanguage || 'en-US';
    // Try full match first (e.g., 'cs-CZ')
    if (supportedLocales[browserLang]) {
        return browserLang;
    }
    // Try matching just the language part (e.g., 'cs' from 'cs-CZ')
    const langPart = browserLang.split('-')[0];
    const found = Object.keys(supportedLocales).find(code => code.startsWith(langPart));
    return found || 'en-US'; // Fallback to en-US
};

// Create Context
const LocaleContext = createContext(null);

// Create Provider Component
export const LocaleProvider = ({ children }) => {
    const [currentLocaleCode, setCurrentLocaleCode] = useState(() => {
        // TODO: Load preferred locale from user settings/localStorage later
        return getDefaultLocaleCode();
    });

    // Memoize the context value to prevent unnecessary re-renders
    const value = useMemo(() => {
        const localeData = supportedLocales[currentLocaleCode];
        return {
            currentLocaleCode: localeData.code,
            currentDateFnsLocale: localeData.dateFns,
            supportedLocales: Object.values(supportedLocales).map(l => ({ code: l.code, name: l.name })), // List for dropdown
            changeLocale: (newLocaleCode) => {
                if (supportedLocales[newLocaleCode]) {
                    setCurrentLocaleCode(newLocaleCode);
                    // TODO: Save preference to user settings/localStorage later
                    console.log(`Locale changed to: ${newLocaleCode}`);
                } else {
                    console.warn(`Attempted to change to unsupported locale: ${newLocaleCode}`);
                }
            },
        };
    }, [currentLocaleCode]); // Recalculate only when locale code changes

    return (
        <LocaleContext.Provider value={value}>
            {children}
        </LocaleContext.Provider>
    );
};

// Custom hook to easily consume the context
export const useLocale = () => {
    const context = useContext(LocaleContext);
    if (context === undefined) {
        throw new Error('useLocale must be used within a LocaleProvider');
    }
    return context;
};