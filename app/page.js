'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from "next/image";
import MatchCard from "@/components/MatchCard/MatchCard";
import MatchCardSkeleton from "@/components/MatchCard/MatchCardSkeleton";
import { motion } from 'framer-motion';
import ExpoSlider from "@/components/swipper";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useRouter } from 'next/navigation';
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const isMatchFull = (match) => (match.players?.length || 0) >= (match.maxParticipants || 0);

  useEffect(() => {
    async function fetchMatches() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/matches');
        if (!res.ok) throw new Error('Failed to fetch matches');
        const data = await res.json();
        setMatches(data);
      } catch (err) {
        setError(err.message || 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    fetchMatches();
  }, []);

  const categorizedMatches = useMemo(() => {
    const upcoming = matches.filter(m => m.status === 'upcoming').sort((a, b) => new Date(a.time) - new Date(b.time));
    const completed = matches.filter(m => m.status === 'completed').sort((a, b) => new Date(b.time) - new Date(a.time));
    const running = matches.filter(m => m.status === 'running');
    const battleRoyale = upcoming.filter(m => m.matchType === "br");
    const clashSquad = upcoming.filter(m => m.matchType === "cs");
    const loneWolf = upcoming.filter(m => m.matchType === "lw");
    const latest = running.length > 0 ? running : upcoming.filter(m => !isMatchFull(m)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      upcoming,
      completed,
      running,
      battleRoyale,
      clashSquad,
      loneWolf,
      latest,
    };
  }, [matches]);

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        Error: {error}
      </div>
    );
  }

  function renderSliderSection(title, key, data, viewAllLink) {
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
      return () => api.off("select", handleSelect);
    }, [api]);

    return (
      <motion.div
        key={key}
        className="mb-1"
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-xl sm:text-2xl font-bold 
            text-transparent bg-clip-text bg-gradient-to-r 
            from-cyan-400 via-teal-400 to-blue-500 
            drop-shadow-[0_0_8px_rgba(0,255,255,0.4)] animate-[gradient-move_4s_ease_infinite_alternate] 
            [background-size:200%_200%] flex items-center gap-2"
          >
            {title}
            {data.length > 0 && (
              <Badge className="bg-white/10 text-white/80 border-white/20">
                {current} / {count}
              </Badge>
            )}
          </h2>
          {data.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white transition-colors group"
              onClick={() => router.push(viewAllLink)}
            >
              View All
              <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}
        </div>

        <div className="min-h-[300px] flex items-center justify-center">
          {isLoading ? (
            <Carousel className="w-full relative">
              <CarouselContent className="pl-4 -ml-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <CarouselItem key={index} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                    <MatchCardSkeleton />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          ) : data.length === 0 ? (
            <div
              className="text-white/60 text-center py-8 text-base font-medium flex flex-col items-center justify-center gap-3"
            >
              <Image
                src="/box.png"
                alt="No Matches"
                width={75}
                height={75}
                priority
              />
              <p className="leading-snug">No matches available.</p>
            </div>
          ) : (
            <Carousel setApi={setApi} className="w-full relative">
              <CarouselContent className="-ml-4">
                {data.map((match, index) => (
                  <CarouselItem key={match._id || index} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                    <motion.div
                      className="h-full"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <MatchCard match={match} />
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          )}
        </div>
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
      <div className="mb-8 w-full flex justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-600 blur-md opacity-40 rounded-xl z-0" />
        <div className="relative text-white px-6 py-4 rounded-xl shadow-lg text-center font-bold text-lg sm:text-xl max-w-lg w-full border border-white/20 backdrop-blur-sm z-20 transition-all duration-300 transform ">
          <span className="opacity-95 text-yellow-300 drop-shadow-[0_0_5px_rgba(252,211,77,0.8)]">
            🏆 Tournament Week! 🏆
          </span>
          <br />
          <span className="text-sm sm:text-base font-medium opacity-85 mt-2 inline-block">
            Join the action. Top teams win big!
          </span>
        </div>
      </div>

      {renderSliderSection('Latest Matches', 'latest', categorizedMatches.latest, '/matches?status=running,upcoming')}
      {renderSliderSection('Upcoming Matches', 'upcoming', categorizedMatches.upcoming, '/matches?status=upcoming')}
      {renderSliderSection('Battle Royale', 'battleroyale', categorizedMatches.battleRoyale, '/matches?type=br')}
      {renderSliderSection('Clash Squad', 'clashsquad', categorizedMatches.clashSquad, '/matches?type=cs')}
      {renderSliderSection('Lone Wolf', 'lonewolf', categorizedMatches.loneWolf, '/matches?type=lw')}
      {renderSliderSection('Completed Matches', 'completed', categorizedMatches.completed, '/matches?status=completed')}
    </div>
  );
}