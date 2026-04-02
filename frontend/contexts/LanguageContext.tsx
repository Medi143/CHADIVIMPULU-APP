import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const translations: Record<string, Record<string, string>> = {
  // Navigation
  'nav.home': JSON.stringify({ en: 'Home', te: 'హోమ్' }),
  'nav.gifts': JSON.stringify({ en: 'Gifts', te: 'బహుమతులు' }),
  'nav.reports': JSON.stringify({ en: 'Reports', te: 'నివేదికలు' }),
  'nav.events': JSON.stringify({ en: 'Events', te: 'ఈవెంట్లు' }),
  'nav.settings': JSON.stringify({ en: 'Settings', te: 'సెట్టింగ్స్' }),
  // Settings
  'settings.account': JSON.stringify({ en: 'Account', te: 'ఖాతా' }),
  'settings.editProfile': JSON.stringify({ en: 'Edit Profile', te: 'ప్రొఫైల్ మార్చు' }),
  'settings.privacy': JSON.stringify({ en: 'Privacy & Security', te: 'గోప్యత & భద్రత' }),
  'settings.events': JSON.stringify({ en: 'Events', te: 'ఈవెంట్లు' }),
  'settings.manageEvents': JSON.stringify({ en: 'Manage Events', te: 'ఈవెంట్లు నిర్వహించు' }),
  'settings.manageStaff': JSON.stringify({ en: 'Manage Staff', te: 'సిబ్బంది నిర్వహించు' }),
  'settings.eventQR': JSON.stringify({ en: 'Event QR Code', te: 'ఈవెంట్ QR కోడ్' }),
  'settings.app': JSON.stringify({ en: 'App', te: 'యాప్' }),
  'settings.notifications': JSON.stringify({ en: 'Notifications', te: 'నోటిఫికేషన్లు' }),
  'settings.language': JSON.stringify({ en: 'Language', te: 'భాష' }),
  'settings.theme': JSON.stringify({ en: 'Theme', te: 'థీమ్' }),
  'settings.support': JSON.stringify({ en: 'Support', te: 'సహాయం' }),
  'settings.help': JSON.stringify({ en: 'Help & Support', te: 'సహాయం & మద్దతు' }),
  'settings.about': JSON.stringify({ en: 'About', te: 'గురించి' }),
  'settings.logout': JSON.stringify({ en: 'Logout', te: 'లాగ్ అవుట్' }),
  // Common
  'common.save': JSON.stringify({ en: 'Save', te: 'సేవ్ చేయి' }),
  'common.cancel': JSON.stringify({ en: 'Cancel', te: 'రద్దు' }),
  'common.delete': JSON.stringify({ en: 'Delete', te: 'తొలగించు' }),
  'common.back': JSON.stringify({ en: 'Back', te: 'వెనుకకు' }),
  'common.version': JSON.stringify({ en: 'Version', te: 'వెర్షన్' }),
  // Gift Entry
  'gift.guestName': JSON.stringify({ en: 'Guest Name*', te: 'అతిథి పేరు*' }),
  'gift.amount': JSON.stringify({ en: 'Amount', te: 'మొత్తం' }),
  'gift.side': JSON.stringify({ en: 'Side', te: 'వైపు' }),
  'gift.bride': JSON.stringify({ en: 'Bride', te: 'పెళ్లికూతురు' }),
  'gift.groom': JSON.stringify({ en: 'Groom', te: 'పెళ్లికొడుకు' }),
  'gift.cash': JSON.stringify({ en: 'Cash', te: 'నగదు' }),
  'gift.upi': JSON.stringify({ en: 'UPI', te: 'UPI' }),
  'gift.submit': JSON.stringify({ en: 'Save Gift Entry', te: 'బహుమతి నమోదు సేవ్ చేయి' }),
  // Reports
  'reports.totalGuests': JSON.stringify({ en: 'Total Guests', te: 'మొత్తం అతిథులు' }),
  'reports.totalCash': JSON.stringify({ en: 'Total Cash', te: 'మొత్తం నగదు' }),
  'reports.totalItems': JSON.stringify({ en: 'Total Items', te: 'మొత్తం వస్తువులు' }),
  'reports.upiPayments': JSON.stringify({ en: 'UPI Payments', te: 'UPI చెల్లింపులు' }),
  'reports.brideSide': JSON.stringify({ en: "Bride's Side", te: 'పెళ్లికూతురు వైపు' }),
  'reports.groomSide': JSON.stringify({ en: "Groom's Side", te: 'పెళ్లికొడుకు వైపు' }),
  'reports.exportPDF': JSON.stringify({ en: 'Export PDF', te: 'PDF ఎగుమతి' }),
  'reports.exportExcel': JSON.stringify({ en: 'Export Excel', te: 'Excel ఎగుమతి' }),
  // Home
  'home.welcome': JSON.stringify({ en: 'Welcome', te: 'స్వాగతం' }),
  'home.activeEvent': JSON.stringify({ en: 'Active Event', te: 'యాక్టివ్ ఈవెంట్' }),
  'home.recordGift': JSON.stringify({ en: 'Record Gift', te: 'బహుమతి నమోదు' }),
  // Notifications
  'notif.eventUpdates': JSON.stringify({ en: 'Event Updates', te: 'ఈవెంట్ అప్‌డేట్లు' }),
  'notif.giftAlerts': JSON.stringify({ en: 'New Gift Entry Alerts', te: 'కొత్త బహుమతి హెచ్చరికలు' }),
  'notif.payments': JSON.stringify({ en: 'Payment Notifications', te: 'చెల్లింపు నోటిఫికేషన్లు' }),
  // Theme
  'theme.light': JSON.stringify({ en: 'Light Mode', te: 'లైట్ మోడ్' }),
  'theme.dark': JSON.stringify({ en: 'Dark Mode', te: 'డార్క్ మోడ్' }),
  // Language
  'lang.english': JSON.stringify({ en: 'English', te: 'ఆంగ్లం' }),
  'lang.telugu': JSON.stringify({ en: 'Telugu', te: 'తెలుగు' }),
};

type Lang = 'en' | 'te';

interface LanguageContextType {
  language: Lang;
  setLanguage: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLang] = useState<Lang>('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem('app_language');
      if (saved === 'te') setLang('te');
    } catch (e) {
      console.error('Error loading language:', e);
    }
  };

  const setLanguage = async (lang: Lang) => {
    setLang(lang);
    await AsyncStorage.setItem('app_language', lang);
  };

  const t = (key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    try {
      const parsed = JSON.parse(entry);
      return parsed[language] || parsed['en'] || key;
    } catch {
      return key;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
