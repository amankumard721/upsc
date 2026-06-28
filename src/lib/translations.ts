export type Language = 'en' | 'hi';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboardTitle: "Dashboard",
    home: "Home",
    cards: "Cards",
    studyMaterial: "Study Material",
    dailyChallenge: "Daily MCQ Challenge",
    leaderboard: "Leaderboard",
    profile: "Profile",
    playChallenge: "Play Daily Challenge 🎲",
    playNow: "Play Now 🎲",
    welcomeBack: "Welcome Back! 🚀",
    syllabusReview: "Review random questions from your syllabus!",
    testKnowledge: "Test your knowledge on",
    booksCount: "Books",
    chaptersCount: "Chapters",
    streak: "Streak",
    points: "Points",
    settings: "Settings",
    targetExam: "Target Exam",
    preferredLanguage: "Preferred Language",
    saveSettings: "Save Settings",
    correct: "Correct",
    incorrect: "Incorrect",
    explanation: "Explanation",
    result: "Result",
    nextChallenge: "Next Challenge 🎲",
    correctAnswer: "Correct Answer",
    backToDashboard: "Return to Dashboard",
    lbsnaaGold: "LBSNAA Gold (Premium)",
    logout: "Log Out",
    referralCode: "Your Referral Code",
    all: "All",
    free: "Free",
    completed: "Completed",
    testSeries: "Test Series",
    startTest: "Start Test",
    questions: "Questions",
    minutes: "Mins",
    marks: "Marks"
  },
  hi: {
    dashboardTitle: "डैशबोर्ड",
    home: "मुख्य",
    cards: "कार्ड्स",
    studyMaterial: "अध्ययन सामग्री",
    dailyChallenge: "दैनिक एमसीक्यू चुनौती",
    leaderboard: "लीडरबोर्ड",
    profile: "प्रोफ़ाइल",
    playChallenge: "डेली चैलेंज खेलें 🎲",
    playNow: "अभी खेलें 🎲",
    welcomeBack: "आपका स्वागत है! 🚀",
    syllabusReview: "अपने पाठ्यक्रम से रैंडम प्रश्नों का अभ्यास करें!",
    testKnowledge: "अपने ज्ञान का परीक्षण करें",
    booksCount: "किताबें",
    chaptersCount: "अध्याय",
    streak: "लगातार दिन",
    points: "अंक (XP)",
    settings: "सेटिंग्स",
    targetExam: "लक्ष्य परीक्षा",
    preferredLanguage: "पसंदीदा भाषा",
    saveSettings: "सेटिंग्स सुरक्षित करें",
    correct: "सही",
    incorrect: "गलत",
    explanation: "स्पष्टीकरण",
    result: "परिणाम",
    nextChallenge: "अगली चुनौती 🎲",
    correctAnswer: "सही उत्तर",
    backToDashboard: "डैशबोर्ड पर वापस जाएं",
    lbsnaaGold: "LBSNAA गोल्ड (प्रीमियम)",
    logout: "लॉग आउट करें",
    referralCode: "आपका रेफ़रल कोड",
    all: "सभी",
    free: "मुफ़्त",
    completed: "पूर्ण",
    testSeries: "टेस्ट सीरीज",
    startTest: "टेस्ट शुरू करें",
    questions: "प्रश्न",
    minutes: "मिनट",
    marks: "अंक"
  }
};

export function getLanguage(): Language {
  if (typeof window !== 'undefined') {
    const lang = localStorage.getItem('prepai_language');
    if (lang === 'hi' || lang === 'en') return lang;
  }
  return 'en';
}

export function t(key: keyof typeof translations['en']): string {
  const lang = getLanguage();
  return translations[lang][key] || translations['en'][key] || key;
}
