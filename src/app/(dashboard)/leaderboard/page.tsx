'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/supabase';
import { LeaderboardEntry, UserProfile } from '@/types';
import { 
  Trophy, 
  Flame, 
  Zap, 
  Award, 
  ArrowLeft, 
  TrendingUp, 
  Crown,
  Search
} from 'lucide-react';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'Weekly' | 'Monthly' | 'All-Time'>('Weekly');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboardData() {
      try {
        const prof = await db.getUserProfile();
        setProfile(prof);

        const list = await db.getLeaderboard();
        setLeaderboard(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboardData();
  }, [activeTab]); // re-fetch if tab changes (simulating database updates)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-white/50 font-light">Retrieving global rankings...</p>
      </div>
    );
  }

  // Filter leaderboard by search query
  const filteredList = leaderboard.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Top 3 positions
  const podium = filteredList.slice(0, 3);
  const regularList = filteredList.slice(3);

  return (
    <div className="space-y-8 font-sans max-w-4xl mx-auto pb-16">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <Link href="/dashboard" className="text-sm text-white/60 hover:text-accent inline-flex items-center space-x-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-white flex items-center">
            <Trophy className="w-7 h-7 text-accent mr-2" />
            <span>Academy Rankings</span>
          </h1>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search aspirants..."
            className="w-full bg-slate-950 border border-white/10 focus:border-accent text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none transition-all placeholder:text-white/20"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center space-x-2 bg-slate-900/40 p-1.5 rounded-2xl border border-white/5 max-w-sm mx-auto">
        {(['Weekly', 'Monthly', 'All-Time'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-xs py-2 rounded-xl font-medium transition-all ${
              activeTab === tab
                ? 'bg-accent text-slate-950 font-bold shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Podium (Top 3 Users) */}
      {podium.length > 0 && searchQuery === '' && (
        <div className="grid grid-cols-3 gap-4 items-end max-w-xl mx-auto pt-6 pb-2">
          
          {/* Rank 2 (Silver) */}
          {podium[1] && (
            <div className="flex flex-col items-center space-y-2">
              <div className="relative">
                <img 
                  src={podium[1].avatar_url} 
                  alt={podium[1].name} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-slate-300 shadow-lg"
                />
                <span className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 bg-slate-300 text-slate-950 font-mono text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border border-slate-900">
                  2
                </span>
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-white leading-snug line-clamp-1">{podium[1].name.split(' ')[0]}</div>
                <div className="flex items-center justify-center text-[10px] text-accent font-mono font-bold mt-0.5">
                  <Zap className="w-3 h-3 fill-accent mr-0.5" />
                  <span>{podium[1].total_points}</span>
                </div>
              </div>
              <div className="w-full h-16 bg-slate-800/40 rounded-t-xl border-t border-x border-white/5 flex items-center justify-center">
                <Award className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          )}

          {/* Rank 1 (Gold Crown) */}
          {podium[0] && (
            <div className="flex flex-col items-center space-y-2">
              <div className="relative -top-4">
                <Crown className="w-6 h-6 text-accent absolute -top-5 left-1/2 transform -translate-x-1/2 drop-shadow-md animate-bounce-slow" />
                <img 
                  src={podium[0].avatar_url} 
                  alt={podium[0].name} 
                  className="w-20 h-20 rounded-full object-cover border-3 border-accent shadow-xl shadow-accent/5"
                />
                <span className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 bg-accent text-slate-950 font-mono text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-slate-900">
                  1
                </span>
              </div>
              <div className="text-center relative -top-3">
                <div className="text-sm font-extrabold text-white leading-snug line-clamp-1">{podium[0].name.split(' ')[0]}</div>
                <div className="flex items-center justify-center text-xs text-accent font-mono font-bold mt-0.5">
                  <Zap className="w-3.5 h-3.5 fill-accent mr-0.5" />
                  <span>{podium[0].total_points}</span>
                </div>
              </div>
              <div className="w-full h-24 bg-gradient-to-t from-slate-950/40 to-slate-850/60 rounded-t-xl border-t border-x border-accent/20 flex items-center justify-center relative -top-3">
                <Crown className="w-6 h-6 text-accent" />
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {podium[2] && (
            <div className="flex flex-col items-center space-y-2">
              <div className="relative">
                <img 
                  src={podium[2].avatar_url} 
                  alt={podium[2].name} 
                  className="w-14 h-14 rounded-full object-cover border-2 border-amber-700 shadow-md"
                />
                <span className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 bg-amber-700 text-white font-mono text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border border-slate-900">
                  3
                </span>
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-white leading-snug line-clamp-1">{podium[2].name.split(' ')[0]}</div>
                <div className="flex items-center justify-center text-[10px] text-accent font-mono font-bold mt-0.5">
                  <Zap className="w-3 h-3 fill-accent mr-0.5" />
                  <span>{podium[2].total_points}</span>
                </div>
              </div>
              <div className="w-full h-12 bg-slate-800/40 rounded-t-xl border-t border-x border-white/5 flex items-center justify-center">
                <Award className="w-4 h-4 text-amber-700" />
              </div>
            </div>
          )}

        </div>
      )}

      {/* Leaderboard Table List */}
      <div className="premium-card overflow-hidden bg-slate-900/20 border border-white/10 rounded-2xl">
        <div className="px-6 py-4 bg-slate-950/40 border-b border-white/5 flex justify-between text-[10px] font-mono text-white/40 uppercase tracking-widest">
          <span>Rank & Aspirant</span>
          <div className="flex items-center space-x-12 pr-4">
            <span className="hidden sm:inline">Streak</span>
            <span>Academy XP</span>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {filteredList.map((user) => {
            const isSelf = user.name.includes('(You)') || user.id === 'mock-user-123';
            
            return (
              <div 
                key={user.id} 
                className={`px-6 py-4 flex items-center justify-between transition-all ${
                  isSelf 
                    ? 'bg-accent/5 border-l-4 border-accent text-white' 
                    : 'hover:bg-white/[0.01]'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                    user.rank === 1 ? 'bg-amber-500/20 text-amber-400' :
                    user.rank === 2 ? 'bg-slate-300/20 text-slate-200' :
                    user.rank === 3 ? 'bg-amber-800/20 text-amber-600' :
                    'text-white/40'
                  }`}>
                    {user.rank}
                  </span>
                  
                  <img 
                    src={user.avatar_url} 
                    alt={user.name} 
                    className={`w-9 h-9 rounded-full object-cover shadow-sm ${
                      isSelf ? 'border border-accent' : 'border border-white/10'
                    }`}
                  />
                  
                  <div>
                    <span className="text-xs md:text-sm font-bold text-white flex items-center gap-1.5">
                      {user.name}
                      {isSelf && (
                        <span className="bg-accent/15 border border-accent/20 text-accent text-[9px] font-bold px-2 py-0.2 rounded-full uppercase tracking-wider scale-95 font-mono">
                          You
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-white/40 block sm:hidden mt-0.5">
                      Streak: {user.streak} days
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-12 pr-4 font-mono">
                  {/* Streak */}
                  <div className="hidden sm:flex items-center space-x-1 text-xs text-amber-500/80">
                    <Flame className="w-3.5 h-3.5 fill-amber-500/25" />
                    <span>{user.streak} d</span>
                  </div>

                  {/* Points */}
                  <div className="flex items-center space-x-1 text-xs md:text-sm font-bold text-accent">
                    <Zap className="w-3.5 h-3.5 fill-accent" />
                    <span>{user.total_points}</span>
                  </div>
                </div>

              </div>
            );
          })}

          {filteredList.length === 0 && (
            <div className="text-center py-12 text-xs text-white/30 italic">
              No aspirants match your search criteria.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
