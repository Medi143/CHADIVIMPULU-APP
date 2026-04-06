import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Lang = 'en' | 'te';

const en: Record<string, string> = {
  // Nav
  'nav.home': 'Home',
  'nav.gifts': 'Gifts',
  'nav.reports': 'Reports',
  'nav.events': 'Events',
  'nav.settings': 'Settings',
  // Login
  'login.welcomeTo': 'Welcome to',
  'login.subtitle': 'Digital Wed Gift Registry',
  'login.info': 'Enter your mobile number to continue. No OTP required!',
  'login.phone': 'Mobile Number *',
  'login.phonePlaceholder': 'Enter your phone number',
  'login.name': 'Your Name *',
  'login.namePlaceholder': 'Enter your full name',
  'login.terms': 'I agree to the',
  'login.termsLink': 'Terms & Conditions',
  'login.continue': 'Continue',
  'login.loggingIn': 'Logging in...',
  'login.privacyNote': "Your information is stored securely. You'll stay logged in on this device.",
  // Home
  'home.noEvent': 'No Event Created',
  'home.noEventDesc': 'Create your first event to start tracking gifts',
  'home.createEvent': 'Create Event',
  'home.welcomeToThe': 'Welcome to the',
  'home.of': 'of',
  'home.digitalGifts': 'Digital Gifts - Chadivimpulu™ & More',
  'home.blessingsDesc': 'Share your blessings digitally! Your love and good wishes mean the world to us!',
  'home.step1': 'Enter your name and gift amount',
  'home.step2': 'Pay instantly via UPI (Google Pay, PhonePe, Paytm)',
  'home.step3': 'Your blessings will be cherished forever',
  'home.startGiftEntry': 'Start Gift Entry',
  // Event Types
  'event.wedding': 'Wedding',
  'event.housewarming': 'Housewarming',
  'event.engagement': 'Engagement',
  'event.babyshower': 'Baby Shower',
  'event.naming': 'Naming Ceremony',
  'event.birthday': 'Birthday',
  'event.sashtipoorthi': 'Sashtipoorthi',
  'event.halfsaree': 'Half Saree',
  'event.event': 'Event',
  // Gift Entry
  'giftEntry.title': 'Add Gift Entry',
  'giftEntry.guestName': 'Guest Name*',
  'giftEntry.guestNamePlaceholder': 'Enter guest full name',
  'giftEntry.area': 'Area',
  'giftEntry.areaPlaceholder': 'Enter area / city',
  'giftEntry.chadivimpulu': 'Chadivimpulu™',
  'giftEntry.cash': 'Cash',
  'giftEntry.item': 'Item',
  'giftEntry.amount': 'Amount *',
  'giftEntry.amountPlaceholder': 'Enter amount',
  'giftEntry.itemDesc': 'Item Description *',
  'giftEntry.itemPlaceholder': 'Enter gift item (e.g., Gold Chain, Dinner Set)',
  'giftEntry.familyHead': 'Family Head:',
  'giftEntry.upiPhone': 'UPI Phone:',
  'giftEntry.guestCount': 'Guest Count:',
  'giftEntry.qrCode': 'QR Code',
  'giftEntry.scanHint': 'Scan with any UPI app to pay',
  'giftEntry.saveCash': 'Save - Cash',
  'giftEntry.saveUPI': 'Save - UPI',
  'giftEntry.saveGiftItem': 'Save Gift Item',
  'giftEntry.giftRecorded': 'Gift Recorded!',
  'giftEntry.addAnother': 'Add Another',
  'giftEntry.done': 'Done',
  'giftEntry.payment': 'Payment',
  'giftEntry.typeGiftItem': 'Type: Gift Item',
  // Gifts Tab
  'gifts.search': 'Search by name or mobile',
  'gifts.noEvent': 'Please create an event first',
  'gifts.noEntries': 'No gift entries yet',
  'gifts.addGiftEntry': 'Add Gift Entry',
  'gifts.guestName': 'Guest Name *',
  'gifts.mobile': 'Mobile Number',
  'gifts.side': 'Side *',
  'gifts.giftType': 'Gift Type *',
  'gifts.amount': 'Amount *',
  'gifts.paymentMode': 'Payment Mode',
  'gifts.itemDesc': 'Item Description *',
  'gifts.notes': 'Notes',
  'gifts.addedBy': 'Added by',
  'gifts.bride': 'Bride',
  'gifts.groom': 'Groom',
  // Reports
  'reports.title': 'Reports',
  'reports.noEvent': 'Please create an event first',
  'reports.totalGuests': 'Total Guests',
  'reports.totalCash': 'Total Cash',
  'reports.totalItems': 'Total Items',
  'reports.upiPayments': 'UPI Payments',
  'reports.brideSide': "Bride's Side",
  'reports.groomSide': "Groom's Side",
  'reports.guests': 'guests',
  'reports.giftEntries': 'Gift Entries',
  'reports.insights': 'Insights',
  'reports.topContributors': 'Top Contributors',
  'reports.statistics': 'Statistics',
  'reports.cashGifts': 'Cash Gifts',
  'reports.itemGifts': 'Item Gifts',
  'reports.cashPayments': 'Cash Payments',
  'reports.exportPDF': 'Export PDF',
  'reports.exportExcel': 'Export Excel',
  'reports.noInsights': 'No insights available yet',
  'reports.noContributors': 'No contributors yet',
  'reports.noData': 'No gift entries yet',
  'reports.side': 'side',
  'reports.sno': 'S.No',
  'reports.name': 'Name',
  'reports.areaCol': 'Area',
  'reports.amountCol': 'Amount',
  'reports.mode': 'Mode',
  // Settings
  'settings.account': 'Account',
  'settings.editProfile': 'Edit Profile',
  'settings.privacy': 'Privacy & Security',
  'settings.events': 'Events',
  'settings.manageEvents': 'Manage Events',
  'settings.manageStaff': 'Manage Staff',
  'settings.eventQR': 'Event QR Code',
  'settings.app': 'App',
  'settings.notifications': 'Notifications',
  'settings.language': 'Language',
  'settings.theme': 'Theme',
  'settings.support': 'Support',
  'settings.help': 'Help & Support',
  'settings.about': 'About',
  'settings.logout': 'Logout',
  'settings.logoutConfirm': 'Are you sure you want to logout?',
  'settings.version': 'Version',
  // Edit Profile
  'editProfile.title': 'Edit Profile',
  'editProfile.fullName': 'Full Name',
  'editProfile.phone': 'Phone Number',
  'editProfile.email': 'Email Address',
  'editProfile.emailPlaceholder': 'Enter email address (optional)',
  'editProfile.saveChanges': 'Save Changes',
  'editProfile.tapToChange': 'Tap to change photo',
  'editProfile.success': 'Profile updated successfully',
  // Common
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.back': 'Back',
  'common.ok': 'OK',
  'common.error': 'Error',
  'common.success': 'Success',
  'common.required': 'Required',
  'common.loading': 'Loading...',
  'common.na': 'N/A',
};

const te: Record<string, string> = {
  // Nav
  'nav.home': 'హోమ్',
  'nav.gifts': 'బహుమతులు',
  'nav.reports': 'నివేదికలు',
  'nav.events': 'ఈవెంట్లు',
  'nav.settings': 'సెట్టింగ్స్',
  // Login
  'login.welcomeTo': 'స్వాగతం',
  'login.subtitle': 'డిజిటల్ వెడ్ గిఫ్ట్ రిజిస్ట్రీ',
  'login.info': 'కొనసాగించడానికి మీ మొబైల్ నంబర్ నమోదు చేయండి. OTP అవసరం లేదు!',
  'login.phone': 'మొబైల్ నంబర్ *',
  'login.phonePlaceholder': 'మీ ఫోన్ నంబర్ నమోదు చేయండి',
  'login.name': 'మీ పేరు *',
  'login.namePlaceholder': 'మీ పూర్తి పేరు నమోదు చేయండి',
  'login.terms': 'నేను అంగీకరిస్తున్నాను',
  'login.termsLink': 'నిబంధనలు & షరతులు',
  'login.continue': 'కొనసాగించు',
  'login.loggingIn': 'లాగిన్ అవుతోంది...',
  'login.privacyNote': 'మీ సమాచారం సురక్షితంగా నిల్వ చేయబడుతుంది. మీరు ఈ పరికరంలో లాగిన్ అయి ఉంటారు.',
  // Home
  'home.noEvent': 'ఈవెంట్ సృష్టించబడలేదు',
  'home.noEventDesc': 'బహుమతులను ట్రాక్ చేయడానికి మీ మొదటి ఈవెంట్‌ను సృష్టించండి',
  'home.createEvent': 'ఈవెంట్ సృష్టించు',
  'home.welcomeToThe': 'స్వాగతం',
  'home.of': 'యొక్క',
  'home.digitalGifts': 'డిజిటల్ గిఫ్ట్స్ - చాదివింపులు & మరిన్ని',
  'home.blessingsDesc': 'మీ ఆశీర్వాదాలను డిజిటల్‌గా పంచుకోండి! మీ ప్రేమ మరియు శుభాకాంక్షలు మాకు విలువైనవి!',
  'home.step1': 'మీ పేరు మరియు బహుమతి మొత్తాన్ని నమోదు చేయండి',
  'home.step2': 'UPI ద్వారా తక్షణ చెల్లింపు (Google Pay, PhonePe, Paytm)',
  'home.step3': 'మీ ఆశీర్వాదాలు ఎల్లప్పుడూ గుర్తుంచబడతాయి',
  'home.startGiftEntry': 'గిఫ్ట్ ఎంట్రీ ప్రారంభించు',
  // Event Types
  'event.wedding': 'పెళ్ళి',
  'event.housewarming': 'గృహప్రవేశం',
  'event.engagement': 'నిశ్చితార్థం',
  'event.babyshower': 'బేబీ షవర్',
  'event.naming': 'నామకరణం',
  'event.birthday': 'పుట్టినరోజు',
  'event.sashtipoorthi': 'షష్టిపూర్తి',
  'event.halfsaree': 'హాఫ్ సారీ',
  'event.event': 'ఈవెంట్',
  // Gift Entry
  'giftEntry.title': 'గిఫ్ట్ ఎంట్రీ జోడించు',
  'giftEntry.guestName': 'అతిథి పేరు*',
  'giftEntry.guestNamePlaceholder': 'అతిథి పూర్తి పేరు నమోదు చేయండి',
  'giftEntry.area': 'ప్రాంతం',
  'giftEntry.areaPlaceholder': 'ప్రాంతం / నగరం నమోదు చేయండి',
  'giftEntry.chadivimpulu': 'చాదివింపులు',
  'giftEntry.cash': 'నగదు',
  'giftEntry.item': 'వస్తువు',
  'giftEntry.amount': 'మొత్తం *',
  'giftEntry.amountPlaceholder': 'మొత్తం నమోదు చేయండి',
  'giftEntry.itemDesc': 'వస్తువు వివరణ *',
  'giftEntry.itemPlaceholder': 'గిఫ్ట్ వస్తువు నమోదు చేయండి (ఉదా., గోల్డ్ చైన్, డిన్నర్ సెట్)',
  'giftEntry.familyHead': 'కుటుంబ పెద్ద:',
  'giftEntry.upiPhone': 'UPI ఫోన్:',
  'giftEntry.guestCount': 'అతిథుల సంఖ్య:',
  'giftEntry.qrCode': 'QR కోడ్',
  'giftEntry.scanHint': 'చెల్లించడానికి ఏదైనా UPI యాప్‌తో స్కాన్ చేయండి',
  'giftEntry.saveCash': 'సేవ్ - నగదు',
  'giftEntry.saveUPI': 'సేవ్ - UPI',
  'giftEntry.saveGiftItem': 'గిఫ్ట్ వస్తువు సేవ్ చేయి',
  'giftEntry.giftRecorded': 'గిఫ్ట్ నమోదైంది!',
  'giftEntry.addAnother': 'మరొకటి జోడించు',
  'giftEntry.done': 'పూర్తి',
  'giftEntry.payment': 'చెల్లింపు',
  'giftEntry.typeGiftItem': 'రకం: గిఫ్ట్ వస్తువు',
  // Gifts Tab
  'gifts.search': 'పేరు లేదా మొబైల్ ద్వారా వెతకండి',
  'gifts.noEvent': 'దయచేసి ముందుగా ఈవెంట్ సృష్టించండి',
  'gifts.noEntries': 'ఇంకా గిఫ్ట్ ఎంట్రీలు లేవు',
  'gifts.addGiftEntry': 'గిఫ్ట్ ఎంట్రీ జోడించు',
  'gifts.guestName': 'అతిథి పేరు *',
  'gifts.mobile': 'మొబైల్ నంబర్',
  'gifts.side': 'వైపు *',
  'gifts.giftType': 'గిఫ్ట్ రకం *',
  'gifts.amount': 'మొత్తం *',
  'gifts.paymentMode': 'చెల్లింపు విధానం',
  'gifts.itemDesc': 'వస్తువు వివరణ *',
  'gifts.notes': 'నోట్స్',
  'gifts.addedBy': 'జోడించినవారు',
  'gifts.bride': 'పెళ్ళికూతురు',
  'gifts.groom': 'పెళ్ళికొడుకు',
  // Reports
  'reports.title': 'నివేదికలు',
  'reports.noEvent': 'దయచేసి ముందుగా ఈవెంట్ సృష్టించండి',
  'reports.totalGuests': 'మొత్తం అతిథులు',
  'reports.totalCash': 'మొత్తం నగదు',
  'reports.totalItems': 'మొత్తం వస్తువులు',
  'reports.upiPayments': 'UPI చెల్లింపులు',
  'reports.brideSide': 'పెళ్ళికూతురు వైపు',
  'reports.groomSide': 'పెళ్ళికొడుకు వైపు',
  'reports.guests': 'అతిథులు',
  'reports.giftEntries': 'గిఫ్ట్ ఎంట్రీలు',
  'reports.insights': 'ఇన్‌సైట్స్',
  'reports.topContributors': 'అగ్ర దాతలు',
  'reports.statistics': 'గణాంకాలు',
  'reports.cashGifts': 'నగదు బహుమతులు',
  'reports.itemGifts': 'వస్తువు బహుమతులు',
  'reports.cashPayments': 'నగదు చెల్లింపులు',
  'reports.exportPDF': 'PDF ఎగుమతి',
  'reports.exportExcel': 'Excel ఎగుమతి',
  'reports.noInsights': 'ఇంకా ఇన్‌సైట్స్ అందుబాటులో లేవు',
  'reports.noContributors': 'ఇంకా దాతలు లేరు',
  'reports.noData': 'ఇంకా గిఫ్ట్ ఎంట్రీలు లేవు',
  'reports.side': 'వైపు',
  'reports.sno': 'క్ర.సం',
  'reports.name': 'పేరు',
  'reports.areaCol': 'ప్రాంతం',
  'reports.amountCol': 'మొత్తం',
  'reports.mode': 'విధానం',
  // Settings
  'settings.account': 'ఖాతా',
  'settings.editProfile': 'ప్రొఫైల్ మార్చు',
  'settings.privacy': 'గోప్యత & భద్రత',
  'settings.events': 'ఈవెంట్లు',
  'settings.manageEvents': 'ఈవెంట్లు నిర్వహించు',
  'settings.manageStaff': 'సిబ్బంది నిర్వహించు',
  'settings.eventQR': 'ఈవెంట్ QR కోడ్',
  'settings.app': 'యాప్',
  'settings.notifications': 'నోటిఫికేషన్లు',
  'settings.language': 'భాష',
  'settings.theme': 'థీమ్',
  'settings.support': 'సహాయం',
  'settings.help': 'సహాయం & మద్దతు',
  'settings.about': 'గురించి',
  'settings.logout': 'లాగ్ అవుట్',
  'settings.logoutConfirm': 'మీరు ఖచ్చితంగా లాగ్ అవుట్ చేయాలనుకుంటున్నారా?',
  'settings.version': 'వెర్షన్',
  // Edit Profile
  'editProfile.title': 'ప్రొఫైల్ మార్చు',
  'editProfile.fullName': 'పూర్తి పేరు',
  'editProfile.phone': 'ఫోన్ నంబర్',
  'editProfile.email': 'ఇమెయిల్ చిరునామా',
  'editProfile.emailPlaceholder': 'ఇమెయిల్ చిరునామా నమోదు చేయండి (ఐచ్ఛికం)',
  'editProfile.saveChanges': 'మార్పులు సేవ్ చేయి',
  'editProfile.tapToChange': 'ఫోటో మార్చడానికి నొక్కండి',
  'editProfile.success': 'ప్రొఫైల్ విజయవంతంగా అప్‌డేట్ చేయబడింది',
  // Common
  'common.save': 'సేవ్ చేయి',
  'common.cancel': 'రద్దు',
  'common.delete': 'తొలగించు',
  'common.back': 'వెనుకకు',
  'common.ok': 'సరే',
  'common.error': 'లోపం',
  'common.success': 'విజయం',
  'common.required': 'అవసరం',
  'common.loading': 'లోడ్ అవుతోంది...',
  'common.na': 'N/A',
};

const allTranslations: Record<Lang, Record<string, string>> = { en, te };

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
    return allTranslations[language]?.[key] || allTranslations['en']?.[key] || key;
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
