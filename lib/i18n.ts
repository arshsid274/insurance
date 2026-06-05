export const LOCALES = ["en", "ar", "hi", "ml"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_META: Record<Locale, { label: string; native: string; dir: "ltr" | "rtl" }> = {
  en: { label: "English", native: "English", dir: "ltr" },
  ar: { label: "Arabic", native: "العربية", dir: "rtl" },
  hi: { label: "Hindi", native: "हिन्दी", dir: "ltr" },
  ml: { label: "Malayalam", native: "മലയാളം", dir: "ltr" },
};

export type TKey =
  | "appName"
  | "providersCount"
  | "useLocation"
  | "updateLocation"
  | "locating"
  | "promptTitle"
  | "promptBody"
  | "skipPrompt"
  | "searchPlaceholderName"
  | "searchPlaceholderAddress"
  | "addressToggleOn"
  | "addressToggleOff"
  | "addressToggleLabel"
  | "clearSearch"
  | "filterGroupLabel"
  | "typeHospital"
  | "typeClinic"
  | "typePharmacy"
  | "typeDiagnostics"
  | "typeDaySurgery"
  | "typeOptical"
  | "noResultsTitle"
  | "noResultsBody"
  | "resetFilters"
  | "providerResults"
  | "dental"
  | "dentalService"
  | "awaySuffix"
  | "navigate"
  | "navigateAria"
  | "callAria"
  | "closeDetails"
  | "networksLabel"
  | "deniedTitle"
  | "deniedBody"
  | "continueWithout"
  | "skipToList"
  | "loadingMap"
  | "languageSwitcher"
  | "metersAbbr"
  | "kmAbbr";

type Dict = Record<TKey, string>;

const en: Dict = {
  appName: "MedLocator",
  providersCount: "{n} providers",
  useLocation: "Use location",
  updateLocation: "Update location",
  locating: "Locating…",
  promptTitle: "Find providers near you",
  promptBody:
    "We use your location to sort in-network medical providers by distance. Nothing leaves your device — this all runs in your browser.",
  skipPrompt: "Skip — browse Dubai",
  searchPlaceholderName: "Search by name or region…",
  searchPlaceholderAddress: "Search by name, region, or address…",
  addressToggleOn: "Address search on — turn off",
  addressToggleOff: "Address search off — turn on",
  addressToggleLabel: "Address",
  clearSearch: "Clear search",
  filterGroupLabel: "Filter providers by type",
  typeHospital: "Hospitals",
  typeClinic: "Clinics",
  typePharmacy: "Pharmacies",
  typeDiagnostics: "Diagnostics",
  typeDaySurgery: "Day Surgery",
  typeOptical: "Optical",
  noResultsTitle: "No matches found",
  noResultsBody: "Try removing filters or clearing the search term.",
  resetFilters: "Reset filters",
  providerResults: "Provider results",
  dental: "Dental",
  dentalService: "Dental service",
  awaySuffix: "away",
  navigate: "Navigate",
  navigateAria: "Navigate to {name}",
  callAria: "Call {name}",
  closeDetails: "Close details",
  networksLabel: "Insurance networks",
  deniedTitle: "Location is blocked",
  deniedBody:
    "Your browser is blocking location for this site. Browsers don't let pages re-ask — you'll need to enable it manually.",
  continueWithout: "Continue browsing without location",
  skipToList: "Skip to provider list",
  loadingMap: "Loading map…",
  languageSwitcher: "Change language",
  metersAbbr: "m",
  kmAbbr: "km",
};

const ar: Dict = {
  appName: "MedLocator",
  providersCount: "{n} مزوّد",
  useLocation: "استخدم موقعي",
  updateLocation: "تحديث الموقع",
  locating: "جارٍ تحديد الموقع…",
  promptTitle: "ابحث عن مزوّدين قريبين منك",
  promptBody:
    "نستخدم موقعك لترتيب مزوّدي الرعاية الصحية ضمن شبكتك حسب المسافة. لا تغادر بياناتك جهازك — كل شيء يعمل داخل المتصفح.",
  skipPrompt: "تخطّي — استعرض دبي",
  searchPlaceholderName: "ابحث بالاسم أو المنطقة…",
  searchPlaceholderAddress: "ابحث بالاسم أو المنطقة أو العنوان…",
  addressToggleOn: "البحث بالعنوان مُفعَّل — اضغط للإيقاف",
  addressToggleOff: "البحث بالعنوان متوقف — اضغط للتفعيل",
  addressToggleLabel: "العنوان",
  clearSearch: "مسح البحث",
  filterGroupLabel: "تصفية المزوّدين حسب النوع",
  typeHospital: "المستشفيات",
  typeClinic: "العيادات",
  typePharmacy: "الصيدليات",
  typeDiagnostics: "المختبرات",
  typeDaySurgery: "الجراحة اليومية",
  typeOptical: "البصريات",
  noResultsTitle: "لا توجد نتائج مطابقة",
  noResultsBody: "جرّب إزالة بعض المرشحات أو محو كلمة البحث.",
  resetFilters: "إعادة ضبط المرشحات",
  providerResults: "نتائج المزوّدين",
  dental: "أسنان",
  dentalService: "خدمة الأسنان",
  awaySuffix: "بعيد",
  navigate: "الاتجاهات",
  navigateAria: "الاتجاه إلى {name}",
  callAria: "اتصل بـ {name}",
  closeDetails: "إغلاق التفاصيل",
  networksLabel: "شبكات التأمين",
  deniedTitle: "تم حظر الوصول إلى الموقع",
  deniedBody:
    "متصفّحك يحجب الوصول إلى موقعك. لا يمكن للصفحة أن تطلبه مرة أخرى — يلزم تفعيله يدويًا.",
  continueWithout: "المتابعة بدون تحديد الموقع",
  skipToList: "تخطّي إلى قائمة المزوّدين",
  loadingMap: "جاري تحميل الخريطة…",
  languageSwitcher: "تغيير اللغة",
  metersAbbr: "م",
  kmAbbr: "كم",
};

const hi: Dict = {
  appName: "MedLocator",
  providersCount: "{n} प्रदाता",
  useLocation: "मेरा स्थान",
  updateLocation: "स्थान अपडेट करें",
  locating: "स्थान खोजा जा रहा है…",
  promptTitle: "अपने पास के प्रदाता खोजें",
  promptBody:
    "हम आपके स्थान का उपयोग नेटवर्क प्रदाताओं को दूरी के अनुसार छाँटने के लिए करते हैं। कुछ भी आपके डिवाइस से बाहर नहीं जाता — सब आपके ब्राउज़र में चलता है।",
  skipPrompt: "छोड़ें — दुबई दिखाएँ",
  searchPlaceholderName: "नाम या क्षेत्र से खोजें…",
  searchPlaceholderAddress: "नाम, क्षेत्र या पते से खोजें…",
  addressToggleOn: "पते से खोज चालू है — बंद करें",
  addressToggleOff: "पते से खोज बंद है — चालू करें",
  addressToggleLabel: "पता",
  clearSearch: "खोज साफ़ करें",
  filterGroupLabel: "प्रकार के अनुसार छाँटें",
  typeHospital: "अस्पताल",
  typeClinic: "क्लिनिक",
  typePharmacy: "फ़ार्मेसी",
  typeDiagnostics: "जाँच केंद्र",
  typeDaySurgery: "डे सर्जरी",
  typeOptical: "ऑप्टिकल",
  noResultsTitle: "कोई परिणाम नहीं मिला",
  noResultsBody: "फ़िल्टर हटाकर या खोज शब्द साफ़ करके पुनः प्रयास करें।",
  resetFilters: "फ़िल्टर रीसेट करें",
  providerResults: "प्रदाता परिणाम",
  dental: "दंत",
  dentalService: "दंत सेवा",
  awaySuffix: "दूर",
  navigate: "रास्ता दिखाएँ",
  navigateAria: "{name} तक मार्गदर्शन",
  callAria: "{name} को कॉल करें",
  closeDetails: "विवरण बंद करें",
  networksLabel: "बीमा नेटवर्क",
  deniedTitle: "स्थान अवरुद्ध है",
  deniedBody:
    "आपका ब्राउज़र इस साइट के लिए स्थान अवरुद्ध कर रहा है। पेज इसे दोबारा नहीं माँग सकते — इसे मैन्युअली चालू करना होगा।",
  continueWithout: "बिना स्थान के जारी रखें",
  skipToList: "प्रदाता सूची पर जाएँ",
  loadingMap: "मानचित्र लोड हो रहा है…",
  languageSwitcher: "भाषा बदलें",
  metersAbbr: "मी",
  kmAbbr: "किमी",
};

const ml: Dict = {
  appName: "MedLocator",
  providersCount: "{n} ദാതാക്കൾ",
  useLocation: "എന്റെ ലൊക്കേഷൻ",
  updateLocation: "ലൊക്കേഷൻ പുതുക്കുക",
  locating: "ലൊക്കേഷൻ കണ്ടെത്തുന്നു…",
  promptTitle: "അടുത്തുള്ള ദാതാക്കളെ കണ്ടെത്തുക",
  promptBody:
    "നെറ്റ്‌വർക്കിലെ ദാതാക്കളെ ദൂരം അനുസരിച്ച് അടുക്കാൻ നിങ്ങളുടെ ലൊക്കേഷൻ ഉപയോഗിക്കുന്നു. ഒന്നും ഉപകരണത്തിൽനിന്ന് പുറത്തുപോകില്ല — എല്ലാം നിങ്ങളുടെ ബ്രൗസറിൽത്തന്നെയാണ്.",
  skipPrompt: "ഒഴിവാക്കുക — ദുബായ് കാണിക്കുക",
  searchPlaceholderName: "പേരോ പ്രദേശമോ വെച്ച് തിരയുക…",
  searchPlaceholderAddress: "പേര്, പ്രദേശം അല്ലെങ്കിൽ വിലാസം…",
  addressToggleOn: "വിലാസത്തിലെ തിരയൽ ഓൺ — ഓഫ് ചെയ്യാൻ ടാപ്പ് ചെയ്യുക",
  addressToggleOff: "വിലാസത്തിലെ തിരയൽ ഓഫ് — ഓൺ ചെയ്യാൻ ടാപ്പ് ചെയ്യുക",
  addressToggleLabel: "വിലാസം",
  clearSearch: "തിരയൽ മായ്ക്കുക",
  filterGroupLabel: "ടൈപ്പനുസരിച്ച് ഫിൽട്ടർ ചെയ്യുക",
  typeHospital: "ആശുപത്രികൾ",
  typeClinic: "ക്ലിനിക്കുകൾ",
  typePharmacy: "ഫാർമസികൾ",
  typeDiagnostics: "ഡയഗ്നോസ്റ്റിക്സ്",
  typeDaySurgery: "ഡേ സർജറി",
  typeOptical: "ഒപ്റ്റിക്കൽ",
  noResultsTitle: "ഫലങ്ങളൊന്നുമില്ല",
  noResultsBody: "ഫിൽട്ടറുകൾ നീക്കം ചെയ്യുകയോ തിരയൽ വാക്ക് മായ്‌ക്കുകയോ ചെയ്യുക.",
  resetFilters: "ഫിൽട്ടറുകൾ പുനഃസജ്ജമാക്കുക",
  providerResults: "ദാതാക്കൾ ഫലങ്ങൾ",
  dental: "ദന്തൽ",
  dentalService: "ദന്തൽ സേവനം",
  awaySuffix: "അകലെ",
  navigate: "വഴികാട്ടുക",
  navigateAria: "{name}-ലേക്ക് വഴികാട്ടുക",
  callAria: "{name}-നെ വിളിക്കുക",
  closeDetails: "വിശദാംശങ്ങൾ അടയ്ക്കുക",
  networksLabel: "ഇൻഷുറൻസ് നെറ്റ്‌വർക്കുകൾ",
  deniedTitle: "ലൊക്കേഷൻ ബ്ലോക്ക് ചെയ്തിരിക്കുന്നു",
  deniedBody:
    "ഈ സൈറ്റിന് നിങ്ങളുടെ ബ്രൗസർ ലൊക്കേഷൻ അനുവദിക്കുന്നില്ല. പേജുകൾക്ക് വീണ്ടും ചോദിക്കാനാവില്ല — സ്വയം ഓൺ ചെയ്യണം.",
  continueWithout: "ലൊക്കേഷൻ ഇല്ലാതെ തുടരുക",
  skipToList: "ദാതാക്കളുടെ ലിസ്റ്റിലേക്ക് പോകുക",
  loadingMap: "മാപ്പ് ലോഡ് ചെയ്യുന്നു…",
  languageSwitcher: "ഭാഷ മാറ്റുക",
  metersAbbr: "മീ",
  kmAbbr: "കിമീ",
};

export const DICTIONARIES: Record<Locale, Dict> = { en, ar, hi, ml };

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const raw of langs) {
    const base = raw.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return "en";
}

export function translate(locale: Locale, key: TKey, params?: Record<string, string | number>): string {
  const dict = DICTIONARIES[locale] ?? en;
  let text = dict[key] ?? en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}
