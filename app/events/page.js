"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import EventTimer from "@/components/eventTimer";
import { IndianRupee, Trophy, Users, Sword } from "lucide-react";

export default function EventPage() {
  useEffect(() => {
    // Disable scroll while on this page
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center">
      
      {/* Hero Image - no border radius */}
      <div className="relative w-full pt-16 max-w-6xl h-64 sm:h-80 md:h-96">
        <Image
          src="/eventHero.jpg" // Replace with your hero image path
          alt="Independence Day Free Fire Event Hero"
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* Separator with black shadow blur blending image with bg */}
      <div className="w-full h-32 max -mt-16 bg-gradient-to-t from-black to-transparent"></div>

      {/* Title below separator */}
      <motion.h1
        className="text-center text-4xl sm:text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg mt-8 mb-6 max-w-3xl px-4 leading-tight"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Independence Day Free Fire Showdown
      </motion.h1>

      {/* Timer */}
      <div className="w-full max-w-3xl px-6 mb-10">
        <EventTimer eventTime="2025-08-15T08:00:00" />
      </div>

      {/* Tagline */}
      <p className="text-white/80 text-base sm:text-lg mb-10 max-w-xl text-center leading-relaxed px-4">
        Join the ultimate{" "}
        <span className="text-orange-400 font-semibold">Orange</span>,{" "}
        <span className="text-white font-semibold">White</span> &{" "}
        <span className="text-green-400 font-semibold">Green</span> squad battle this 15th August. 
        Clash for glory, pride, and ultimate victory!
      </p>

      {/* VS Teams */}
      <motion.div
        className="flex items-center justify-center gap-4 sm:gap-8 mb-12"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="text-orange-400 text-2xl sm:text-3xl font-bold">Orange</div>
        <Sword className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        <div className="text-white text-2xl sm:text-3xl font-bold">White</div>
        <Sword className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        <div className="text-green-400 text-2xl sm:text-3xl font-bold">Green</div>
      </motion.div>

      {/* Event Info Cards */}
      <motion.div
        className="flex flex-wrap justify-center gap-6 mb-14 px-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        {/* Entry Fee */}
        <div className="flex flex-col items-center bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-white/20 min-w-[90px]">
          <IndianRupee className="h-6 w-6 text-orange-400 mb-1" />
          <span className="text-xs text-white/70">Entry Fee</span>
          <span className="text-lg font-bold text-white">₹10</span>
        </div>
        {/* Prize Pool */}
        <div className="flex flex-col items-center bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-white/20 min-w-[90px]">
          <Trophy className="h-6 w-6 text-yellow-300 mb-1" />
          <span className="text-xs text-white/70">Prize Pool</span>
          <span className="text-lg font-bold text-white">70%</span>
        </div>
        {/* Teams */}
        <div className="flex flex-col items-center bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-white/20 min-w-[90px]">
          <Users className="h-6 w-6 text-green-400 mb-1" />
          <span className="text-xs text-white/70">Teams</span>
          <span className="text-lg font-bold">
            <span className="text-orange-400">O</span> /{" "}
            <span className="text-white">W</span> /{" "}
            <span className="text-green-400">G</span>
          </span>
        </div>
      </motion.div>

      {/* Register Button */}
      <motion.button
        className="px-10 py-3 rounded-full bg-gradient-to-r from-orange-500 via-white to-green-500 text-black font-semibold text-lg shadow-lg hover:scale-105 transition-transform mb-12"
        whileTap={{ scale: 0.95 }}
        aria-label="Register for Independence Day Free Fire Showdown"
      >
        Register Now
      </motion.button>
    </div>
  );
}
