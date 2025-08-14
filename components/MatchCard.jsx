"use client";

import { useState } from "react";
import Image from "next/image";
import { format, isToday, isYesterday, isTomorrow } from 'date-fns';
import { Calendar, Users, Trophy, Coins, IndianRupee, Clock, Clipboard, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useUserData } from "@/lib/hooks/useUserData";
import { useAlert } from "@/components/AlertProvider";
import SlotBooker from "@/components/SlotBooker";
import { Dialog as HeadlessDialog } from "@headlessui/react";
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { MatchStatus } from './UpcomingMatchTimer';

const MatchCard = ({ match }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSlotBooker, setShowSlotBooker] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const { userData } = useUserData();
  const { showSuccessAlert } = useAlert();
  const [localMatch, setLocalMatch] = useState(match);
  const router = useRouter();
  const [copiedField, setCopiedField] = useState(null);

  console.log("MatchCard Rendered");

  // Helper to determine if match is team-based (CS/LW)
  const isTeamMatch = (type) => {
    return type === "cs" || type === "lw";
  };

  // Helper to get slots per team
  const getSlotsPerTeam = (format) => {
    const f = format?.toLowerCase();
    if (f === "duo") return 2;
    if (f === "squad") return 4;
    return 1; // solo default
  };

  // Calculate progress bar values using same logic as SlotBooker
  let totalSlots = 0;
  let takenSlotsCount = 0;
  if (isTeamMatch(localMatch.matchType)) {
    // For CS/LW: total slots = slotsPerTeam * 2 (not maxParticipants)
    const slotsPerTeam = getSlotsPerTeam(localMatch.matchFormat);
    totalSlots = slotsPerTeam * 2;
    takenSlotsCount = Array.isArray(localMatch.players)
      ? localMatch.players.filter(p => p.slotNo && p.slotNo <= totalSlots).length
      : 0;
  } else {
    // For BR: use maxParticipants for total slots
    totalSlots = localMatch.maxParticipants;
    takenSlotsCount = Array.isArray(localMatch.players)
      ? localMatch.players.filter(p => p.slotNo && p.slotNo <= totalSlots).length
      : 0;
  }

  const progress = totalSlots > 0 ? (takenSlotsCount / totalSlots) * 100 : 0;

  const formatDate = (date) => {
    const d = new Date(date);

    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    if (isTomorrow(d)) return 'Tomorrow';

    return format(d, 'MMM dd, yyyy');
  };

  const formatTime = (date) => {
    return format(new Date(date), 'hh:mm a');
  };

  // Check if user already joined
  const alreadyJoinedPlayer = userData && localMatch.players && localMatch.players.some(
    (p) =>
      (userData.id && p.userId === userData.id) ||
      (userData.username && p.username === userData.username) ||
      (userData.emailAddresses && p.email === userData.emailAddresses[0]?.emailAddress)
  );

  return (
    <>
      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -5 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="group relative bg-card rounded-2xl shadow-lg overflow-hidden border border-border cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        {/* 16:9 Banner with Overlay */}
        <div className="relative aspect-video w-full">
          <Image
            src={localMatch.banner || "/space.png"}
            alt={localMatch.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Content on Image */}
          <div className="absolute inset-0 p-2 flex flex-col justify-between">
            {/* Top Section */}
            <div className="flex justify-between items-start">
              {localMatch?.special?.name !== false && (
                <h3 className="text-xl font-bold text-white">{localMatch.name}</h3>
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
                  <MatchStatus status={localMatch.status} Time={localMatch.time} />
                </div>
                <Progress
                  value={progress}
                  className="h-1.5 bg-white/20 [&>div]:bg-cyan-500"
                />
                <div className="flex items-center justify-between gap-1 text-[10px]">
                  <span className="flex items-center gap-1 p-1 py-[.5] text-red-400">
                    <Coins className="h-4 w-4" />
                    <span className="font-medium">₹{localMatch.entry === 0 ? "Free" : localMatch.entry} Entry</span>
                  </span>
                  <span className="flex items-center gap-1 p-1 py-[.5] text-green-400">
                    <Trophy className="h-4 w-4" />
                    <span className="font-medium">₹{localMatch.winnings} Prize Pool</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-4 z-10 rounded-full p-1 bg-black/50 hover:bg-black/70 text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Banner Background */}
          <div className="relative aspect-video w-full">
            <Image
              src={localMatch.banner || "/space.png"}
              alt={localMatch.name}
              fill
              className="object-cover"
            />
            {localMatch?.special?.shadow !== false && (
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90" />
            )}
            <DialogHeader className="absolute bottom-0 left-0 right-0 p-4">
              <DialogTitle className="text-xl font-bold text-white text-center">{localMatch.name}</DialogTitle>
            </DialogHeader>
          </div>

          <div className="space-y-4 p-3 pt-0">
            {/* Status and Format */}
            <div className="flex items-center justify-between">
              <span className="text-sm bg-white/30 px-2 py-1 rounded-md text-foreground">{localMatch.matchFormat}</span>
            </div>

            {/* Date & Time */}
            <div className="flex items-start justify-between gap-2 text-sm">
              <MatchStatus status={localMatch.status} Time={localMatch.time} />
              <div className="flex flex-col items-start gap-2">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{formatDate(localMatch.time)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{formatTime(localMatch.time)}</span>
                </div>
              </div>
            </div>

            {/* Players and Progress */}
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

            {/* Entry Fee and Prize Pool */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Entry Fee</p>
                <div className="flex items-center gap-1">
                  <IndianRupee className="h-4 w-4" />
                  <p className="font-bold">{localMatch.entry}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Prize Pool</p>
                <div className="flex items-center gap-1">
                  <IndianRupee className="h-4 w-4 text-green-500" />
                  <p className="font-bold text-green-500">{localMatch.winnings}</p>
                </div>
              </div>
            </div>

            {/* Rules */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Rules</p>
              <p className="text-sm line-clamp-2">{localMatch.rules}</p>
            </div>
          </div>

          <DialogFooter className="p-4 border-t">
            <div className="flex gap-2 w-full">
              {localMatch.status !== 'completed' && (
                <Button
                  className="w-1/2 cursor-pointer bg-[var(--atoll)] text-white hover:bg-cyan-600"
                  onClick={() => {
                    if (alreadyJoinedPlayer) {
                      setIsOpen(false);
                      setShowRoomModal(true);
                    } else {
                      setIsOpen(false);
                      setShowSlotBooker(true);
                    }
                  }}
                >
                  {alreadyJoinedPlayer ? 'Show Id Pass' : 'Join Match'}
                </Button>
              )}
              <Button
                className="w-1/2 cursor-pointer bg-muted text-foreground hover:bg-accent"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  router.push(`/matches/joined/${localMatch._id}`);
                }}
              >
                View
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showSlotBooker && (
        <HeadlessDialog
          open={showSlotBooker}
          onClose={() => setShowSlotBooker(false)}
          className="fixed z-[9999] inset-0 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen px-4 py-8 bg-black/70 backdrop-blur-sm">
            <HeadlessDialog.Panel className="relative w-full max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 animate-fadeIn">
              <button
                onClick={() => setShowSlotBooker(false)}
                className="absolute right-4 top-4 z-10 rounded-full p-1 bg-black/50 hover:bg-black/70 text-white transition-colors"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <SlotBooker
                match={localMatch}
                onBook={async () => {
                  // Fetch latest match data after join
                  try {
                    const res = await fetch(`/api/matches?id=${localMatch._id || localMatch.matchId}`);
                    if (res.ok) {
                      const updatedMatch = await res.json();
                      setLocalMatch(updatedMatch);
                    }
                  } catch (e) { /* ignore */ }
                  setShowSlotBooker(false);
                  showSuccessAlert("Success", "Match joined successfully!");
                }}
              />
            </HeadlessDialog.Panel>
          </div>
        </HeadlessDialog>
      )}

      {/* Room ID/Pass Modal */}
      {showRoomModal && typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-[99999]" onClick={() => setShowRoomModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white/60 dark:bg-zinc-900/60 rounded-xl p-4 sm:p-6 shadow-2xl flex flex-col items-center gap-2 min-w-[220px] max-w-[90vw] relative border border-white/30 dark:border-zinc-700/40 backdrop-blur-lg z-[100000]"
              onClick={e => e.stopPropagation()}
            >
              <button
                type="button"
                tabIndex={0}
                onClick={e => { e.stopPropagation(); setShowRoomModal(false); }}
                className="absolute right-2 top-2 z-[100001] rounded-full p-1 bg-black/10 hover:bg-black/20 text-zinc-700 dark:text-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              <Badge className="text-base px-4 py-2 bg-primary/90 text-primary-foreground flex items-center gap-2">
                Room ID: {localMatch.roomId || 'N/A'}
                {localMatch.roomId && (
                  <button
                    type="button"
                    className="ml-2 p-1 rounded hover:bg-primary/30 focus:outline-none relative"
                    onClick={e => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(localMatch.roomId);
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
              <Badge className="text-base px-4 py-2 bg-primary/90 text-primary-foreground flex items-center gap-2">
                Password: {localMatch.roomPassword || 'N/A'}
                {localMatch.roomPassword && (
                  <button
                    type="button"
                    className="ml-2 p-1 rounded hover:bg-primary/30 focus:outline-none relative"
                    onClick={e => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(localMatch.roomPassword);
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
              <div className="text-xs text-muted-foreground mt-2 text-center">
                You will get room id and pass before 5 min of the match.
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        window.document.body
      )}
    </>
  );
};

export default MatchCard;
