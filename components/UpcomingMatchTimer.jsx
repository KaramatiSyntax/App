'use client';

import { useState, useEffect } from 'react'
import { Timer, Settings, CheckCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { SlidingNumber } from './motion-primitives/sliding-number';

function UpcomingMatchTimer({ Time }) {
  const [timeLeft, setTimeLeft] = useState(null);

  console.log("UpcomingMatchTimer Rendered");

  // Calculate time left until match starts
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const matchTime = new Date(Time).getTime();
      const difference = matchTime - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        return { hours, minutes, seconds };
      }
      return null;
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Set up interval to update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(timer);
  }, [Time]);



  return (
    <>
      <Timer className="h-4 w-4 text-cyan-400" />
      {timeLeft ? (
        <>
          {timeLeft.hours > 0 && (
            <span className="flex items-center">
              <SlidingNumber
                value={timeLeft.hours > 24 ? Math.round(timeLeft.hours / 24) : timeLeft.hours} />
              <span>{timeLeft.hours > 24 ? 'day' : 'hrs'}</span>
            </span>
          )}
          <span className="flex items-center">
            <SlidingNumber value={timeLeft.minutes} />
            <span>Min</span>
          </span>
          <span className="flex items-center">
            <SlidingNumber value={timeLeft.seconds} />
            <span>Sec</span>
          </span>
        </>
      ) : (
        <span>Waiting for host</span>
      )}
    </>
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