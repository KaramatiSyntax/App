'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Trophy, Settings, KeyRound, Clipboard, Check, Gamepad2, Target, Zap, Crown, Shield, Star, Medal, X, Share2 } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import Image from "next/image";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useAlert } from "@/components/AlertProvider";
import { useUserData } from "@/lib/hooks/useUserData";
import { useRouteLoading } from "@/lib/hooks/useRouteLoading";
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

// Modern blue tick SVG component with click handler
function BlueTick({ onClick }) {
  return (
    <span className="inline-block align-middle ml-1 cursor-pointer" title="Verified" onClick={onClick}>
      <svg className="w-[1em] h-[1em] text-blue-500 inline drop-shadow" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#2563eb" />
        <path d="M8.5 12.5l2.2 2.2 4.3-4.4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

const handleLogout = async () => {
  try {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      // Clear all local storage and session storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
    }
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
    // Clear storage anyway and redirect
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    window.location.href = '/login';
  }
};

export default function ProfilePage() {
  const { userData, loading, refreshUserData } = useUserData();
  const { routeData, isLoading } = useRouteLoading();

  // Get joined matches from route data or fetch them
  const [joinedMatches, setJoinedMatches] = useState([]);
  const [joinedLoading, setJoinedLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [timers, setTimers] = useState([]);
  const [showRoomFor, setShowRoomFor] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [showAllMatches, setShowAllMatches] = useState(false);
  const { showSuccessAlert, showErrorAlert } = useAlert();
  const router = useRouter();
  const [showVerifiedDialog, setShowVerifiedDialog] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const userCoins = userData?.coins ?? 0;

  // Helper to get display name
  const displayName = (userData?.firstName || userData?.lastName)
    ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
    : userData?.username || userData?.email;

  // Helper to get time left as {hours, minutes, seconds}
  function getTimeLeft(matchTime) {
    const now = new Date().getTime();
    const matchDate = new Date(matchTime).getTime();
    const timeLeft = matchDate - now;

    if (timeLeft <= 0) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  }

  // Update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers = joinedMatches.map(match => getTimeLeft(match.time));
      setTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [joinedMatches]);

  // Fetch joined matches when user data is available
  useEffect(() => {
    const fetchJoinedMatches = async () => {
      if (!userData?.email) return;

      setJoinedLoading(true);
      try {
        const response = await fetch(`/api/matches?username=${userData.username || userData.email.split("@")[0]}`);
        if (response.ok) {
          const data = await response.json();

          // Sort matches: upcoming first, running second, completed last
          const sortedMatches = data.sort((a, b) => {
            // Define priority order: upcoming > running > completed
            const statusPriority = {
              'upcoming': 1,
              'running': 2,
              'completed': 3
            };

            const aPriority = statusPriority[a.status] || 4;
            const bPriority = statusPriority[b.status] || 4;

            // If same status, sort by time (earliest first for upcoming, latest first for completed)
            if (aPriority === bPriority) {
              if (a.status === 'completed') {
                // For completed matches, show most recent first
                return new Date(b.time) - new Date(a.time);
              } else {
                // For upcoming/running matches, show earliest first
                return new Date(a.time) - new Date(b.time);
              }
            }

            return aPriority - bPriority;
          });

          setJoinedMatches(sortedMatches);
        }
      } catch (error) {
        console.error('Error fetching joined matches:', error);
      } finally {
        setJoinedLoading(false);
      }
    };

    fetchJoinedMatches();
  }, [userData?.email, userData?.username]);

  const handleShareReferral = async () => {
    if (!userData?.referralCode) return;

    const referralMessage = `╭─━━━━━༺❀༻━━━━━─╮
               ✧.* 𝙅𝙤𝙞𝙣 𝙏𝙪𝙧𝙧𝙖𝙣𝙞𝙓! ✧.*
╰─━━━━━༺❀༻━━━━━─╯
₊˚⊹🕹️ Play daily matches
₊˚⊹🎁 Win exclusive prizes
₊˚⊹🆓 Some free matches to join!
𓆩♡𓆪

>ᴗ< Use my referral code: 
  ╰┈➤【 KARA6XZ 】

𖡡 Sign up now & get ₹5!
// Join India's fastest growing community!

🌐  turrani-esports.vercel.app

꒰🎮꒱  Socials & Updates:
• Instagram: https://instagram.com/turrani_esports
• Telegram: https://t.me/turraniEsports

⋆˙⟡₊*˖. Share & Play with me! .˖*₊⟡˙⋆
https://turrani-esports.vercel.app/`.trim();


    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join TurraniX - Earn Rewards & Play Matches",
          text: referralMessage,
          url: "https://turrani-esports.vercel.app",
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(referralMessage)
        .then(() => {
          showSuccessAlert('Referral details copied! Share it with friends.');
        })
        .catch((err) => {
          showErrorAlert('Failed to copy referral details.');
          console.error(err);
        });
    }
  };


  // Show authentication required only when not loading and no user data
  if (!userData) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 pt-8 pb-24">
          <div className="max-w-6xl mx-auto">
            <Card className="p-6 sm:p-8 rounded-2xl border border-white/20 bg-white/10 dark:bg-white/10 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <h2 className="text-xl font-bold text-blue-700 dark:text-cyan-300">Authentication Required</h2>
                  <p className="text-blue-600 dark:text-cyan-200">Please log in to view your profile.</p>
                  <Button
                    onClick={() => router.push('/login')}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Go to Login
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const handleCopyReferralCode = () => {
    if (userData?.referralCode) {
      navigator.clipboard.writeText(userData.referralCode)
        .then(() => {
          showSuccessAlert('Referral code copied to clipboard!');
        })
        .catch(err => {
          showErrorAlert('Failed to copy referral code.');
          console.error('Failed to copy referral code: ', err);
        });
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pt-8 pb-24">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          <Card className="p-6 sm:p-8 rounded-2xl border border-white/20 bg-white/10 dark:bg-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                {/* Avatar Section */}
                <div className="relative">
                  <Avatar className="w-20 h-20 sm:w-32 sm:h-32 border-4 border-blue-500 shadow-2xl">
                    <AvatarImage src={userData.imageUrl} alt={displayName} />
                    <AvatarFallback className="text-lg sm:text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {userData.firstName?.charAt(0) || userData.username?.charAt(0) || userData.email?.charAt(0)}
                      {userData.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute -top-2 -left-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Profile Info */}
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl sm:text-4xl font-bold text-blue-700 dark:text-white flex items-center gap-2">
                        {displayName}
                        <Badge className="ml-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                          <Gamepad2 className="w-4 h-4 mr-1" />
                          Gamer
                        </Badge>
                        {userData?.role && userData.role !== 'user' && (
                          userData.role === 'host' ? (
                            <Badge className="ml-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                              <Star className="w-4 h-4 mr-1" />
                              Host
                            </Badge>
                          ) : (
                            <Badge className="ml-2 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                              <Crown className="w-4 h-4 mr-1" />
                              {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                            </Badge>
                          )
                        )}
                      </h1>
                    </div>
                    <p className="text-sm sm:text-base text-blue-600 dark:text-cyan-300 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      {userData.email}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-3 py-2 rounded-full border border-blue-500/30">
                        <Medal className="text-blue-500 w-5 h-5" />
                        <span className="text-blue-700 dark:text-white font-semibold text-lg">{userCoins} coins</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-500/30 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 dark:text-white hover:from-blue-500/30 hover:to-purple-500/30 px-4 py-2 text-sm font-medium"
                      onClick={() => router.push('/chatbot')}
                    >
                      <div className="w-4 h-4 mr-2">🤖</div>
                      AI Assistant
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-500/30 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 dark:text-white hover:from-green-500/30 hover:to-emerald-500/30 px-4 py-2 text-sm font-medium"
                      onClick={() => window.location.href = '/settings'}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                    {(userData?.role === 'manager' || userData?.role === 'admin' || userData?.role === 'host') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-orange-500/30 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-700 dark:text-white hover:from-orange-500/30 hover:to-red-500/30 px-4 py-2 text-sm font-medium"
                        onClick={() => router.push('/manager')}
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Show Matches
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Your Matches Preview Section */}
        {userData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6"
          >
            <Card className="max-w-6xl mx-auto p-4 sm:p-6 rounded-2xl border border-white/20 bg-white/10 dark:bg-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-1.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
                    <Trophy className="text-blue-500 w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-blue-700 dark:text-white flex-1">Your Matches</h2>
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-xs">
                    {joinedMatches.length} Matches
                  </Badge>
                </div>

                {joinedLoading ? (
                  <div className="flex flex-col items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                    <span className="text-blue-400 text-sm font-medium mt-2">Loading your matches...</span>
                  </div>
                ) : joinedMatches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32">
                    <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full mb-3">
                      <Gamepad2 className="w-8 h-8 text-blue-400" />
                    </div>
                    <span className="text-white/70 text-sm font-medium">No matches joined yet</span>
                    <p className="text-white/50 text-xs mt-1">Join your first match to start gaming!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...joinedMatches]
                      .sort((a, b) => {
                        if (a.status === 'upcoming' && b.status === 'upcoming') {
                          return new Date(a.time) - new Date(b.time);
                        }
                        if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
                        if (a.status !== 'upcoming' && b.status === 'upcoming') return 1;
                        return new Date(b.time) - new Date(a.time);
                      })
                      .map((match, index) => {
                        const timeLeft = timers[index] || { hours: 0, minutes: 0, seconds: 0 };
                        const isParticipant = match.players && match.players.some(
                          (p) =>
                            (userData._id && p.userId === userData._id) ||
                            (userData.username && p.username === userData.username) ||
                            (userData.email && p.email === userData.email)
                        );
                        return (
                          <div
                            key={match._id || index}
                            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                            onClick={() => router.push(`/matches/joined/${match._id}`)}
                          >
                            <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                              <Image
                                src={match.banner || '/space.png'}
                                alt={match.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white text-sm font-medium truncate">{match.name}</h4>
                              <div className="flex items-center gap-2 text-xs text-white/70">
                                <span>{format(new Date(match.time), 'MMM dd, hh:mm a')}</span>
                                <span className="text-blue-400">
                                  • {timeLeft.hours}h {timeLeft.minutes}m left
                                </span>
                              </div>
                            </div>
                            {isParticipant && (match.roomId || match.roomPassword) && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="flex items-center gap-1 px-2 py-1 text-xs shadow-md bg-white/90 text-gray-800 hover:bg-white"
                                onClick={e => {
                                  e.stopPropagation();
                                  setShowRoomFor(showRoomFor === match._id ? null : match._id);
                                }}
                              >
                                <KeyRound className="w-3 h-3" />
                                {showRoomFor === match._id ? 'Hide' : 'Room'}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Room ID/Pass Modal */}
        {showRoomFor && (() => {
          const match = joinedMatches.find(m => m._id === showRoomFor);
          if (!match) return null;
          return typeof window !== 'undefined' && createPortal(
            <AnimatePresence>
              <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[99999]" onClick={() => setShowRoomFor(null)}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="bg-gradient-to-br from-white/90 to-white/80 dark:from-zinc-900/90 dark:to-zinc-800/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 min-w-[280px] max-w-[90vw] relative border border-white/30 dark:border-zinc-700/40 backdrop-blur-lg z-[100000]"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={e => { e.stopPropagation(); setShowRoomFor(null); }}
                    className="absolute right-3 top-3 z-[100001] rounded-full p-1 bg-black/10 hover:bg-black/20 text-zinc-700 dark:text-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Close"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>

                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold">Room Details</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Copy the room information below</p>
                  </div>

                  <Badge className="text-base px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white flex items-center gap-2 rounded-lg">
                    <KeyRound className="w-4 h-4" />
                    Room ID: {match.roomId || 'N/A'}
                    {match.roomId && (
                      <button
                        type="button"
                        className="ml-2 p-1 rounded hover:bg-white/20 focus:outline-none relative"
                        onClick={e => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(match.roomId);
                          setCopiedField('roomId');
                          setTimeout(() => setCopiedField(null), 1200);
                        }}
                        aria-label="Copy Room ID"
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {copiedField === 'roomId' ? (
                            <motion.span
                              key="check-roomId"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1, color: '#22c55e' }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                              className="flex items-center justify-center"
                            >
                              <Check className="w-4 h-4" />
                            </motion.span>
                          ) : (
                            <motion.span
                              key="clipboard-roomId"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                              className="flex items-center justify-center"
                            >
                              <Clipboard className="w-4 h-4" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    )}
                  </Badge>

                  <Badge className="text-base px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white flex items-center gap-2 rounded-lg">
                    <Shield className="w-4 h-4" />
                    Password: {match.roomPassword || 'N/A'}
                    {match.roomPassword && (
                      <button
                        type="button"
                        className="ml-2 p-1 rounded hover:bg-white/20 focus:outline-none relative"
                        onClick={e => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(match.roomPassword);
                          setCopiedField('roomPassword');
                          setTimeout(() => setCopiedField(null), 1200);
                        }}
                        aria-label="Copy Password"
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {copiedField === 'roomPassword' ? (
                            <motion.span
                              key="check-roomPassword"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1, color: '#22c55e' }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                              className="flex items-center justify-center"
                            >
                              <Check className="w-4 h-4" />
                            </motion.span>
                          ) : (
                            <motion.span
                              key="clipboard-roomPassword"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                              className="flex items-center justify-center"
                            >
                              <Clipboard className="w-4 h-4" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    )}
                  </Badge>

                  <div className="text-xs text-gray-600 dark:text-gray-300 mt-2 text-center">
                    You will get room id and pass before 5 min of the match.
                  </div>
                </motion.div>
              </div>
            </AnimatePresence>,
            window.document.body
          );
        })()}

        {/* Refer & Earn Section */}
        {userData?.referralCode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-6"
          >
            <Card className="relative overflow-hidden w-full max-w-md mx-auto p-6 rounded-xl border border-white/20 bg-white/5 dark:bg-white/5 shadow-xl">
              {/* Glow effect */}
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_8px_20px_rgba(255,255,255,0.15)]" />
              <div className="relative z-10 flex flex-col items-center gap-4">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2 drop-shadow">
                  <Zap className="w-6 h-6 text-white/80" />
                  Refer & Earn
                </h2>

                {/* Referral Code + Buttons */}
                <div className="flex items-center gap-2 px-4 py-3 border border-dashed border-white/30 rounded-lg bg-transparent hover:bg-white/10 transition-colors">
                  <span className="font-mono text-lg tracking-wider text-white select-none">
                    {userData.referralCode}
                  </span>
                  {/* Copy Button */}
                  <button
                    onClick={handleCopyReferralCode}
                    className="p-1 rounded hover:bg-white/20 transition"
                    title="Copy Code"
                  >
                    <Clipboard className="w-5 h-5 text-white/60" />
                  </button>
                  {/* Share Button */}
                  <button
                    onClick={handleShareReferral}
                    className="p-1 rounded hover:bg-white/20 transition"
                    title="Share Referral"
                  >
                    <Share2 className="w-5 h-5 text-white/60" />
                  </button>
                </div>

                <p className="text-sm text-gray-300 text-center max-w-md">
                  Share this code with friends. When they sign up, <span className="font-semibold">both of you earn 5 coins</span>!
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        <Dialog open={showVerifiedDialog} onOpenChange={setShowVerifiedDialog}>
          <DialogContent className="max-w-xs text-center bg-gradient-to-br from-white/95 to-white/90 dark:from-zinc-900/95 dark:to-zinc-800/90 backdrop-blur-lg">
            <DialogTitle className="text-lg font-bold">Verified Gamer</DialogTitle>
            <div className="flex flex-col items-center justify-center gap-3 py-4">
              <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full">
                <BlueTick />
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">This gamer has been verified by the platform for authenticity and fair play.</div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tutorial Modal */}
        <AnimatePresence>
          {showTutorial && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowTutorial(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative max-w-4xl w-full max-h-[90vh] bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-white/20"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowTutorial(false)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Video Container */}
                <div className="relative w-full h-full">
                  <div className="aspect-video w-full">
                    <iframe
                      src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                      title="Tutorial Video"
                      className="w-full h-full rounded-t-2xl"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}