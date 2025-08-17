'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { format, isToday, isYesterday, isTomorrow } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users, IndianRupee, Clock } from 'lucide-react';
import { MatchStatus } from './UpcomingMatchTimer';

const MatchDetailsDialog = ({ onClose, match, alreadyJoinedPlayer, onJoin }) => {
  const router = useRouter();

  const isTeamMatch = (type) => type === "cs" || type === "lw";

  const getSlotsPerTeam = (format) => {
    const f = format?.toLowerCase();
    if (f === "duo") return 2;
    if (f === "squad") return 4;
    return 1;
  };

  let totalSlots = 0;
  let takenSlotsCount = 0;
  if (isTeamMatch(match.matchType)) {
    const slotsPerTeam = getSlotsPerTeam(match.matchFormat);
    totalSlots = slotsPerTeam * 2;
  } else {
    totalSlots = match.maxParticipants;
  }
  takenSlotsCount = Array.isArray(match.players)
    ? match.players.filter(p => p.slotNo && p.slotNo <= totalSlots).length
    : 0;

  const progress = totalSlots > 0 ? (takenSlotsCount / totalSlots) * 100 : 0;

  const formatDate = (date) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'MMM dd, yyyy');
  };

  const formatTime = (date) => format(new Date(date), 'hh:mm a');

  const handleViewClick = () => {
    onClose();
    router.push(`/matches/joined/${match._id}`);
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full p-1 bg-black/50 hover:bg-black/70 text-white transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div className="relative aspect-video w-full">
            <Image
              src={match.banner || "/space.png"}
              alt={match.name}
              fill
              className="object-cover"
            />
            {match?.special?.shadow !== false && (
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90" />
            )}
            <DialogHeader className="absolute bottom-0 left-0 right-0 p-4">
              <DialogTitle className="text-xl font-bold text-white text-center">{match.name}</DialogTitle>
            </DialogHeader>
          </div>

          <div className="space-y-4 p-3 pt-0">
            <div className="flex items-center justify-between">
              <span className="text-sm bg-white/30 px-2 py-1 rounded-md text-foreground">{match.matchFormat}</span>
            </div>

            <div className="flex items-start justify-between gap-2 text-sm">
              <MatchStatus status={match.status} Time={match.time} />
              <div className="flex flex-col items-start gap-2">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{formatDate(match.time)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{formatTime(match.time)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{takenSlotsCount}/{totalSlots} Players</span>
                </div>
                <span className="text-muted-foreground">{Math.round(progress)}% Filled</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Entry Fee</p>
                <div className="flex items-center gap-1">
                  <IndianRupee className="h-4 w-4" />
                  <p className="font-bold">{match.entry}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Prize Pool</p>
                <div className="flex items-center gap-1">
                  <IndianRupee className="h-4 w-4 text-green-500" />
                  <p className="font-bold text-green-500">{match.winnings}</p>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Rules</p>
              <p className="text-sm line-clamp-2">{match.rules}</p>
            </div>
          </div>

          <DialogFooter className="p-4 border-t">
            <div className="flex gap-2 w-full">
              {match.status !== 'completed' && (
                <Button
                  className="w-1/2 bg-[var(--atoll)] text-white hover:bg-cyan-600"
                  onClick={onJoin}
                >
                  {alreadyJoinedPlayer ? 'Show Id Pass' : 'Join Match'}
                </Button>
              )}
              <Button
                variant="outline"
                className="w-1/2"
                onClick={handleViewClick}
              >
                View
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MatchDetailsDialog;