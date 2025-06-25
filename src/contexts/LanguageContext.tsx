import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Simple translations for demo purposes
const translations = {
  en: {
    welcome: 'Welcome',
    services: 'Services',
    settings: 'Settings',
    notifications: 'Notifications',
    documents: 'Documents',
    home: 'Home',
    login: 'Login',
    nationalNumber: 'National Number',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    signIn: 'Sign In',
    logout: 'Logout',
    profile: 'Profile',
    editProfile: 'Edit Profile',
    language: 'Language',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
    applyForService: 'Apply for Service',
    selectService: 'Select Service',
    selectOffice: 'Select Office',
    paymentInfo: 'Payment Information',
    invoiceNumber: 'Invoice Number',
    confirm: 'Confirm',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    // Document translations
    edit: 'Edit',
    share: 'Share',
    copyLink: 'Copy Link',
    renew: 'Renew',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving',
    deleting: 'Deleting',
    linkCopied: 'Link Copied',
    linkCopiedDescription: 'Document link copied to clipboard',
    shareDocument: 'Share Document',
    checkOutThisDocument: 'Check out this document',
    documentShared: 'Document Shared',
    documentSharedDescription: 'Document shared successfully',
    documentDeleted: 'Document Deleted',
    documentDeletedDescription: 'The document has been deleted successfully',
    documentUpdated: 'Document Updated',
    documentUpdatedDescription: 'Document information has been updated successfully',
    deleteConfirmation: 'Delete Document',
    deleteConfirmationDescription: 'Are you sure you want to delete this document? This action cannot be undone.',
    error: 'Error',
    errorDeletingDocument: 'There was an error deleting this document',
    errorUpdatingDocument: 'There was an error updating this document',
    editDocument: 'Edit Document',
    documentNumber: 'Document Number',
    issueDate: 'Issue Date',
    expiryDate: 'Expiry Date',
    republicOfSudan: 'Republic of Sudan',
    // Add more translations as needed
  },
  ar: {
    welcome: 'مرحباً',
    services: 'الخدمات',
    settings: 'الإعدادات',
    notifications: 'الإشعارات',
    documents: 'المستندات',
    home: 'الرئيسية',
    login: 'تسجيل الدخول',
    nationalNumber: 'الرقم الوطني',
    password: 'كلمة المرور',
    forgotPassword: 'نسيت كلمة المرور؟',
    signIn: 'دخول',
    logout: 'تسجيل الخروج',
    profile: 'الملف الشخصي',
    editProfile: 'تعديل الملف الشخصي',
    language: 'اللغة',
    theme: 'المظهر',
    dark: 'داكن',
    light: 'فاتح',
    applyForService: 'التقديم للخدمة',
    selectService: 'اختر الخدمة',
    selectOffice: 'اختر المكتب',
    paymentInfo: 'معلومات الدفع',
    invoiceNumber: 'رقم الفاتورة',
    confirm: 'تأكيد',
    pending: 'قيد الانتظار',
    approved: 'تمت الموافقة',
    rejected: 'مرفوض',
    // Document translations
    edit: 'تعديل',
    share: 'مشاركة',
    copyLink: 'نسخ الرابط',
    renew: 'تجديد',
    delete: 'حذف',
    cancel: 'إلغاء',
    save: 'حفظ',
    saving: 'جاري الحفظ',
    deleting: 'جاري الحذف',
    linkCopied: 'تم نسخ الرابط',
    linkCopiedDescription: 'تم نسخ رابط المستند إلى الحافظة',
    shareDocument: 'مشاركة المستند',
    checkOutThisDocument: 'تحقق من هذا المستند',
    documentShared: 'تمت مشاركة المستند',
    documentSharedDescription: 'تمت مشاركة المستند بنجاح',
    documentDeleted: 'تم حذف المستند',
    documentDeletedDescription: 'تم حذف المستند بنجاح',
    documentUpdated: 'تم تحديث المستند',
    documentUpdatedDescription: 'تم تحديث معلومات المستند بنجاح',
    deleteConfirmation: 'حذف المستند',
    deleteConfirmationDescription: 'هل أنت متأكد من حذف هذا المستند؟ لا يمكن التراجع عن هذا الإجراء.',
    error: 'خطأ',
    errorDeletingDocument: 'حدث خطأ أثناء حذف هذا المستند',
    errorUpdatingDocument: 'حدث خطأ أثناء تحديث هذا المستند',
    editDocument: 'تعديل المستند',
    documentNumber: 'رقم المستند',
    issueDate: 'تاريخ الإصدار',
    expiryDate: 'تاريخ انتهاء الصلاحية',
    republicOfSudan: 'جمهورية السودان',
    // Add more translations as needed
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize language from localStorage or default to 'en'
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('egov-language') as Language;
    return savedLanguage || 'en';
  });

  // Update document attributes and localStorage when language changes
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    
    localStorage.setItem('egov-language', language);
  }, [language]);

  // Set language
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  // Translation function
  const t = (key: string) => {
    // @ts-ignore - We're using a simple approach for demo
    return translations[language][key] || key;
  };

  const value = {
    language,
    setLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
