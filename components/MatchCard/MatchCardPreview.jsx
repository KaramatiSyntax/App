'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Users, Coins, Trophy, Clock } from 'lucide-react'; // Added Clock icon
import { Progress } from '@/components/ui/progress';

export default function MatchCardPreview({ match, onClick }) {
  const { banner, name, special, entry, winnings, status, time, players, matchType, matchFormat, maxParticipants } = match;

  const isTeamMatch = type => type === 'cs' || type === 'lw';
  const getSlotsPerTeam = format => {
    if (!format) return 1;
    const f = format.toLowerCase();
    if (f === 'duo') return 2;
    if (f === 'squad') return 4;
    return 1;
  };

  let totalSlots = 0;
  let takenSlotsCount = 0;
  if (isTeamMatch(matchType)) {
    const slotsPerTeam = getSlotsPerTeam(matchFormat);
    totalSlots = slotsPerTeam * 2;
    takenSlotsCount = Array.isArray(players)
      ? players.filter(p => p.slotNo && p.slotNo <= totalSlots).length
      : 0;
  } else {
    totalSlots = maxParticipants;
    takenSlotsCount = Array.isArray(players)
      ? players.filter(p => p.slotNo && p.slotNo <= totalSlots).length
      : 0;
  }

  const progress = totalSlots > 0 ? (takenSlotsCount / totalSlots) * 100 : 0;

  // New function to format the date and time
  const formatMatchDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative bg-card rounded-2xl shadow-lg overflow-hidden border border-border cursor-pointer"
      onClick={onClick}
    >
      {/* 16:9 Banner with Overlay */}
      <div className="relative aspect-video w-full">
        <Image
          src={banner || "/space.png"}
          alt={name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          priority
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Content on Image */}
        <div className="absolute inset-0 p-2 flex flex-col justify-between">
          {/* Top Section */}
          <div className="flex justify-between items-start">
            {special?.name !== false && (
              <h3 className="text-xl font-bold text-white truncate">{name}</h3>
            )}
          </div>
          {/* Bottom Section */}
          <div className="space-y-1">
            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-white/90">
                  <Users className="h-4 w-4" />
                  <span>{takenSlotsCount}/{totalSlots} Players</span>
                </div>
                {/* Replaced MatchStatus with static time */}
                <div className="flex items-center gap-2 text-white/90">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{formatMatchDate(time)}</span>
                </div>
              </div>
              <Progress
                value={progress}
                className="h-1.5 bg-white/20 [&>div]:bg-cyan-500"
              />
              <div className="flex items-center justify-between gap-1 text-[10px]">
                <span className="flex items-center gap-1 p-1 py-[.5] text-red-400">
                  <Coins className="h-4 w-4" />
                  <span className="font-medium">₹{entry === 0 ? "Free" : entry} Entry</span>
                </span>
                <span className="flex items-center gap-1 p-1 py-[.5] text-green-400">
                  <Trophy className="h-4 w-4" />
                  <span className="font-medium">₹{winnings} Prize Pool</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}