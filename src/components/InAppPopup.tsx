'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/supabase';
import { X, ExternalLink } from 'lucide-react';

export default function InAppPopup() {
  const [popup, setPopup] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Fetch active popup from database/local storage config
    db.getActivePopup().then(active => {
      if (active && active.is_active) {
        const closedId = localStorage.getItem('jtet_last_closed_popup_id');
        // Only show if user hasn't closed this specific popup ID yet
        if (closedId !== active.id) {
          setPopup(active);
          // Small delay for clean entrance
          const t = setTimeout(() => setIsOpen(true), 2000);
          return () => clearTimeout(t);
        }
      }
    }).catch(err => {
      console.warn('Error fetching active popup:', err);
    });
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (popup) {
      localStorage.setItem('jtet_last_closed_popup_id', popup.id);
    }
  };

  const handleActionClick = () => {
    handleClose();
    if (popup.action_url) {
      if (popup.action_url.startsWith('http://') || popup.action_url.startsWith('https://')) {
        window.open(popup.action_url, '_blank');
      } else {
        router.push(popup.action_url);
      }
    }
  };

  if (!popup || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300 animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-[#070B16] border border-accent/20 rounded-3xl shadow-2xl overflow-hidden animate-scale-up"
        style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 40px rgba(16,185,129,0.1)' }}
      >
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-3 right-3 z-20 p-2 bg-slate-900/80 hover:bg-slate-900 border border-white/10 hover:border-white/20 text-white/70 hover:text-white rounded-full transition active:scale-95 outline-none"
          aria-label="Close Notification"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Popup Image */}
        <div className="relative aspect-video w-full bg-slate-900 overflow-hidden group">
          <img 
            src={popup.image_url} 
            alt={popup.title || 'In-App Announcement'} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              (e.target as any).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070B16] via-transparent to-transparent" />
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-4">
          {popup.title && (
            <h3 className="text-base font-bold text-foreground font-display leading-snug tracking-wide">
              {popup.title}
            </h3>
          )}
          
          {popup.description && (
            <p className="text-xs text-foreground/60 leading-relaxed font-medium">
              {popup.description}
            </p>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={handleActionClick}
              className="w-full bg-[#10B981] hover:bg-emerald-500 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs transition duration-200 active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <span>{popup.action_label || 'Check It Out'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
