import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const resources = {
  en: {
    translation: {
      dashboard: {
        greetingMorning: "Good Morning",
        greetingAfternoon: "Good Afternoon",
        greetingEvening: "Good Evening",
        overdue: "Overdue",
        daysLeft: "{{days}}d left",
        activeCountdowns: "Active Countdowns",
        upcomingEvents: "Upcoming Events",
        seeAll: "See all",
        seeFullList: "See full list",
        pastArchive: "Past Archive",
        noDeadlines: "No active deadlines",
        noEvents: "No upcoming events",
        addDeadline: "Add Deadline",
        addEvent: "Add Event"
      },
      tabs: {
        dashboard: "Home",
        clients: "Clients",
        reminders: "Reminders",
        history: "History"
      },
      settings: {
        title: "Settings",
        language: "Language",
        logout: "Logout",
        selectLanguage: "Select Language",
        english: "English",
        arabic: "Arabic",
        hebrew: "Hebrew"
      },
      clients: {
        title: "Managed Clients",
        noClients: "No clients yet",
        noClientsMessage: "Start by adding your first legal client to manage their case files and deadlines.",
        addClient: "Add Client"
      },
      reminders: {
        title: "Active Reminders",
        noReminders: "All caught up",
        noRemindersMessage: "You don't have any pending reminders. Create one to stay on top of your tasks."
      },
      history: {
        title: "Closed Cases & Events",
        noHistory: "History is empty",
        noHistoryMessage: "Completed tasks and closed events will appear here for your records."
      },
      forms: {
        save: "Save",
        title: "Title",
        date: "Date & Time",
        priority: "Priority",
        clientName: "Client Name",
        caseStatus: "Case Status",
        contactInfo: "Contact Information",
        email: "Email Address",
        phone: "Phone Number",
        category: "Category"
      },
      clientDetails: {
        status: "Status",
        contact: "Contact Information",
        notes: "Case Notes",
        addNote: "Add a new note...",
        add: "Add",
        loading: "Loading client data...",
        noNotes: "No notes for this client yet.",
        completedOn: "Completed on"
      },
      priorities: {
        low: "Low",
        medium: "Medium",
        high: "High",
        urgent: "Urgent"
      },
      statuses: {
        consultation: "Consultation",
        awaitingDocs: "Awaiting Docs",
        inCourt: "In Court",
        closed: "Closed"
      },
      categories: {
        countdown: "Countdown",
        calendar_event: "Event",
        event: "Event",
        reminder: "Reminder"
      },
      placeholders: {
        clientName: "e.g. John Doe",
        eventTitle: "e.g. Court Hearing Case #123"
      },
      auth: {
        login: "Login",
        register: "Register",
        email: "Email Address",
        password: "Password",
        noAccount: "Don't have an account? Register",
        hasAccount: "Already have an account? Login",
        loginGuest: "Continue as Guest",
        or: "OR",
        welcome: "Welcome Back",
        createAccount: "Create Your Account",
        forgotPassword: "Forgot Password?",
        resetLinkSent: "Reset link sent to your email!",
        userNotFound: "Email or password not found. You need to sign up.",
        sendReset: "Send Reset Link",
        backToLogin: "Back to Login",
        emailPlaceholder: "your@email.com",
        passwordPlaceholder: "Minimum 6 characters"
      }
    }
  },
  ar: {
    translation: {
      dashboard: {
        greetingMorning: "صباح الخير",
        greetingAfternoon: "مساء الخير",
        greetingEvening: "مساء الخير",
        overdue: "متأخر",
        daysLeft: "متبقي {{days}} يوم",
        activeCountdowns: "العد التنازلي النشط",
        upcomingEvents: "الأحداث القادمة",
        seeAll: "عرض الكل",
        seeFullList: "عرض القائمة الكاملة",
        pastArchive: "الأرشيف الماضي",
        noDeadlines: "لا توجد مواعيد نهائية نشطة",
        noEvents: "لا توجد أحداث قادمة",
        addDeadline: "إضافة موعد نهائي",
        addEvent: "إضافة حدث"
      },
      tabs: {
        dashboard: "الرئيسية",
        clients: "العملاء",
        reminders: "التذكيرات",
        history: "السجل"
      },
      settings: {
        title: "الإعدادات",
        language: "اللغة",
        logout: "تسجيل الخروج",
        selectLanguage: "اختر اللغة",
        english: "الإنجليزية",
        arabic: "العربية",
        hebrew: "العبرية"
      },
      clients: {
        title: "العملاء المدارون",
        noClients: "لا يوجد عملاء بعد",
        noClientsMessage: "ابدأ بإضافة عميلك الأول لإدارة ملفات قضاياهم والمواعيد النهائية.",
        addClient: "إضافة عميل"
      },
      reminders: {
        title: "التذكيرات النشطة",
        noReminders: "تم إكمال كل شيء",
        noRemindersMessage: "ليس لديك أي تذكيرات معلقة. قم بإنشاء واحدة للبقاء على اطلاع بمهامك."
      },
      history: {
        title: "القضايا والأحداث المغلقة",
        noHistory: "السجل فارغ",
        noHistoryMessage: "ستظهر المهام المكتملة والأحداث المغلقة هنا لسجلاتك."
      },
      forms: {
        save: "حفظ",
        title: "العنوان",
        date: "التاريخ والوقت",
        priority: "الأولوية",
        clientName: "اسم العميل",
        caseStatus: "حالة القضية",
        contactInfo: "معلومات الاتصال",
        email: "البريد الإلكتروني",
        phone: "رقم الهاتف",
        category: "الفئة"
      },
      clientDetails: {
        status: "الحالة",
        contact: "معلومات الاتصال",
        notes: "ملاحظات القضية",
        addNote: "إضافة ملاحظة جديدة...",
        add: "إضافة",
        loading: "جاري تحميل بيانات العميل...",
        noNotes: "لا توجد ملاحظات لهذا العميل بعد.",
        completedOn: "تم الإكمال في"
      },
      priorities: {
        low: "منخفض",
        medium: "متوسط",
        high: "عالي",
        urgent: "عاجل"
      },
      statuses: {
        consultation: "استشارة",
        awaitingDocs: "في انتظار الوثائق",
        inCourt: "في المحكمة",
        closed: "مغلق"
      },
      categories: {
        countdown: "عد تنازلي",
        calendar_event: "حدث",
        event: "حدث",
        reminder: "تذكير"
      },
      placeholders: {
        clientName: "مثال: جون دو",
        eventTitle: "مثال: جلسة استماع المحكمة رقم 123"
      },
      auth: {
        login: "تسجيل الدخول",
        register: "إنشاء حساب",
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        noAccount: "ليس لديك حساب؟ سجل الآن",
        hasAccount: "لديك حساب بالفعل؟ سجل دخولك",
        loginGuest: "الدخول كضيف",
        or: "أو",
        welcome: "مرحباً بعودتك",
        createAccount: "أنشئ حسابك الجديد",
        forgotPassword: "نسيت كلمة المرور؟",
        resetLinkSent: "تم إرسال رابط إعادة التعيين لبريدك!",
        userNotFound: "البريد أو كلمة المرور غير موجودين. تحتاج للتسجيل.",
        sendReset: "إرسال رابط الإعادة",
        backToLogin: "العودة لتسجيل الدخول",
        emailPlaceholder: "example@email.com",
        passwordPlaceholder: "6 أحرف كحد أدنى"
      }
    }
  },
  he: {
    translation: {
      dashboard: {
        greetingMorning: "בוקר טוב",
        greetingAfternoon: "אחר הצהריים טובים",
        greetingEvening: "ערב טוב",
        overdue: "פיגור",
        daysLeft: "{{days}} ימים נותרו",
        activeCountdowns: "ספירה לאחור פעילה",
        upcomingEvents: "אירועים קרובים",
        seeAll: "ראה הכל",
        seeFullList: "ראה רשימה מלאה",
        pastArchive: "ארכיון עבר",
        noDeadlines: "אין דדליינים פעילים",
        noEvents: "אין אירועים קרובים",
        addDeadline: "הוסף דדיליין",
        addEvent: "הוסף אירוע"
      },
      tabs: {
        dashboard: "בית",
        clients: "לקוחות",
        reminders: "תזכורות",
        history: "היסטוריה"
      },
      settings: {
        title: "הגדרות",
        language: "שפה",
        logout: "התנתק",
        selectLanguage: "בחר שפה",
        english: "אנגלית",
        arabic: "ערבית",
        hebrew: "עברית"
      },
      clients: {
        title: "לקוחות בניהול",
        noClients: "אין לקוחות עדיין",
        noClientsMessage: "התחל על ידי הוספת הלקוח המשפטי הראשון שלך כדי לנהל את תיקי המקרה והדדליינים שלהם.",
        addClient: "הוסף לקוח"
      },
      reminders: {
        title: "תזכורות פעילות",
        noReminders: "הכל מעודכן",
        noRemindersMessage: "אין לך תזכורות ממתינות. צור אחת כדי להישאר מעודכן במשימות שלך."
      },
      history: {
        title: "תיקים ואירועים סגורים",
        noHistory: "ההיסטוריה ריקה",
        noHistoryMessage: "משימות שהושלמו ואירועים סגורים יופיעו כאן עבור הרישומים שלך."
      },
      forms: {
        save: "שמור",
        title: "כותרת",
        date: "תאריך ושעה",
        priority: "עדיפות",
        clientName: "שם לקוח",
        caseStatus: "סטטוס תיק",
        contactInfo: "מידע ליצירת קשר",
        email: "כתובת אימייל",
        phone: "מספר טלפון",
        category: "קטגוריה"
      },
      clientDetails: {
        status: "סטטוס",
        contact: "מידע ליצירת קשר",
        notes: "הערות תיק",
        addNote: "הוסף הערה חדשה...",
        add: "הוסף",
        loading: "טוען נתוני לקוח...",
        noNotes: "אין עדיין הערות ללקוח זה.",
        completedOn: "הושלם ב-"
      },
      priorities: {
        low: "נמוכה",
        medium: "בינונית",
        high: "גבוהה",
        urgent: "דחוף"
      },
      statuses: {
        consultation: "ייעוץ",
        awaitingDocs: "ממתין למסמכים",
        inCourt: "בבית משפט",
        closed: "סגור"
      },
      categories: {
        countdown: "ספירה לאחור",
        calendar_event: "אירוע",
        event: "אירוע",
        reminder: "תזכורת"
      },
      placeholders: {
        clientName: "לדוגמה: ישראל ישראלי",
        eventTitle: "לדוגמה: דיון בבית משפט #123"
      },
      auth: {
        login: "התחברות",
        register: "הרשמה",
        email: "כתובת אימייל",
        password: "סיסמה",
        noAccount: "אין לך חשבון? הירשם עכשיו",
        hasAccount: "כבר יש לך חשבון? התחבר עכשיו",
        loginGuest: "המשך כאורח",
        or: "או",
        welcome: "ברוך השב",
        createAccount: "צור את החשבון שלך",
        forgotPassword: "שכחת סיסמה?",
        resetLinkSent: "קישור לאיפוס נשלח למייל שלך!",
        userNotFound: "האימייל או הסיסמה לא נמצאו. עליך להירשם.",
        sendReset: "שלח קישור לאיפוס",
        backToLogin: "חזרה להתחברות",
        emailPlaceholder: "your@email.com",
        passwordPlaceholder: "לפחות 6 תווים"
      }
    }
  }
};

const LANGUAGE_KEY = 'app_language';

// Initialize i18n synchronously with default to avoid "NO_I18NEXT_INSTANCE" warning
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Load saved language and apply RTL if we are in a browser/app environment
if (typeof window !== 'undefined') {
  AsyncStorage.getItem(LANGUAGE_KEY).then((savedLanguage) => {
    const langToUse = savedLanguage || 'en';
    if (langToUse !== i18n.language) {
      i18n.changeLanguage(langToUse);
    }
    const isRTL = langToUse === 'ar' || langToUse === 'he';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
    }
  }).catch(err => {
    console.error('Error loading saved language:', err);
  });
}

export default i18n;
