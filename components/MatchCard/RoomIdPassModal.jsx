'use client';

import { createPortal } from 'react-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Clipboard, Check } from 'lucide-react';

const RoomIdPassModal = ({ open, onClose, match }) => {
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1200);
  };

  if (typeof window === 'undefined' || !open) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 flex items-center justify-center bg-black/30 z-[99999]"
        onClick={onClose}
      >
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
            onClick={onClose}
            className="absolute right-2 top-2 z- rounded-full p-1 bg-black/10 hover:bg-black/20 text-zinc-700 dark:text-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
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

          <Badge className="text-base px-4 py-2 bg-primary/90 text-primary-foreground flex items-center gap-2">
            Room ID: {match.roomId || 'N/A'}
            {match.roomId && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleCopy(match.roomId, 'roomId');
                }}
                className="ml-2 p-1 rounded hover:bg-primary/30 focus:outline-none relative"
                aria-label="Copy Room ID"
              >
                {copiedField === 'roomId' ? <Check className="w-4 h-4 text-green-500" /> : <Clipboard className="w-4 h-4" />}
              </button>
            )}
          </Badge>

          <Badge className="text-base px-4 py-2 bg-primary/90 text-primary-foreground flex items-center gap-2">
            Password: {match.roomPassword || 'N/A'}
            {match.roomPassword && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleCopy(match.roomPassword, 'roomPassword');
                }}
                className="ml-2 p-1 rounded hover:bg-primary/30 focus:outline-none relative"
                aria-label="Copy Password"
              >
                {copiedField === 'roomPassword' ? <Check className="w-4 h-4 text-green-500" /> : <Clipboard className="w-4 h-4" />}
              </button>
            )}
          </Badge>

          <div className="text-xs text-muted-foreground mt-2 text-center">
            You will get room id and pass before 5 min of the match.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default RoomIdPassModal;
