'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import MatchCard from "@/components/MatchCard/MatchCard";
import MatchCardSkeleton from "@/components/MatchCard/MatchCardSkeleton";
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const statusFilter = searchParams.get('status')?.split(',') || [];
  const typeFilter = searchParams.get('type');

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

  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      // Filter by status if any are specified
      if (statusFilter.length > 0) {
        if (!statusFilter.includes(match.status)) {
          return false;
        }
      }

      // Filter by type if one is specified
      if (typeFilter && match.matchType !== typeFilter) {
        return false;
      }
      return true;
    }).sort((a, b) => new Date(a.time) - new Date(b.time)); // Sort by date
  }, [matches, statusFilter, typeFilter]);

  const pageTitle = useMemo(() => {
    if (statusFilter.includes('upcoming')) return 'Upcoming Matches';
    if (statusFilter.includes('completed')) return 'Completed Matches';
    if (typeFilter === 'br') return 'Battle Royale Matches';
    if (typeFilter === 'cs') return 'Clash Squad Matches';
    if (typeFilter === 'lw') return 'Lone Wolf Matches';
    if (statusFilter.includes('running') || statusFilter.includes('upcoming')) return 'Latest Matches';
    return 'All Matches';
  }, [statusFilter, typeFilter]);

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="flex items-center gap-2 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold text-white/90">{pageTitle}</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <MatchCardSkeleton />
              </motion.div>
            ))
          ) : filteredMatches.length > 0 ? (
            filteredMatches.map((match, index) => (
              <motion.div
                key={match._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <MatchCard match={match} />
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="col-span-1 sm:col-span-2 lg:col-span-3 text-center text-white/60 py-16 text-xl font-medium"
            >
              No matches found.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}