'use client';

import { useState, useEffect } from 'react';
import { Timer, Settings, CheckCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSeconds } from './SecondsContext';
import { SlidingNumber } from '../motion-primitives/sliding-number';

function UpcomingMatchTimer({ Time }) {
  const seconds = useSeconds();
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [waiting, setWaiting] = useState(false);

  // Log on each render of UpcomingMatchTimer
  console.log('UpcomingMatchTimer rendered');

  const calculateTimeLeft = () => {
    const now = new Date();
    const matchTime = new Date(Time);
    const difference = matchTime - now;
    if (difference > 0) {
      const h = Math.floor(difference / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      setHours(h);
      setMinutes(m);
      setWaiting(false);
    } else {
      // If time is zero or negative
      setHours(0);
      setMinutes(0);
      setWaiting(true);
    }
  };

  useEffect(() => {
    calculateTimeLeft();
  }, []);

  useEffect(() => {
    if (seconds === 0) {
      calculateTimeLeft();
    }
  }, [seconds, Time]);

  // If all values are zero, show Waiting for Host
  if (waiting || (hours === 0 && minutes === 0 && (60 - seconds) === 0)) {
    return (
      <div className="flex items-center gap-2 text-yellow-400">
        <Timer className="h-4 w-4 text-yellow-400" />
        <span>Waiting for Host</span>
      </div>
    );
  }

  return (
    <div className='flex items-center gap-2 text-white'>
      <Timer className="h-4 w-4 text-blue-500" />
      <span className="flex items-center">
        <SlidingNumber value={hours > 24 ? Math.round(hours / 24) : hours} />
        <span>{hours > 24 ? 'day' : 'hrs'}</span>
      </span>
      <span className="flex items-center">
        <SlidingNumber value={minutes} />
        <span>Min</span>
      </span>
      <span className="flex items-center">
        <SlidingNumber value={60 - seconds} />
        <span>Sec</span>
      </span>
    </div>
  );
}

function RunningMatchIndicator() {
  console.log('RunningMatchIndicator rendered');
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
  console.log('CompletedMatchIndicator rendered');
  return (
    <>
      <CheckCheck className="h-4 w-4 text-green-500" />
      <span className="text-green-500">Match Completed</span>
    </>
  );
}

export function MatchStatus({ status, Time }) {
  console.log('MatchStatus rendered with status:', status, 'Time:', Time);
  return (
    <div className="flex items-center gap-2 text-white">
      {status === 'upcoming' && <UpcomingMatchTimer Time={Time} />}
      {status === 'running' && <RunningMatchIndicator />}
      {status === 'completed' && <CompletedMatchIndicator />}
    </div>
  );
}