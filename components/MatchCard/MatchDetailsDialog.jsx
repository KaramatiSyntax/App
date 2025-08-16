'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import MatchProgress from './MatchProgress';
import MatchStatusSection from './MatchStatusSection';

const MatchDetailsDialog = ({ match, onClose, onJoin, onView, alreadyJoinedPlayer }) => (
  <Dialog open={true} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full p-1 bg-black/50 hover:bg-black/70 text-white transition-colors"
        aria-label="Close"
      >
        {/* X icon svg */}
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
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

        <MatchStatusSection status={match.status} time={match.time} matchFormat={match.matchFormat} />

        <MatchProgress match={match} />

        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Rules</p>
          <p className="text-sm line-clamp-2">{match.rules}</p>
        </div>
      </div>

      <DialogFooter className="p-4 border-t">
        <div className="flex gap-2 w-full">
          {match.status !== 'completed' && (
            <Button className="w-1/2 bg-[var(--atoll)] text-white hover:bg-cyan-600" onClick={onJoin}>
              {alreadyJoinedPlayer ? 'Show Id Pass' : 'Join Match'}
            </Button>
          )}
          <Button variant="outline" className="w-1/2" onClick={onView}>
            View
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default MatchDetailsDialog;
