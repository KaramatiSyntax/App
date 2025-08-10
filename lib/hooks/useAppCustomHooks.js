"use client";

// Centralized exports and lightweight helpers for various app hooks.
// Replace placeholder fetch logic with real backend as needed.

import { useState, useEffect, useCallback } from "react";
import { useUserData } from "./useUserData";

/**
 * useJoinedMatches – returns matches the current user has joined.
 * It queries /api/matches?username=<username> and returns an array.
 */
export const useJoinedMatches = () => {
  const { userData } = useUserData();
  const [joinedMatches, setJoinedMatches] = useState([]);
  const [joinedLoading, setJoinedLoading] = useState(true);
  const [timers, setTimers] = useState({});

  const fetchMatches = useCallback(async () => {
    if (!userData?.username) {
      setJoinedMatches([]);
      setJoinedLoading(false);
      return;
    }

    setJoinedLoading(true);
    try {
      const res = await fetch(`/api/matches?username=${encodeURIComponent(userData.username)}`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        setJoinedMatches(Array.isArray(data) ? data : []);
      } else {
        console.error("useJoinedMatches – Unexpected response:", res.status);
        setJoinedMatches([]);
      }
    } catch (err) {
      console.error("useJoinedMatches – Fetch error:", err);
      setJoinedMatches([]);
    } finally {
      setJoinedLoading(false);
      setTimers({}); // Populate later if you add countdowns
    }
  }, [userData]);

  useEffect(() => {
    fetchMatches();
    // Optionally: const interval = setInterval(fetchMatches, 60_000);
    // return () => clearInterval(interval);
  }, [fetchMatches]);

  return { joinedMatches, joinedLoading, timers };
};

/**
 * useRoomAccess – basic state holder for which match's room details are expanded.
 */
export const useRoomAccess = () => {
  const [showRoomFor, setShowRoomFor] = useState(null); // "all" | matchId | null
  return { showRoomFor, setShowRoomFor };
};

// Re-export existing hook so consumers can "import { … } from '@/lib/hooks/useAppCustomHooks'"
export { useUserData };
