"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import EventTimer from "@/components/eventTimer";
import { GlowEffect } from "@/components/motion-primitives/glow-effect";
import {Calendar, IndianRupee, Trophy, Gamepad, Users, ShieldCheck} from "lucide-react";

export default function EventPage() {

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
          <EventTimer eventTime="2025-08-15T13:00:00" />
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


      {/* Register Button */}
      <motion.div
        className="flex items-center justify-center mb-16 relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <GlowEffect
          colors={["#FF6F00", "#FFFFFF", "#138808"]}
          mode='flowHorizontal'
          blur='soft'
        />
        <button className='relative inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-white outline-1 bg-zinc-700/5 outline-white'>
          Join the battle
        </button>
      </motion.div>

      {/* Event Details */}
      <div className="w-full max-w-3xl px-6 mb-10">

        {/* Heading with separator */}
        <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-3">
          Details
          <span className="flex-1 h-px bg-white/20"></span>
        </h2>

        {/* Details List */}
        <ul className="list-none text-white/80 text-sm sm:text-base space-y-2">
          <li className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-yellow-300" />
            <span>Date & Time:</span>
            <span className="text-white font-medium">15 Aug 2025, 1:00 PM</span>
          </li>
          <li className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-orange-400" />
            <span>Entry Fee:</span>
            <span className="text-white font-medium">₹10</span>
          </li>
          <li className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-green-400" />
            <span>Prize Pool:</span>
            <span className="text-white font-medium">70% of total collection</span>
          </li>
          <li className="flex items-center gap-2">
            <Gamepad className="w-5 h-5 text-purple-400" />
            <span>Format:</span>
            <span className="text-white font-medium">B.R</span>
          </li>
          <li className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>Match Type:</span>
            <span className="text-white font-medium">Squad</span>
          </li>

          {/* Rules */}
          <li className="mt-4 text-orange-400 font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Rules:
          </li>
          <li className="pl-7">• No hacks, cheats, or third-party tools allowed</li>
          <li className="pl-7">• Respect teammates and opponents</li>
          <li className="pl-7">• Ping issues will not pause matches</li>
          <li className="pl-7">• Follow match host instructions at all times</li>
          <li className="pl-7">• Disconnection mid-game means the match continues</li>
        </ul>
      </div>
      {/* Footer */}
      <div className="w-full max-w-3xl px-6 text-center text-white/60 text-xs sm:text-sm mb-8">
        <p>
          By participating, you agree to our{" "}
          <a href="/terms" className="text-blue-400 hover:underline">
            Terms & Conditions
          </a>
        </p>
      </div>
    </div>
  );
}