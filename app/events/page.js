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

  const animationVariants = {
    hidden: { x: -100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 20, duration: 0.8 },
    },
  };

  return (
    <div className="w-full flex flex-col items-center">

      <div className="hero mt-16 w-full relative aspect-video">
        {/* Hero Image - no border radius */}
        <div className="absolute top-0 left-0 w-full h-full">
          <Image
            src="/eventHero.jpg"
            alt="Independence Day Free Fire Event Hero"
            fill
            className="object-cover object-center"
            priority
          />
        </div>

        {/* Separator with black shadow blur blending image with bg */}
        <div className="absolute top-0 left-0 w-full aspect-video max-w-6xl bg-gradient-to-t from-black to-transparent"></div>

        {/* Timer */}
        <div className="w-full max-w-3xl px-6 absolute bottom-0">
          <EventTimer eventTime="2025-08-15T08:00:00" />
        </div>

        <motion.div
          className="absolute w-[30%] aspect-square bottom-16 left-0 z-10"
          initial="hidden"
          animate="visible"
          variants={animationVariants}
        >
          <Image
            src="/eventSticker.png"
            alt="Independence Day Sticker"
            fill
            priority
          />
        </motion.div>
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
        <div className="flex flex-col items-center justify-center">
          <span className="text-blue-400 text-xs">Team</span>
          <span className="text-orange-400 text-xl sm:text-2xl font-bold">Orange</span>
        </div>
        <span className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 font-bold">Vs</span>
        <div className="flex flex-col items-center justify-center">
          <span className="text-blue-400 text-xs">Team</span>
          <span className="text-white text-xl sm:text-2xl font-bold">White</span>
        </div>
        <span className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 font-bold">Vs</span>
        <div className="flex flex-col items-center justify-center">
          <span className="text-blue-400 text-xs">Team</span>
          <span className="text-green-400 text-xl sm:text-2xl font-bold">Green</span>
        </div>
      </motion.div>

      {/* Event Info Cards */}
      <motion.div
        className="flex flex-wrap justify-center gap-6 mb-14 px-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="flex flex-col items-center bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg max-w-xs">
          <Trophy className="text-yellow-400 w-8 h-8 mb-2" />
          <h3 className="text-lg font-semibold text-white">Prize Pool</h3>
          <p className="text-white/80 text-sm flex items-center gap-1">
            <IndianRupee className="w-4 h-4" />
            50,000
          </p>
        </div>

        <div className="flex flex-col items-center bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg max-w-xs">
          <Users className="text-blue-400 w-8 h-8 mb-2" />
          <h3 className="text-lg font-semibold text-white">Teams</h3>
          <p className="text-white/80 text-sm">16 Teams</p>
        </div>

        <div className="flex flex-col items-center bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg max-w-xs">
          <Sword className="text-red-400 w-8 h-8 mb-2" />
          <h3 className="text-lg font-semibold text-white">Format</h3>
          <p className="text-white/80 text-sm">Best of 5 Matches</p>
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
