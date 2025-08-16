'use client';

import { Users, Coins, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const MatchProgress = ({ match }) => {
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

  if (isTeamMatch(match.matchType)) {
    const slotsPerTeam = getSlotsPerTeam(match.matchFormat);
    totalSlots = slotsPerTeam * 2;
    takenSlotsCount = Array.isArray(match.players) 
      ? match.players.filter(p => p.slotNo && p.slotNo <= totalSlots).length
      : 0;
  } else {
    totalSlots = match.maxParticipants;
    takenSlotsCount = Array.isArray(match.players)
      ? match.players.filter(p => p.slotNo && p.slotNo <= totalSlots).length
      : 0;
  }

  const progress = totalSlots > 0 ? (takenSlotsCount / totalSlots) * 100 : 0;

  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between text-white text-sm">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          <span>{takenSlotsCount}/{totalSlots} Players</span>
        </div>
        <span>{Math.round(progress)}% Filled</span>
      </div>
      <Progress value={progress} className="h-1.5 bg-white/20 [&>div]:bg-cyan-500" />
      <div className="flex justify-between text-sm">
        <div className="flex items-center gap-1 text-red-400">
          <Coins className="w-5 h-5" />
          <span>{match.entry === 0 ? "Free" : `₹${match.entry}`} Entry</span>
        </div>
        <div className="flex items-center gap-1 text-green-400">
          <Trophy className="w-5 h-5" />
          <span>₹{match.winnings} Prize Pool</span>
        </div>
      </div>
    </div>
  );
};

export default MatchProgress;
