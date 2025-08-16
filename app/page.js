"use client";

import { useState, useEffect } from 'react';
import Image from "next/image";
import MatchCard from "@/components/MatchCard/MatchCard";
import { motion } from 'framer-motion';
import ExpoSlider from "@/components/swipper";
import { Separator } from "@/components/ui/separator"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, CarouselPagination } from "@/components/ui/carousel";

// Section reveal logic
const SECTION_KEYS = [
  "upcoming",
  "completed",
  "latest",
  "featured",
  "full"
];
const SECTION_DELAY = 350; // ms between each section

export default function Home() {
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState(null);
  // UI state (move these up before any use)
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState('all');

  useEffect(() => {
    async function fetchMatches() {
      setError(null);
      try {
        const res = await fetch('/api/matches');
        if (!res.ok) throw new Error('Failed to fetch matches');
        const data = await res.json();
        setMatches(data);
      } catch (err) {
        setError(err.message || 'Unknown error');
      }
    }
    fetchMatches();
  }, []);

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Error: {error}</div>;
  }

  // Group matches by status/type
  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const completedMatches = matches.filter(m => m.status === 'completed');
  const latestMatches = matches.filter(m => m.status === 'running');
  const featuredMatches = upcomingMatches.filter(m => m.matchType === "br");

  // Helper functions
  function isMatchFull(match) {
    return (match.players?.length || 0) >= (match.maxParticipants || 0);
  }

  function isNotCompleted(match) {
    return match.status !== 'completed';
  }

  function isCompleted(match) {
    return match.status === 'completed';
  }

  // All matches for filtering
  const allMatches = [
    ...upcomingMatches,
    ...completedMatches,
    ...latestMatches,
    ...featuredMatches
  ];

  // Filtered matches
  const filteredAllMatches = allMatches.filter(m => {
    return (selectedCategory === 'all' || m.matchType === selectedCategory) &&
      (selectedFormat === 'all' || m.matchFormat === selectedFormat);
  });

  // Featured matches
  const featuredSectionMatches = allMatches
    .filter(m => isNotCompleted(m) && !isMatchFull(m))
    .sort((a, b) => ((a.maxParticipants || 0) - (a.players?.length || 0)) - ((b.maxParticipants || 0) - (b.players?.length || 0)));
  const featuredMatch = featuredSectionMatches[0] ? [featuredSectionMatches[0]] : [];

  // Latest matches
  const latestSectionMatches = allMatches
    .filter(m => isNotCompleted(m) && !isMatchFull(m))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Full matches
  const fullSectionMatches = allMatches.filter(m => isMatchFull(m) && isNotCompleted(m));
  const completedSectionMatches = allMatches.filter(isCompleted);

  // Helper: get matches for a type
  function getTypeMatches(type) {
    let matches = allMatches.filter(m =>
      m.matchType?.toLowerCase().trim() === type &&
      isNotCompleted(m) &&
      !isMatchFull(m)
    );
    if (selectedFormat !== 'all') {
      matches = matches.sort((a, b) => {
        const aMatch = a.matchFormat?.toLowerCase().trim() === selectedFormat.toLowerCase().trim();
        const bMatch = b.matchFormat?.toLowerCase().trim() === selectedFormat.toLowerCase().trim();
        return (bMatch ? 1 : 0) - (aMatch ? 1 : 0);
      });
    }
    return matches;
  }

  // Lone Wolf, Battle Royale, Clash Squad
  const loneWolfMatches = getTypeMatches('lw');
  const battleRoyaleMatches = getTypeMatches('br');
  const clashSquadMatches = getTypeMatches('cs');

  // Helper for section rendering
  function renderSliderSection(title, matches, key) {
    const [api, setApi] = useState(null);
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!api) return;

      setCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap() + 1);

      const handleSelect = () => {
        setCurrent(api.selectedScrollSnap() + 1);
      };

      api.on("select", handleSelect);
      return () => {
        api.off("select", handleSelect);
      };
    }, [api, matches.length]);


    return (
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        {/* Inline styles for gradient animation */}
        <style>{`
        @keyframes gradient-move {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .animate-gradient-move {
          background-size: 200% 200%;
          animation: gradient-move 4s ease infinite alternate;
        }
      `}</style>

        <h1
          className="font-[var(--font-titillium)] text-xl sm:text-2xl font-bold 
             text-transparent bg-clip-text 
             bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 
             drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]
             animate-gradient-move"
        >
          {title}
        </h1>

        <div
          style={{
            width: `${title.trim().length - 6}rem`,
          }}
          className="mt-0.5 mb-6 h-[0.5px] bg-gradient-to-l 
             from-cyan-400 via-teal-400 to-blue-500 opacity-80"
        ></div>

        {matches.length === 0 ? (
          <div className="text-white/60 text-center py-8 text-base font-medium flex flex-col items-center justify-center gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Image
                src="/box.png"
                alt="No Matches"
                width={75}
                height={75}
                priority
              />
            </motion.div>
            <p className="leading-snug">
              No matches available for this section.
            </p>
          </div>
        ) : (
          <Carousel setApi={setApi} className="w-full relative">
            <CarouselContent>
              {matches.map((match, index) => (
                match?.special?.type === 'event' ? null : (
                  <CarouselItem
                    key={index}
                    className="min-w-0 basis-full sm:basis-1/2 lg:basis-1/3"
                  >
                    <motion.div
                      className="h-full"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <MatchCard match={match} />
                    </motion.div>
                  </CarouselItem>
                )
              ))}
            </CarouselContent>

            <CarouselPrevious />
            <CarouselNext />
            <CarouselPagination count={count} current={current} />
          </Carousel>
        )}
      </motion.div>
    );
  }


  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="flex items-center justify-center mb-8">
        <ExpoSlider />
      </div>

      <Separator className="mb-8 h-2 bg-white/30" />
      {/* Announcement Section */}
      <div className="mb-6 w-full flex justify-center relative">
        {/* Background gradient blur */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-white to-green-500 blur-lg opacity-40 rounded-xl z-0" />

        {/* Foreground content */}
        <div className="relative text-white px-6 py-4 rounded-xl shadow-lg text-center font-bold text-lg sm:text-xl max-w-3xl w-full border border-white/90 backdrop-blur-sm z-20">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-white to-green-400">
            A special Event awaits...
          </span>
          <br />
          <span className="opacity-90 text-sm sm:text-base">
            Join us this <strong>15th August</strong> for something special.
          </span>
        </div>
      </div>


      {/* Upcoming Matches Section */}
      {renderSliderSection('Upcoming Matches', upcomingMatches, 'upcoming')}

      {/* Featured Section */}
      {renderSliderSection('Featured Matches', featuredMatch, 'featured')}

      {/* Latest Matches Section */}
      {renderSliderSection('Latest Matches', latestSectionMatches, 'latest')}

      {/* All Matches section */}
      {renderSliderSection('All Matches', allMatches, 'allmatches')}

      {/* Completed Matches Section */}
      {renderSliderSection('Completed Matches', completedSectionMatches, 'completed')}

      {/* Full Matches Section */}
      {renderSliderSection('Full Matches', fullSectionMatches, 'fullmatches')}

      {/* Type sections */}
      {renderSliderSection('Lone Wolf', loneWolfMatches, 'lonewolf')}
      {renderSliderSection('Battle Royale', battleRoyaleMatches, 'battleroyale')}
      {renderSliderSection('Clash Squad', clashSquadMatches, 'clashsquad')}
    </div>
  );
}
