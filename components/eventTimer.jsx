"use client";

import { useState, useEffect } from "react";
import { Orbitron } from "next/font/google";
import { SlidingNumber } from "./motion-primitives/sliding-number";

// Professional digital-style Google Font
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export default function IndependenceDayCountdown({ eventTime }) {
  const [timeLeft, setTimeLeft] = useState(null);

  // Calculate remaining time
  const calculateTimeLeft = () => {
    const now = new Date().getTime();
    const target = new Date(eventTime).getTime();
    const diff = target - now;

    if (diff > 0) {
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    }
    return null;
  };

  // Update every second
  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [eventTime]);

  // Independence Day tricolor palette for each unit
  const colors = [
    "text-yellow-300 border-yellow-300/50", // Days
    "text-orange-400 border-orange-400/50", // Hours
    "text-white border-white/50",           // Minutes
    "text-green-400 border-green-400/50",   // Seconds
  ];

  return (
    <div
      className={`${orbitron.className} w-full flex flex-col items-center px-4 py-4`}
    >
      {timeLeft ? (
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
          {[
            { label: "Days", value: timeLeft.days },
            { label: "Hours", value: timeLeft.hours },
            { label: "Min", value: timeLeft.minutes },
            { label: "Sec", value: timeLeft.seconds },
          ].map(
            (unit, idx) =>
              (unit.value > 0 || unit.label !== "Days") && (
                <div
                  key={idx}
                  className={`flex flex-col items-center p-3 sm:p-4 rounded-lg bg-black/30 border ${colors[idx]} min-w-[70px] sm:min-w-[90px]`}
                >
                  <span className="text-3xl sm:text-5xl font-bold">
                    <SlidingNumber value={unit.value} />
                  </span>
                  <span className="text-xs sm:text-sm uppercase tracking-wide opacity-80">
                    {unit.label}
                  </span>
                </div>
              )
          )}
        </div>
      ) : (
        <div className="text-center text-green-300 font-bold text-lg sm:text-xl">
          🎉 Event Started
        </div>
      )}
    </div>
  );
}
