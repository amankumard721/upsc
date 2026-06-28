'use client';

import React, { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/supabase';
import { sfx } from '@/lib/sounds';
import { t } from '@/lib/translations';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Award, 
  Share2, 
  RotateCcw, 
  LayoutDashboard,
  AlertTriangle,
  HelpCircle,
  ChevronRight,
  TrendingUp,
  Menu,
  X,
  Star,
  Play,
  Pause,
  Info,
  Grid,
  List,
  Sparkles,
  ThumbsUp,
  Award as Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TestSeriesPageProps {
  params: Promise<{ testId: string }>;
}

// Mock Test Series Database
interface UPSCQuestion {
  id: number;
  subject: string;
  subjectHi: string;
  qEn: string;
  qHi: string;
  optionsEn: string[];
  optionsHi: string[];
  correctOption: number; // 0, 1, 2, 3
  explanationEn: string;
  explanationHi: string;
}

interface MockTest {
  id: string;
  titleEn: string;
  titleHi: string;
  subtitleEn: string;
  subtitleHi: string;
  durationMins: number;
  totalQs: number;
  totalMarks: number;
  positiveMarks: number;
  negativeMarks: number;
  category: string;
  questions: UPSCQuestion[];
}

const MOCK_TESTS: Record<string, MockTest> = {
  'mock-1': {
    id: 'mock-1',
    titleEn: 'UPSC Full-Length Mock Test 1',
    titleHi: 'UPSC पूर्ण-लंबाई मॉक टेस्ट 1',
    subtitleEn: 'General Studies Paper I (GS-1)',
    subtitleHi: 'सामान्य अध्ययन पेपर I (GS-1)',
    durationMins: 120,
    totalQs: 5,
    totalMarks: 10,
    positiveMarks: 2.0,
    negativeMarks: 0.66,
    category: 'Polity & History',
    questions: [
      {
        id: 1,
        subject: 'Polity',
        subjectHi: 'राजव्यवस्था',
        qEn: 'Which of the following Fundamental Rights is/are available to Indian citizens only, and not to foreigners?',
        qHi: 'निम्नलिखित में से कौन सा/से मौलिक अधिकार केवल भारतीय नागरिकों को उपलब्ध हैं, विदेशियों को नहीं?',
        optionsEn: [
          'Equality before law (Article 14)',
          'Prohibition of discrimination on grounds of religion, race, caste, sex or place of birth (Article 15)',
          'Protection of life and personal liberty (Article 21)',
          'Freedom of conscience and free profession, practice and propagation of religion (Article 25)'
        ],
        optionsHi: [
          'कानून के समक्ष समानता (अनुच्छेद 14)',
          'धर्म, मूलवंश, जाति, लिंग या जन्म स्थान के आधार पर भेदभाव का निषेध (अनुच्छेद 15)',
          'प्राण और दैहिक स्वतंत्रता का संरक्षण (अनुच्छेद 21)',
          'अंतःकरण की और धर्म के अबाध रूप से मानने, आचरण और प्रचार करने की स्वतंत्रता (अनुच्छेद 25)'
        ],
        correctOption: 1,
        explanationEn: 'Articles 15, 16, 19, 29, and 30 are available to Indian citizens only. Article 14, 20, 21, 21A, 22, 23, 24, 25, 26, 27, and 28 are available to all persons, whether citizens or foreigners.',
        explanationHi: 'अनुच्छेद 15, 16, 19, 29 और 30 केवल भारतीय नागरिकों के लिए उपलब्ध हैं। जबकि अनुच्छेद 14, 20, 21, 21A, 22, 23, 24, 25, 26, 27 और 28 सभी व्यक्तियों (नागरिकों और विदेशियों दोनों) को प्राप्त हैं।'
      },
      {
        id: 2,
        subject: 'Polity',
        subjectHi: 'राजव्यवस्था',
        qEn: "The Preamble to the Constitution of India is based on the 'Objective Resolution' drafted and moved by:",
        qHi: "भारतीय संविधान की प्रस्तावना (Preamble) किसके द्वारा तैयार और प्रस्तुत किए गए 'उद्देश्य प्रस्ताव' पर आधारित है?",
        optionsEn: [
          'Dr. B.R. Ambedkar',
          'Jawaharlal Nehru',
          'Sardar Vallabhbhai Patel',
          'Dr. Rajendra Prasad'
        ],
        optionsHi: [
          'डॉ. बी.आर. अम्बेडकर',
          'जवाहरलाल नेहरू',
          'सरदार वल्लभभाई पटेल',
          'डॉ. राजेन्द्र प्रसाद'
        ],
        correctOption: 1,
        explanationEn: 'The Preamble is based on the Objective Resolution, drafted and moved by Pandit Jawaharlal Nehru on December 13, 1946, and unanimously adopted by the Constituent Assembly on January 22, 1947.',
        explanationHi: 'संविधान की प्रस्तावना पंडित जवाहरलाल नेहरू द्वारा 13 दिसंबर 1946 को संविधान सभा में पेश किए गए ऐतिहासिक उद्देश्य प्रस्ताव पर आधारित है, जिसे 22 जनवरी 1947 को सर्वसम्मति से स्वीकार किया गया।'
      },
      {
        id: 3,
        subject: 'History',
        subjectHi: 'इतिहास',
        qEn: 'With reference to the Indus Valley Civilization, consider the following statements:\n1. It was predominantly a secular civilization.\n2. Cotton was used for manufacturing textiles in India during this period.\n\nWhich of the statements given above is/are correct?',
        qHi: 'सिंधु घाटी सभ्यता के संदर्भ में, निम्नलिखित कथनों पर विचार कीजिए:\n1. यह मुख्य रूप से एक धर्मनिरपेक्ष सभ्यता थी।\n2. इस अवधि के दौरान भारत में वस्त्रों के निर्माण के लिए कपास का उपयोग किया जाता था।\n\nउपरोक्त कथनों में से कौन सा/से सही है/हैं?',
        optionsEn: [
          '1 only',
          '2 only',
          'Both 1 and 2',
          'Neither 1 nor 2'
        ],
        optionsHi: [
          'केवल 1',
          'केवल 2',
          '1 और 2 दोनों',
          'न तो 1 न ही 2'
        ],
        correctOption: 2,
        explanationEn: 'The Harappan civilization was predominantly secular. Though religious elements are found, they did not dominate the socio-political structure. Cotton textile fragments have been discovered at Mohenjo-daro, confirming cotton manufacturing.',
        explanationHi: 'सिंधु घाटी सभ्यता एक धर्मनिरपेक्ष सभ्यता थी, वहां से किसी मंदिर या धार्मिक प्रभुत्व के साक्ष्य नहीं मिले हैं। मोहनजोदड़ो से सूती कपड़े के अवशेष मिले हैं, जिससे कपास के उपयोग की पुष्टि होती है। अतः दोनों कथन सही हैं।'
      },
      {
        id: 4,
        subject: 'Geography',
        subjectHi: 'भूगोल',
        qEn: 'Which of the following ocean currents is a cold current?',
        qHi: 'निम्नलिखित महासागरीय धाराओं में से कौन सी एक ठंडी जलधारा है?',
        optionsEn: [
          'Gulf Stream',
          'Kuroshio Current',
          'Benguela Current',
          'Brazil Current'
        ],
        optionsHi: [
          'गल्फ स्ट्रीम',
          'क्यूरोशियो धारा',
          'बेंगुएला धारा',
          'ब्राजील धारा'
        ],
        correctOption: 2,
        explanationEn: 'The Benguela Current is a cold, dry, coastal ocean current that flows northward along the west coast of southern Africa. Gulf Stream, Kuroshio, and Brazil currents are warm ocean currents.',
        explanationHi: 'बेंगुएला धारा दक्षिणी अफ्रीका के पश्चिमी तट के साथ उत्तर की ओर बहने वाली एक ठंडी महासागरीय धारा है। गल्फ स्ट्रीम, क्यूरोशियो और ब्राजील धाराएं गर्म धाराएं हैं।'
      },
      {
        id: 5,
        subject: 'Economics',
        subjectHi: 'अर्थशास्त्र',
        qEn: "The term 'Stagflation' refers to a situation of:",
        qHi: "अर्थशास्त्र में 'स्टैगफ्लेशन' (Stagflation) का अर्थ क्या होता है?",
        optionsEn: [
          'High inflation accompanied by high unemployment and slow economic growth',
          'Low inflation with rapid industrial development',
          'Hyperinflation with full employment',
          'Deflation coupled with high economic growth'
        ],
        optionsHi: [
          'उच्च मुद्रास्फीति के साथ उच्च बेरोजगारी और धीमी आर्थिक विकास दर',
          'तीव्र औद्योगिक विकास के साथ कम मुद्रास्फीति',
          'पूर्ण रोजगार के साथ अति-मुद्रास्फीति (Hyperinflation)',
          'उच्च आर्थिक विकास के साथ अपस्फीति (Deflation)'
        ],
        correctOption: 0,
        explanationEn: 'Stagflation is an economic event in which the inflation rate is high, the economic growth rate slows down, and unemployment remains steadily high.',
        explanationHi: 'स्टैगफ्लेशन (मंदीयुक्त स्फीति) वह स्थिति है जब बाजार में मंदी (धीमी विकास दर) और बेरोजगारी के साथ-साथ महंगाई (मुद्रास्फीति) भी उच्च स्तर पर बनी रहती है।'
      }
    ]
  },
  'mock-2': {
    id: 'mock-2',
    titleEn: 'UPSC CSAT Mock Test 1',
    titleHi: 'UPSC CSAT मॉक टेस्ट 1',
    subtitleEn: 'General Studies Paper II (CSAT)',
    subtitleHi: 'सामान्य अध्ययन पेपर II (CSAT)',
    durationMins: 120,
    totalQs: 3,
    totalMarks: 6,
    positiveMarks: 2.0,
    negativeMarks: 0.66,
    category: 'CSAT Reasoning',
    questions: [
      {
        id: 1,
        subject: 'CSAT Quant',
        subjectHi: 'CSAT योग्यता',
        qEn: 'A train running at a speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?',
        qHi: '60 किमी/घंटा की गति से चल रही एक ट्रेन 9 सेकंड में एक खंभे को पार करती है। ट्रेन की लंबाई कितनी है?',
        optionsEn: [
          '120 meters',
          '150 meters',
          '324 meters',
          '180 meters'
        ],
        optionsHi: [
          '120 मीटर',
          '150 मीटर',
          '324 मीटर',
          '180 मीटर'
        ],
        correctOption: 1,
        explanationEn: 'Speed = 60 * (5/18) = 50/3 m/s. Length of train = Speed * Time = (50/3) * 9 = 150 meters.',
        explanationHi: 'ट्रेन की गति मीटर/सेकंड में = 60 * (5/18) = 50/3 मीटर/सेकंड। ट्रेन की लंबाई (दूरी) = गति * समय = (50/3) * 9 = 150 मीटर।'
      },
      {
        id: 2,
        subject: 'CSAT Logic',
        subjectHi: 'CSAT तार्किकता',
        qEn: 'If in a certain code language, LBSNAA is coded as MCTOBB, how is UPSC coded?',
        qHi: 'यदि किसी कूट भाषा में LBSNAA को MCTOBB लिखा जाता है, तो UPSC को क्या लिखा जाएगा?',
        optionsEn: [
          'VQTD',
          'VQTB',
          'VPTD',
          'WRTD'
        ],
        optionsHi: [
          'VQTD',
          'VQTB',
          'VPTD',
          'WRTD'
        ],
        correctOption: 0,
        explanationEn: 'The coding pattern is +1 shift for each letter. L(+1)->M, B(+1)->C, S(+1)->T, N(+1)->O, A(+1)->B, A(+1)->B. Similarly, U(+1)->V, P(+1)->Q, S(+1)->T, C(+1)->D.',
        explanationHi: 'कोडिंग पैटर्न प्रत्येक अक्षर के लिए +1 की वृद्धि है। L(+1)->M, B(+1)->C, S(+1)->T, N(+1)->O, A(+1)->B, A(+1)->B। इसी प्रकार, U(+1)->V, P(+1)->Q, S(+1)->T, C(+1)->D। अतः सही उत्तर VQTD है।'
      },
      {
        id: 3,
        subject: 'CSAT English',
        subjectHi: 'CSAT अंग्रेजी',
        qEn: "Choose the correct missing term in the sequence: A, C, F, J, O, ?",
        qHi: "अनुक्रम में सही लुप्त पद का चयन करें: A, C, F, J, O, ?",
        optionsEn: [
          'T',
          'U',
          'V',
          'S'
        ],
        optionsHi: [
          'T',
          'U',
          'V',
          'S'
        ],
        correctOption: 1,
        explanationEn: 'The gap between letters increases progressively: A to C (+2), C to F (+3), F to J (+4), J to O (+5), O to U (+6).',
        explanationHi: 'अक्षरों के बीच का अंतर क्रमशः बढ़ रहा है: A से C (+2), C से F (+3), F से J (+4), J से O (+5), O से U (+6)। अतः लुप्त अक्षर U है।'
      }
    ]
  }
};

export default function USPCTestSeriesPage({ params }: TestSeriesPageProps) {
  const router = useRouter();
  const { testId } = use(params);

  const test = MOCK_TESTS[testId] || MOCK_TESTS['mock-1'];

  // Flow State
  const [phase, setPhase] = useState<'instruction' | 'live' | 'result'>('instruction');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [unseenQuestions, setUnseenQuestions] = useState<Record<number, boolean>>(() => {
    const map: Record<number, boolean> = {};
    test.questions.forEach((_, idx) => {
      if (idx !== 0) map[idx] = true;
    });
    return map;
  });

  // Time metrics
  const [timeLeft, setTimeLeft] = useState(test.durationMins * 60);
  const [questionSeconds, setQuestionSeconds] = useState<Record<number, number>>({});
  const [paused, setPaused] = useState(false);
  const [isSubmitSheetOpen, setIsSubmitSheetOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteView, setPaletteView] = useState<'grid' | 'list'>('grid');

  // Result stats
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [unattemptedCount, setUnattemptedCount] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [resultTab, setResultTab] = useState<'analysis' | 'solutions' | 'leaderboard'>('analysis');
  const [userRating, setUserRating] = useState<number | null>(null);

  // Language state
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('prepai_language');
      if (savedLang === 'hi' || savedLang === 'en') {
        setLang(savedLang as 'en' | 'hi');
      }
    }
  }, []);

  // Timer loop
  useEffect(() => {
    if (phase !== 'live' || paused) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitTest(); // Auto submit
          return 0;
        }
        if (prev === 300) {
          setShowWarning(true); // 5 mins warning
        }
        return prev - 1;
      });

      setQuestionSeconds(prev => ({
        ...prev,
        [currentIdx]: (prev[currentIdx] || 0) + 1
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, paused, currentIdx]);

  // Mark question seen when index changes
  const handleNavigateQuestion = (idx: number) => {
    setCurrentIdx(idx);
    setUnseenQuestions(prev => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const handleOptionSelect = (optionIdx: number) => {
    sfx.playTap();
    setSelectedAnswers(prev => ({
      ...prev,
      [currentIdx]: optionIdx
    }));
  };

  const handleSaveAndNext = () => {
    sfx.playTap();
    if (currentIdx + 1 < test.questions.length) {
      handleNavigateQuestion(currentIdx + 1);
    } else {
      setIsSubmitSheetOpen(true);
    }
  };

  const handleClearResponse = () => {
    sfx.playTap();
    setSelectedAnswers(prev => {
      const next = { ...prev };
      delete next[currentIdx];
      return next;
    });
  };

  const handleMarkForReview = () => {
    sfx.playTap();
    setMarkedForReview(prev => ({
      ...prev,
      [currentIdx]: !prev[currentIdx]
    }));
    
    // Auto navigate next
    if (currentIdx + 1 < test.questions.length) {
      handleNavigateQuestion(currentIdx + 1);
    }
  };

  const handleSubmitTest = async () => {
    sfx.playSuccess();
    
    // Evaluate metrics
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;

    test.questions.forEach((q, idx) => {
      const answer = selectedAnswers[idx];
      if (answer === undefined) {
        unattempted++;
      } else if (answer === q.correctOption) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const score = Number((correct * test.positiveMarks - incorrect * test.negativeMarks).toFixed(2));
    const totalAttempted = correct + incorrect;
    const acc = totalAttempted === 0 ? 0 : Math.round((correct / totalAttempted) * 100);

    setCorrectCount(correct);
    setIncorrectCount(incorrect);
    setUnattemptedCount(unattempted);
    setFinalScore(score);
    setAccuracy(acc);

    // Save attempt to Supabase
    try {
      await db.saveQuizAttempt({
        chapter_id: '00000000-0000-0000-0000-000000000001', // Mock global test placeholder
        total_questions: test.questions.length,
        correct_answers: correct,
        score: score,
        time_taken_seconds: (test.durationMins * 60) - timeLeft
      });
    } catch (e) {
      console.error("Failed saving mock test attempt", e);
    }

    setPhase('result');
    setIsSubmitSheetOpen(false);
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const handleRetryTest = () => {
    sfx.playTap();
    setCurrentIdx(0);
    setSelectedAnswers({});
    setMarkedForReview({});
    setUnseenQuestions(() => {
      const map: Record<number, boolean> = {};
      test.questions.forEach((_, idx) => {
        if (idx !== 0) map[idx] = true;
      });
      return map;
    });
    setTimeLeft(test.durationMins * 60);
    setQuestionSeconds({});
    setPaused(false);
    setPhase('instruction');
  };

  // Helper getters
  const getQuestionStatus = (idx: number) => {
    const isAnswered = selectedAnswers[idx] !== undefined;
    const isMarked = markedForReview[idx] === true;
    const isUnseen = unseenQuestions[idx] === true;

    if (isAnswered && isMarked) return 'answered-marked';
    if (isAnswered) return 'answered';
    if (isMarked) return 'marked';
    if (isUnseen) return 'unseen';
    return 'unattempted';
  };

  // Time formatters
  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatShortTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-[100dvh] w-screen bg-slate-950 text-foreground font-sans relative overflow-hidden">
      
      {/* ──────────────────────────────────────────────────────── */}
      {/* PHASE 1: INSTRUCTION SCREEN                              */}
      {/* ──────────────────────────────────────────────────────── */}
      {phase === 'instruction' && (
        <div className="h-full w-full overflow-y-auto p-4 pb-28 space-y-6 max-w-3xl mx-auto no-scrollbar" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top, 0px))' }}>
          {/* Header */}
          <div className="flex items-center gap-3 bg-slate-900/60 border border-white/5 p-4 rounded-2xl">
            <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition active:scale-95">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-sm md:text-base font-bold text-foreground">
                {lang === 'hi' ? test.titleHi : test.titleEn}
              </h1>
              <p className="text-xs text-foreground/45">
                {lang === 'hi' ? 'परीक्षा निर्देश / Exam Rules' : 'Instructions & Marking Scheme'}
              </p>
            </div>
          </div>

          {/* Stat Chips */}
          <div className="grid grid-cols-4 gap-3">
            <div className="premium-card p-3 text-center bg-slate-900/40 border-white/5">
              <span className="text-[10px] text-foreground/40 block">Questions</span>
              <span className="text-sm font-extrabold text-accent">{test.totalQs} Qs</span>
            </div>
            <div className="premium-card p-3 text-center bg-slate-900/40 border-white/5">
              <span className="text-[10px] text-foreground/40 block">Time</span>
              <span className="text-sm font-extrabold text-accent">{test.durationMins} Mins</span>
            </div>
            <div className="premium-card p-3 text-center bg-slate-900/40 border-white/5">
              <span className="text-[10px] text-foreground/40 block">Marks</span>
              <span className="text-sm font-extrabold text-accent">{test.totalMarks} M</span>
            </div>
            <div className="premium-card p-3 text-center bg-slate-900/40 border-white/5">
              <span className="text-[10px] text-foreground/40 block">Negative</span>
              <span className="text-sm font-extrabold text-red-400">-{test.negativeMarks}</span>
            </div>
          </div>

          {/* Instructions List */}
          <div className="premium-card p-5 bg-slate-900/40 space-y-4">
            <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-accent" />
              {lang === 'hi' ? 'महत्वपूर्ण निर्देश' : 'General Instructions'}
            </h3>
            <ul className="space-y-2.5 text-xs text-foreground/75 list-decimal pl-4 leading-relaxed font-light">
              <li>Each question awards <strong>+{test.positiveMarks}</strong> marks for correct responses.</li>
              <li>Incorrect responses trigger negative markings of <strong>-{test.negativeMarks}</strong> marks.</li>
              <li>Use the <strong>"Mark & Next"</strong> feature to flag questions for review. They appear in purple on the bubble palette sheet.</li>
              <li>You can navigate questions freely using the bubble sheet drawer or swipe left/right.</li>
              <li>The test will automatically evaluate and submit once the countdown timer hits zero.</li>
            </ul>
          </div>

          {/* Palette Legend Map */}
          <div className="premium-card p-5 bg-slate-900/40 space-y-3">
            <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
              {lang === 'hi' ? 'कलर कोड लेजेंड' : 'OMR Bubble Color Legend'}
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block border border-emerald-400/20" />
                <span>Answered / उत्तर दिया</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 inline-block border border-red-400/20" />
                <span>Not Answered / छूटा हुआ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 inline-block border border-amber-400/20" />
                <span>Marked / मार्क किया</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-purple-500 inline-block border border-purple-400/20" />
                <span>Answered & Marked</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-slate-800 inline-block border border-white/10" />
                <span>Not Visited / नहीं देखा</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-slate-950 inline-block border-2 border-accent" />
                <span>Current Question</span>
              </div>
            </div>
          </div>

          {/* Begin Test CTA */}
          <button
            onClick={() => { sfx.playSuccess(); setPhase('live'); }}
            className="w-full bg-accent hover:bg-amber-500 text-slate-950 font-bold py-4 rounded-2xl active:scale-[0.98] transition shadow-lg shadow-accent/10 text-sm tracking-wider uppercase"
          >
            {lang === 'hi' ? 'परीक्षा प्रारंभ करें / Begin Exam' : 'Begin UPSC Mock Exam'}
          </button>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* PHASE 2: LIVE TEST SIMULATOR SCREEN                      */}
      {/* ──────────────────────────────────────────────────────── */}
      {phase === 'live' && (
        <div className="fixed inset-0 h-[100dvh] w-screen flex flex-col overflow-hidden bg-slate-950 z-50">
          {/* Header Controls */}
          <div className="flex items-center justify-between bg-slate-950 border-b border-white/5 pb-4 px-4 shrink-0" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))' }}>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setPaused(!paused)} 
                className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center border border-white/10 active:scale-95 transition"
              >
                {paused ? <Play className="w-4 h-4 text-emerald-400 fill-emerald-400/20" /> : <Pause className="w-4 h-4 text-foreground" />}
              </button>
              <div>
                <span className="text-lg font-mono font-bold tracking-wider block leading-none">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-[10px] text-foreground/45 font-mono">
                  {lang === 'hi' ? test.titleHi : test.titleEn}
                </span>
              </div>
            </div>

            <button 
              onClick={() => setDrawerOpen(true)}
              className="p-2.5 bg-slate-900 border border-white/5 rounded-xl text-foreground flex items-center gap-1.5 active:scale-95 transition hover:border-accent"
            >
              <Menu className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider">OMR Sheet</span>
            </button>
          </div>

          {/* Paused Overlay */}
          {paused && (
            <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-30 flex flex-col items-center justify-center space-y-4">
              <Clock className="w-16 h-16 text-accent animate-pulse" />
              <h2 className="text-xl font-bold text-foreground">Exam Paused</h2>
              <p className="text-xs text-foreground/60">Press Play to resume your countdown and OMR evaluation.</p>
              <button 
                onClick={() => setPaused(false)}
                className="bg-accent text-slate-950 text-xs font-bold px-6 py-3 rounded-xl hover:bg-amber-500 transition shadow-lg active:scale-95"
              >
                Resume Exam
              </button>
            </div>
          )}

          {/* Meta Info Row */}
          <div className="flex items-center justify-between py-3 px-4 bg-slate-900/40 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 bg-accent/20 text-accent border border-accent/25 rounded-full flex items-center justify-center text-xs font-bold font-mono">
                {currentIdx + 1}
              </span>
              <div className="flex items-center text-[10px] text-foreground/40 font-mono gap-1">
                <Clock className="w-3.5 h-3.5 text-foreground/30" />
                <span>{formatShortTime(questionSeconds[currentIdx] || 0)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded">
                +{test.positiveMarks}
              </span>
              <span className="text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-400/20 px-2 py-0.5 rounded">
                -{test.negativeMarks}
              </span>
              <button 
                onClick={handleMarkForReview}
                className={`p-1.5 border rounded-lg transition active:scale-95 ${
                  markedForReview[currentIdx] 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                    : 'bg-white/5 border-white/10 text-foreground/30'
                }`}
              >
                <Star className={`w-4 h-4 ${markedForReview[currentIdx] ? 'fill-amber-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Question Statement */}
          <div className="flex-1 p-4 space-y-6 pt-6 overflow-y-auto overflow-x-hidden max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-1.5 text-[10px] bg-white/5 border border-white/10 text-foreground/60 w-fit px-2 py-0.5 rounded font-mono uppercase">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>{test.questions[currentIdx].subject}</span>
            </div>

            <h2 className="text-base md:text-lg font-medium text-foreground leading-relaxed">
              {lang === 'hi' ? test.questions[currentIdx].qHi : test.questions[currentIdx].qEn}
            </h2>

            {/* Options list */}
            <div className="space-y-3.5">
              {(lang === 'hi' ? test.questions[currentIdx].optionsHi : test.questions[currentIdx].optionsEn).map((optText, optionIdx) => {
                const isSelected = selectedAnswers[currentIdx] === optionIdx;
                return (
                  <button
                    key={optionIdx}
                    onClick={() => handleOptionSelect(optionIdx)}
                    className={`w-full text-left p-4 rounded-xl border text-xs md:text-sm transition-all flex items-start gap-3 active:scale-[0.99] ${
                      isSelected 
                        ? 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(216,155,60,0.15)] text-foreground' 
                        : 'border-white/5 bg-slate-900/40 hover:bg-slate-900/80'
                    }`}
                  >
                    <span className={`font-mono font-bold px-2 py-0.5 rounded border text-[11px] mt-0.5 ${
                      isSelected ? 'bg-accent text-slate-950 border-accent' : 'bg-white/5 border-white/10 text-accent'
                    }`}>
                      {String.fromCharCode(65 + optionIdx)}
                    </span>
                    <span className="flex-1">{optText}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Navigation Toolbar */}
          <div className="bg-slate-950 border-t border-white/5 p-4 flex gap-3 shrink-0">
            <button
              onClick={handleMarkForReview}
              className="flex-1 border border-white/10 hover:border-amber-500 hover:text-amber-400 py-3.5 rounded-xl font-bold text-xs active:scale-[0.97] transition flex items-center justify-center gap-1.5"
            >
              <Star className="w-3.5 h-3.5" />
              <span>Mark & Next</span>
            </button>
            <button
              onClick={handleClearResponse}
              className="flex-1 border border-white/10 hover:border-red-500 hover:text-red-400 py-3.5 rounded-xl font-bold text-xs active:scale-[0.97] transition"
            >
              Clear
            </button>
            <button
              onClick={handleSaveAndNext}
              className="flex-1 bg-accent hover:bg-amber-500 text-slate-950 py-3.5 rounded-xl font-bold text-xs active:scale-[0.97] transition flex items-center justify-center gap-1"
            >
              <span>Save & Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* OMR PALETTE SIDEBAR DRAWER */}
          {drawerOpen && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <div onClick={() => setDrawerOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              
              <div className="relative w-80 max-w-full h-full bg-slate-900 border-l border-white/10 flex flex-col z-10 shadow-2xl">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground">OMR Bubble Sheet</h3>
                  <button onClick={() => setDrawerOpen(false)} className="p-1 bg-white/5 hover:bg-white/10 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex border-b border-white/5 text-xs text-center font-bold">
                  <button 
                    onClick={() => setPaletteView('grid')}
                    className={`flex-1 py-3 border-b-2 flex items-center justify-center gap-1 ${
                      paletteView === 'grid' ? 'border-accent text-accent' : 'border-transparent text-foreground/40'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" /> Grid
                  </button>
                  <button 
                    onClick={() => setPaletteView('list')}
                    className={`flex-1 py-3 border-b-2 flex items-center justify-center gap-1 ${
                      paletteView === 'list' ? 'border-accent text-accent' : 'border-transparent text-foreground/40'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" /> List
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {paletteView === 'grid' ? (
                    <div className="grid grid-cols-5 gap-3">
                      {test.questions.map((_, idx) => {
                        const status = getQuestionStatus(idx);
                        const isCurrent = idx === currentIdx;
                        
                        let bubbleStyle = 'bg-slate-950 border-white/10 text-foreground/40';
                        if (isCurrent) {
                          bubbleStyle = 'border-accent ring-2 ring-accent/35 text-accent font-black';
                        } else if (status === 'answered-marked') {
                          bubbleStyle = 'bg-purple-500 text-white border-purple-400';
                        } else if (status === 'answered') {
                          bubbleStyle = 'bg-emerald-500 text-white border-emerald-400';
                        } else if (status === 'marked') {
                          bubbleStyle = 'bg-amber-500 text-white border-amber-400';
                        } else if (status === 'unattempted') {
                          bubbleStyle = 'bg-red-500 text-white border-red-400';
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => { handleNavigateQuestion(idx); setDrawerOpen(false); }}
                            className={`w-10 h-10 rounded-full border flex items-center justify-center text-xs font-mono font-bold transition active:scale-90 ${bubbleStyle}`}
                          >
                            {status === 'marked' ? '★' : idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {test.questions.map((q, idx) => {
                        const status = getQuestionStatus(idx);
                        const isCurrent = idx === currentIdx;
                        
                        let dotColor = 'bg-slate-800';
                        if (status === 'answered-marked') dotColor = 'bg-purple-500';
                        else if (status === 'answered') dotColor = 'bg-emerald-500';
                        else if (status === 'marked') dotColor = 'bg-amber-500';
                        else if (status === 'unattempted') dotColor = 'bg-red-500';

                        return (
                          <button
                            key={idx}
                            onClick={() => { handleNavigateQuestion(idx); setDrawerOpen(false); }}
                            className={`w-full text-left p-2.5 rounded-xl border flex items-center gap-3 transition active:scale-98 ${
                              isCurrent ? 'bg-accent/10 border-accent' : 'bg-white/3 border-white/5'
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-full ${dotColor} text-[10px] font-black text-white flex items-center justify-center font-mono shrink-0`}>
                              {idx + 1}
                            </span>
                            <span className="text-xs text-foreground/80 truncate flex-1">
                              {lang === 'hi' ? q.qHi : q.qEn}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-white/5">
                  <button
                    onClick={() => { setDrawerOpen(false); setIsSubmitSheetOpen(true); }}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl text-xs active:scale-[0.98] transition uppercase tracking-wider"
                  >
                    Submit Test Paper
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUBMIT CONFIRMATION SHEET MODAL */}
          {isSubmitSheetOpen && (
            <div className="fixed inset-0 z-50 flex items-end justify-center">
              <div onClick={() => setIsSubmitSheetOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              
              <div className="relative w-full max-w-md bg-slate-900 border-t border-white/10 rounded-t-3xl p-6 space-y-4 z-10 shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="w-12 h-1 bg-white/15 rounded-full mx-auto" />
                <h3 className="text-center font-extrabold text-foreground text-sm uppercase tracking-wider">Confirm Test Submission</h3>
                
                <div className="space-y-2.5 text-xs text-foreground/80 font-mono">
                  <div className="flex items-center justify-between border-b border-white/5 py-2">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-accent" /> Time Remaining</span>
                    <span className="font-bold text-accent">{formatTime(timeLeft)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 py-2">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Attempted</span>
                    <span className="font-bold text-emerald-400">{Object.keys(selectedAnswers).length} Qs</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 py-2">
                    <span className="flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5 text-foreground/40" /> Unattempted</span>
                    <span className="font-bold text-foreground/50">{test.questions.length - Object.keys(selectedAnswers).length} Qs</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 py-2">
                    <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-400" /> Marked for Review</span>
                    <span className="font-bold text-amber-400">{Object.keys(markedForReview).length} Qs</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsSubmitSheetOpen(false)}
                    className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 py-3.5 rounded-xl font-bold text-xs transition active:scale-95"
                  >
                    No, Resume
                  </button>
                  <button
                    onClick={handleSubmitTest}
                    className="flex-1 bg-accent hover:bg-amber-500 text-slate-950 py-3.5 rounded-xl font-bold text-xs transition active:scale-95 shadow-md uppercase tracking-wider"
                  >
                    Yes, Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5 Mins Warning sheet */}
          {showWarning && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl max-w-xs text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto animate-bounce" />
                <h3 className="text-sm font-black text-foreground uppercase tracking-wider">5 Minutes Left!</h3>
                <p className="text-xs text-foreground/60 leading-relaxed">
                  समय समाप्त होने वाला है। जल्दी से अपने बचे हुए प्रश्नों का उत्तर देकर OMR शीट सबमिट करें।
                </p>
                <button 
                  onClick={() => setShowWarning(false)}
                  className="w-full bg-accent text-slate-950 font-bold py-2.5 rounded-xl active:scale-95 text-xs transition"
                >
                  OK, Understood
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* PHASE 3: COMPREHENSIVE RESULT & SCORE ANALYSIS SCREEN   */}
      {/* ──────────────────────────────────────────────────────── */}
      {phase === 'result' && (
        <div className="h-full w-full overflow-y-auto p-4 pb-28 space-y-6 max-w-3xl mx-auto no-scrollbar" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top, 0px))' }}>
          {/* Header */}
          <div className="flex items-center justify-between bg-slate-900/60 border border-white/5 p-4 rounded-2xl">
            <h1 className="text-sm md:text-base font-bold text-foreground">
              {lang === 'hi' ? test.titleHi : test.titleEn} - Result
            </h1>
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-accent" /> Dashboard
            </button>
          </div>

          {/* Scoreboard stat blocks */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            <div className="premium-card p-3 text-center bg-slate-900/40 border-white/5">
              <span className="text-[9px] text-foreground/40 block">Final Score</span>
              <span className="text-sm font-black text-accent">{finalScore}</span>
            </div>
            <div className="premium-card p-3 text-center bg-slate-900/40 border-white/5">
              <span className="text-[9px] text-foreground/40 block">Correct</span>
              <span className="text-sm font-black text-emerald-400">{correctCount} Qs</span>
            </div>
            <div className="premium-card p-3 text-center bg-slate-900/40 border-white/5">
              <span className="text-[9px] text-foreground/40 block">Incorrect</span>
              <span className="text-sm font-black text-red-400">{incorrectCount} Qs</span>
            </div>
            <div className="premium-card p-3 text-center bg-slate-900/40 border-white/5">
              <span className="text-[9px] text-foreground/40 block">Left</span>
              <span className="text-sm font-black text-foreground/50">{unattemptedCount} Qs</span>
            </div>
            <div className="premium-card p-3 text-center bg-slate-900/40 border-white/5 col-span-3 sm:col-span-1">
              <span className="text-[9px] text-foreground/40 block">Accuracy</span>
              <span className="text-sm font-black text-amber-400">{accuracy}%</span>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-white/5 text-xs font-bold text-center font-sans">
            <button
              onClick={() => setResultTab('analysis')}
              className={`flex-1 py-3.5 border-b-2 flex items-center justify-center gap-1 ${
                resultTab === 'analysis' ? 'border-accent text-accent' : 'border-transparent text-foreground/40'
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Analysis
            </button>
            <button
              onClick={() => setResultTab('solutions')}
              className={`flex-1 py-3.5 border-b-2 flex items-center justify-center gap-1 ${
                resultTab === 'solutions' ? 'border-accent text-accent' : 'border-transparent text-foreground/40'
              }`}
            >
              <HelpCircle className="w-4 h-4" /> Solutions
            </button>
            <button
              onClick={() => setResultTab('leaderboard')}
              className={`flex-1 py-3.5 border-b-2 flex items-center justify-center gap-1 ${
                resultTab === 'leaderboard' ? 'border-accent text-accent' : 'border-transparent text-foreground/40'
              }`}
            >
              <Trophy className="w-4 h-4" /> Leaderboard
            </button>
          </div>

          {/* TAB 1: ANALYSIS WIDGETS */}
          {resultTab === 'analysis' && (
            <div className="space-y-6">
              
              {/* Premium Re-Attempt Banner */}
              <div className="p-4 bg-gradient-to-r from-accent/15 via-accent/5 to-transparent border border-accent/20 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-foreground uppercase tracking-wide">Get Unlimited Re-Attempts</h4>
                  <p className="text-[10px] text-foreground/50 mt-0.5">Practice again to secure a higher merit ranking.</p>
                </div>
                <button 
                  onClick={handleRetryTest}
                  className="px-3.5 py-2 bg-accent hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black transition active:scale-95 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Re-take Test
                </button>
              </div>

              {/* Quick Summary Cards */}
              <div className="premium-card p-5 bg-slate-900/40 space-y-3.5">
                <h3 className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Quick Score Summary</h3>
                <div className="space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-foreground/40 flex items-center gap-1">🏅 Merit Rank</span>
                    <span className="font-bold text-foreground">#{correctCount === test.questions.length ? 124 : (1894 + incorrectCount * 398)} / 24,891</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-foreground/40 flex items-center gap-1">🏆 Total Score</span>
                    <span className="font-bold text-accent">{finalScore} / {test.totalMarks} Marks</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-foreground/40 flex items-center gap-1">📊 Percentile</span>
                    <span className="font-bold text-foreground">
                      {correctCount === test.questions.length ? '99.8' : (64 + correctCount * 7).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-foreground/40 flex items-center gap-1">⚡ Net Accuracy</span>
                    <span className="font-bold text-foreground">{accuracy}%</span>
                  </div>
                </div>
              </div>

              {/* Compare Bar Chart */}
              <div className="premium-card p-5 bg-slate-900/40 space-y-4">
                <h3 className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Topper vs Average Comparison</h3>
                <div className="flex items-end justify-around h-32 pt-4">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold font-mono text-accent">{finalScore}</span>
                    <div className="w-10 bg-accent rounded-t-lg transition-all duration-1000 shadow-[0_0_15px_rgba(216,155,60,0.4)]" style={{ height: `${Math.max((finalScore / test.totalMarks) * 80, 10)}px` }} />
                    <span className="text-[10px] text-foreground/60">You</span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold font-mono text-emerald-400">{test.totalMarks}</span>
                    <div className="w-10 bg-emerald-500/80 rounded-t-lg transition-all duration-1000" style={{ height: '80px' }} />
                    <span className="text-[10px] text-foreground/60">Topper</span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold font-mono text-foreground/40">{(test.totalMarks * 0.45).toFixed(1)}</span>
                    <div className="w-10 bg-white/10 rounded-t-lg transition-all duration-1000" style={{ height: '36px' }} />
                    <span className="text-[10px] text-foreground/60">Average</span>
                  </div>
                </div>
              </div>

              {/* Quality Survey Star Rating */}
              <div className="premium-card p-5 bg-slate-900/40 text-center space-y-3">
                <h3 className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Rate the Quality of this Mock Test</h3>
                <p className="text-[10px] text-foreground/45">Help us feed better UPSC exam questions to our AI compiler.</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      className="p-1 active:scale-90 transition"
                    >
                      <Star className={`w-7 h-7 ${
                        userRating && star <= userRating ? 'text-accent fill-accent' : 'text-foreground/20'
                      }`} />
                    </button>
                  ))}
                </div>
                {userRating && (
                  <p className="text-[10px] text-emerald-400 font-bold font-mono">Thank you for rating {userRating} Stars! ⭐</p>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: SOLUTIONS & EXPLANATIONS */}
          {resultTab === 'solutions' && (
            <div className="space-y-4">
              {test.questions.map((q, idx) => {
                const userAns = selectedAnswers[idx];
                const isCorrect = userAns === q.correctOption;
                const isUnattempted = userAns === undefined;

                return (
                  <div key={q.id} className="premium-card p-5 bg-slate-900/40 space-y-4">
                    <div className="flex justify-between items-start border-b border-white/5 pb-2">
                      <span className="text-[10px] font-bold bg-white/5 border border-white/10 text-accent px-2 py-0.5 rounded font-mono">
                        Q. {idx + 1} ({q.subject})
                      </span>
                      {isUnattempted ? (
                        <span className="text-[9px] font-bold bg-slate-800 text-foreground/40 px-2 py-0.5 rounded uppercase">LEFT</span>
                      ) : isCorrect ? (
                        <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded uppercase">CORRECT</span>
                      ) : (
                        <span className="text-[9px] font-bold bg-red-500/10 text-red-400 px-2 py-0.5 rounded uppercase">WRONG</span>
                      )}
                    </div>

                    <p className="text-xs md:text-sm font-medium text-foreground leading-relaxed">
                      {lang === 'hi' ? q.qHi : q.qEn}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {(lang === 'hi' ? q.optionsHi : q.optionsEn).map((optText, optIdx) => {
                        let optStyle = 'border-white/5 bg-slate-950/20 text-foreground/60';
                        if (optIdx === q.correctOption) {
                          optStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold';
                        } else if (userAns === optIdx && !isCorrect) {
                          optStyle = 'border-red-500 bg-red-500/10 text-red-400';
                        }

                        return (
                          <div key={optIdx} className={`p-3 rounded-lg border ${optStyle}`}>
                            {String.fromCharCode(65 + optIdx)}. {optText}
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl space-y-1.5">
                      <p className="text-[10px] text-accent font-extrabold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Explanation
                      </p>
                      <p className="text-xs text-foreground/75 leading-relaxed font-light">
                        {lang === 'hi' ? q.explanationHi : q.explanationEn}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: TEST LEADERBOARD */}
          {resultTab === 'leaderboard' && (
            <div className="premium-card p-5 bg-slate-900/40 space-y-4">
              <h3 className="text-xs font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-accent" />
                UPSC Mock Leaderboard
              </h3>
              
              <div className="space-y-2.5">
                {[
                  { rank: 1, emoji: '🥇', name: 'Ayush Goel (AIR 3)', score: test.totalMarks, time: '38:12 Mins' },
                  { rank: 2, emoji: '🥈', name: 'Shubham Kumar', score: test.totalMarks - test.negativeMarks, time: '42:50 Mins' },
                  { rank: 3, emoji: '🥉', name: 'Divya Tanwar', score: test.totalMarks - test.negativeMarks * 2, time: '48:10 Mins' },
                  { rank: 4, emoji: '👤', name: 'You (Aspirant)', score: finalScore, time: `${formatShortTime((test.durationMins * 60) - timeLeft)} Mins`, isUser: true }
                ].map((row, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-center gap-3 p-3 rounded-2xl border ${
                      row.isUser ? 'bg-accent/15 border-accent/30 font-bold' : 'bg-white/3 border-white/5'
                    }`}
                  >
                    <span className="w-8 h-8 rounded-full bg-slate-950/40 border border-white/10 flex items-center justify-center text-xs font-black font-mono shrink-0">
                      {row.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-foreground truncate block">{row.name}</span>
                      <span className="text-[9px] text-foreground/40 font-mono block">Duration: {row.time}</span>
                    </div>
                    <span className="text-xs font-bold font-mono text-accent shrink-0">
                      {row.score} Marks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Share & Return Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`🎯 I scored ${finalScore} marks on the UPSC test "${test.titleEn}" on PrepAI!`);
                alert('Copied score metrics details to your clipboard! Share with your friends.');
              }}
              className="w-full bg-white/5 border border-white/10 hover:border-accent text-foreground font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-1.5 text-xs active:scale-95"
            >
              <Share2 className="w-4 h-4" /> Share Scorecard
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-accent hover:bg-amber-500 text-slate-950 font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-1.5 text-xs active:scale-95"
            >
              <LayoutDashboard className="w-4 h-4" /> Return to Dashboard
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
