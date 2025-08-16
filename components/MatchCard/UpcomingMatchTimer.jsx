'use client';

import { useState, useEffect } from 'react'
import { Timer, Settings, CheckCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { SlidingNumber } from '../motion-primitives/sliding-number';

function UpcomingMatchTimer({ Time }) {
  const seconds = useSeconds(); // subscribe to seconds context
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  // Update hours/minutes only when seconds == 0
  useEffect(() => {
    if (seconds === 0) {
      const now = new Date();
      const matchTime = new Date(Time);
      const difference = matchTime - now;

      if (difference > 0) {
        setHours(Math.floor(difference / (1000 * 60 * 60)));
        setMinutes(Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)));
      } else {
        setHours(0);
        setMinutes(0);
      }
    }
  }, [seconds, Time]);

  // Seconds is always the same for all
  return (
    <div className='flex items-center gap-2 text-white'>
      <Timer className="h-4 w-4 text-blue-500" />
      <SlidingNumber value={hours > 24 ? Math.round(hours / 24) : hours} />
      <span>{hours > 24 ? 'day' : 'hrs'}</span>
      <SlidingNumber value={minutes} />
      <span>Min</span>
      <SlidingNumber value={60 - seconds} />
      <span>Sec</span>
    </div>
  );
}

function RunningMatchIndicator() {
  return (
    <>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="flex items-center justify-center w-6 h-6"
      >
        <Settings className="h-4 w-4 text-yellow-500" />
      </motion.div>
      <span className="text-yellow-500">Match Ongoing</span>
    </>
  );
}

function CompletedMatchIndicator() {
  return (
    <>
      <CheckCheck className="h-4 w-4 text-green-500" />
      <span className="text-green-500">Match Completed</span>
    </>
  );
}

export function MatchStatus({ status, Time }) {
  return (
    <div className="flex items-center gap-2 text-white">
      {status === 'upcoming' && <UpcomingMatchTimer Time={Time} />}
      {status === 'running' && <RunningMatchIndicator />}
      {status === 'completed' && <CompletedMatchIndicator />}
    </div>
  );
}