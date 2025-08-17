"use client";

import { useState } from 'react';
import MatchCardPreview from './MatchCardPreview';
import MatchDetailsDialog from './MatchDetailsDialog';
import SlotBooker from './SlotBooker';
import RoomIdPassModal from './RoomIdPassModal';
import { useUserData } from '@/lib/hooks/useUserData';
import { Dialog as HeadlessDialog } from "@headlessui/react";

const localMatchCard = ({ match }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localMatch, setLocalMatch] = useState(match);
  const [showSlotBooker, setShowSlotBooker] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const { userData } = useUserData();

  const alreadyJoinedPlayer = userData && localMatch.players && localMatch.players.some(
    (p) =>
      (userData.id && p.userId === userData.id) ||
      (userData.username && p.username === userData.username) ||
      (userData.emailAddresses && p.email === userData.emailAddresses[0]?.emailAddress)
  );

  const handleJoinClick = () => {
    setIsOpen(false);
    if (alreadyJoinedPlayer) {
      setShowRoomModal(true);
    } else {
      setShowSlotBooker(true);
    }
  };

  return (
    <div>
      <MatchCardPreview
        match={localMatch}
        onClick={() => setIsOpen(true)}
      />

      {isOpen && (
        <MatchDetailsDialog
          match={localMatch}
          onClose={() => setIsOpen(false)}
          onJoin={handleJoinClick}
          alreadyJoinedPlayer={alreadyJoinedPlayer}
        />
      )}

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
                  try {
                    const res = await fetch(`/api/matches?id=${localMatch._id || localMatch.localMatchId}`);
                    if (res.ok) {
                      const updatedlocalMatch = await res.json();
                      setLocalMatch(updatedlocalMatch);
                    }
                  } catch (e) {}
                  setShowSlotBooker(false);
                }}
              />
            </HeadlessDialog.Panel>
          </div>
        </HeadlessDialog>
      )}

      {showRoomModal && (
        <RoomIdPassModal
          match={localMatch}
          open={showRoomModal}
          onClose={() => setShowRoomModal(false)}
        />
      )}
    </div>
  );
};

export default localMatchCard;