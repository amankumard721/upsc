'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Heart, 
  MessageCircle, 
  Play, 
  HelpCircle,
  Volume2,
  VolumeX
} from 'lucide-react';

interface SampleVideo {
  id: string;
  videoUrl: string;
  title: string;
  description: string;
  bookName: string;
  chapterId: string;
  likes: number;
  isLiked: boolean;
  commentsCount: number;
}

export default function SamplesPage() {
  const [isMuted, setIsMuted] = useState(true);
  const [showCommentsToast, setShowCommentsToast] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const [samples, setSamples] = useState<SampleVideo[]>([
    {
      id: "1",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-holding-a-globe-in-his-hands-4050-large.mp4",
      title: "झारखंड का भूगोल: नदियों की स्थिति",
      description: "दामोदर नदी झारखंड की सबसे लंबी और सबसे बड़ी नदी है। यह पलामू के तोरी क्षेत्र (लातेहार) से निकलती है और इसे 'देव नद' भी कहा जाता है।",
      bookName: "झारखंड का भूगोल",
      chapterId: "46af8ec4-9c17-4029-86d1-b4e56c1027b7",
      likes: 284,
      isLiked: false,
      commentsCount: 32
    },
    {
      id: "2",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-spinning-political-globe-2022-large.mp4",
      title: "झारखंड का इतिहास: राज्य गठन",
      description: "15 नवंबर 2000 को भगवान बिरसा मुंडा की जयंती के दिन बिहार से अलग होकर झारखंड भारत का 28वां राज्य बना था। इसमें कुल 18 जिले शामिल थे।",
      bookName: "झारखंड का इतिहास",
      chapterId: "65ea2e3f-91f8-4d3b-bb87-0dc3e54097b8",
      likes: 512,
      isLiked: false,
      commentsCount: 45
    },
    {
      id: "3",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hand-writing-in-a-notebook-42289-large.mp4",
      title: "शिक्षा एवं मनोविज्ञान: थार्नडाइक के नियम",
      description: "थार्नडाइक ने सीखने के तीन मुख्य नियम दिए: तत्परता का नियम (Law of Readiness), अभ्यास का नियम (Law of Exercise) और प्रभाव का नियम (Law of Effect)।",
      bookName: "Child Development & Pedagogy",
      chapterId: "46af8ec4-9c17-4029-86d1-b4e56c1027b7",
      likes: 198,
      isLiked: false,
      commentsCount: 14
    },
    {
      id: "4",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4",
      title: "पर्यावरण अध्ययन: हाथियों का झुंड",
      description: "हाथियों के झुंड की नेता सबसे बुजुर्ग हथिनी होती है। एक झुंड में केवल हथिनियां और उनके बच्चे ही रहते हैं। हाथी 14-15 साल की उम्र में झुंड छोड़ देते हैं।",
      bookName: "Environmental Studies",
      chapterId: "46af8ec4-9c17-4029-86d1-b4e56c1027b7",
      likes: 341,
      isLiked: false,
      commentsCount: 29
    }
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const height = container.clientHeight;
      const index = Math.round(scrollTop / height);
      if (index >= 0 && index < samples.length) {
        setActiveIndex(index);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [samples.length]);

  const toggleLike = (index: number) => {
    setSamples(prev => prev.map((item, idx) => {
      if (idx === index) {
        return {
          ...item,
          isLiked: !item.isLiked,
          likes: item.isLiked ? item.likes - 1 : item.likes + 1
        };
      }
      return item;
    }));
  };

  const showComments = () => {
    setShowCommentsToast(true);
    setTimeout(() => setShowCommentsToast(false), 2500);
  };

  return (
    <div className="flex items-center justify-center min-h-[75vh] py-4 select-none relative">
      
      {/* Outer Shell - custom scroll container with CSS snapping */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-sm h-[70vh] bg-black rounded-3xl overflow-y-scroll snap-y snap-mandatory border border-white/10 shadow-2xl no-scrollbar scroll-smooth"
      >
        {samples.map((item, index) => (
          <VideoRow 
            key={item.id}
            item={item}
            index={index}
            isActive={index === activeIndex}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            toggleLike={() => toggleLike(index)}
            showComments={showComments}
          />
        ))}
      </div>

      {/* Floating scroll indicator/tip */}
      <div className="absolute right-4 md:right-auto md:left-[60%] text-center text-xs text-foreground/40 font-light flex flex-col items-center space-y-1">
        <span className="animate-bounce">↓</span>
        <span>Scroll / Swipe</span>
      </div>

      {/* Comments section toast simulation */}
      {showCommentsToast && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 text-white text-xs px-4 py-3 rounded-xl shadow-xl z-50 flex items-center space-x-2 animate-bounce">
          <span className="w-2 h-2 bg-accent rounded-full animate-ping" />
          <span>Comments section coming soon!</span>
        </div>
      )}
    </div>
  );
}

interface VideoRowProps {
  item: SampleVideo;
  index: number;
  isActive: boolean;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  toggleLike: () => void;
  showComments: () => void;
}

function VideoRow({ 
  item, 
  index, 
  isActive, 
  isMuted, 
  setIsMuted, 
  toggleLike, 
  showComments 
}: VideoRowProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(err => {
          console.log("Autoplay blocked: requires user interaction.", err);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  return (
    <div className="w-full h-full relative snap-start snap-always shrink-0 flex flex-col justify-end">
      
      {/* HTML5 Video element */}
      <video 
        ref={videoRef}
        src={item.videoUrl}
        loop
        muted={isMuted}
        playsInline
        className="absolute inset-0 w-full h-full object-cover cursor-pointer"
        onClick={() => {
          if (videoRef.current) {
            if (videoRef.current.paused) videoRef.current.play();
            else videoRef.current.pause();
          }
        }}
      />

      {/* Video Overlay Info (Bottom Left) */}
      <div className="absolute bottom-0 left-0 right-16 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 space-y-2.5 z-10 pointer-events-none">
        <span className="inline-block bg-accent text-slate-950 font-bold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider">
          {item.bookName}
        </span>
        <h2 className="text-white text-base font-bold tracking-tight">{item.title}</h2>
        <p className="text-white/70 text-xs font-light leading-relaxed max-w-[280px]">
          {item.description}
        </p>
      </div>

      {/* Action Buttons (Right Side) */}
      <div className="absolute right-3 bottom-6 flex flex-col items-center space-y-5 z-20">
        
        {/* Mute toggle */}
        <button 
          onClick={() => setIsMuted(!isMuted)} 
          className="flex flex-col items-center text-white/80 hover:text-white transition-all bg-black/40 p-2.5 rounded-full backdrop-blur-sm border border-white/5"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-accent" />}
        </button>

        {/* Like */}
        <button 
          onClick={toggleLike}
          className="flex flex-col items-center text-white transition-all group"
        >
          <div className="bg-black/40 p-3 rounded-full backdrop-blur-sm border border-white/5 group-hover:scale-105 transition-all">
            <Heart className={`w-5 h-5 ${item.isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </div>
          <span className="text-[10px] font-bold mt-1 text-white/60">{item.likes}</span>
        </button>

        {/* Comments */}
        <button 
          onClick={showComments}
          className="flex flex-col items-center text-white transition-all group"
        >
          <div className="bg-black/40 p-3 rounded-full backdrop-blur-sm border border-white/5 group-hover:scale-105 transition-all">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-bold mt-1 text-white/60">{item.commentsCount}</span>
        </button>

        {/* Play Lesson link */}
        <Link 
          href={`/lesson/${item.chapterId}`}
          className="flex flex-col items-center text-white transition-all group"
        >
          <div className="bg-accent/20 border border-accent/30 p-3.5 rounded-full backdrop-blur-sm group-hover:scale-105 transition-all">
            <Play className="w-5 h-5 fill-accent text-accent" />
          </div>
          <span className="text-[8px] font-bold mt-1 text-accent uppercase tracking-wider">Lesson</span>
        </Link>

        {/* Quiz Practice link */}
        <Link 
          href={`/quiz/${item.chapterId}`}
          className="flex flex-col items-center text-white transition-all group"
        >
          <div className="bg-amber-500/20 border border-amber-500/30 p-3 rounded-full backdrop-blur-sm group-hover:scale-105 transition-all">
            <HelpCircle className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-[8px] font-bold mt-1 text-amber-400 uppercase tracking-wider">Practice</span>
        </Link>
      </div>
    </div>
  );
}
