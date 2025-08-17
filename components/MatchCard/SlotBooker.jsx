import React, { useState, useEffect, useMemo } from "react";
import { useUserData } from "@/lib/hooks/useUserData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAlert } from "@/components/AlertProvider";
import { Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

/**
 * SlotBooker component for match slot booking
 * @param {Object} props
 * @param {Object} props.match - Match JSON object
 * @param {Function} [props.onBook] - Optional callback when booking is successful
 */
export default function SlotBooker({ match, onBook }) {
  const { userData, loading, refreshUserData } = useUserData();
  const { showErrorAlert, showSuccessAlert, showLoadingAlert } = useAlert();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null); // For CS/LW
  const [inGameName, setInGameName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [coinError, setCoinError] = useState("");
  const [showRoom, setShowRoom] = useState(false);

  // Use coins directly from userData
  const userCoins = userData?.coins ?? 0;

  // Fetch user coins on mount
  useEffect(() => {
    const fetchCoins = async () => {
      if (!userData) return;
      try {
        // const email = userData.emailAddresses?.[0]?.emailAddress; // Removed Clerk email fetching
        // const response = await fetch(`/api/users?email=${email}`); // Removed Clerk user fetching
        // const data = await response.json();
        // setUserCoins(data?.[0]?.coins ?? 0); // Removed Clerk user coins setting
      } catch (err) {
        // setUserCoins(0); // Removed Clerk user coins setting
      }
    };
    fetchCoins();
  }, [userData]);

  // Helper: get all taken slots (by slotNo, and by team for CS/LW)
  const takenSlots = useMemo(() => {
    const slots = {};
    if (Array.isArray(match.players)) {
      match.players.forEach((p) => {
        if (match.matchFormat.toLowerCase() === "br") {
          slots[p.slotNo] = true;
        } else {
          if (!slots[p.team]) slots[p.team] = {};
          slots[p.team][p.slotNo] = true;
        }
      });
    }
    return slots;
  }, [match.players, match.matchFormat]);

  // Helper to determine if match is team-based (CS/LW)
  const isTeamMatch = (type) => {
    return type === "cs" || type === "lw";
  };

  // Helper to get slots per team
  const getSlotsPerTeam = (format) => {
    switch (format) {
      case "Solo":
        return 1;
      case "Duo":
        return 2;
      case "Squad":
        return 4;
      default:
        return 1;
    }
  };

  // Helper to get team and teamSlot from global slot number
  const getTeamAndSlot = (format, slotNo) => {
    const slotsPerTeam = getSlotsPerTeam(format);
    if (slotNo <= slotsPerTeam) {
      return { team: "Team 1", teamSlot: slotNo };
    } else {
      return { team: "Team 2", teamSlot: slotNo - slotsPerTeam };
    }
  };

  // Generate slots based on matchType and matchFormat (global slot numbers for CS/LW)
  const slotRows = useMemo(() => {
    if (isTeamMatch(match.matchType)) {
      const slotsPerTeam = getSlotsPerTeam(match.matchFormat);
      const totalSlots = slotsPerTeam * 2;
      return [
        Array.from({ length: totalSlots }, (_, i) => {
          const slotNo = i + 1;
          const taken = match.players && match.players.some((p) => Number(p.slotNo) === slotNo);
          const { team, teamSlot } = getTeamAndSlot(match.matchFormat, slotNo);
          return {
            slotNo,
            team,
            teamSlot,
            taken,
            player: match.players && match.players.find((p) => Number(p.slotNo) === slotNo) || null,
          };
        })
      ];
    } else {
      return [
        Array.from({ length: match.maxParticipants }, (_, i) => {
          const slotNo = i + 1;
          const taken = match.players && match.players.some((p) => p.slotNo === slotNo);
          return {
            slotNo,
            taken,
            player: match.players && match.players.find((p) => p.slotNo === slotNo) || null,
          };
        }),
      ];
    }
  }, [match.matchType, match.matchFormat, match.players, match.maxParticipants]);

  // Calculate progress bar values
  const { totalSlots, takenSlotsCount } = useMemo(() => {
    const slotsPerTeam = getSlotsPerTeam(match.matchFormat);
    let totalSlots;
    let takenSlotsCount = 0;
    if (isTeamMatch(match.matchType)) {
      totalSlots = slotsPerTeam * 2;
      takenSlotsCount = Array.isArray(match.players)
        ? match.players.filter(p => p.slotNo).length
        : 0;
    } else {
      totalSlots = match.maxParticipants;
      takenSlotsCount = Array.isArray(match.players)
        ? match.players.filter(p => p.slotNo).length
        : 0;
    }
    return { totalSlots, takenSlotsCount };
  }, [match.matchType, match.matchFormat, match.players, match.maxParticipants]);

  // Coin check
  const coinsNeeded = match.entry - userCoins;
  const insufficientCoins = userCoins < match.entry;

  // Check if user already joined
  const alreadyJoinedPlayer = userData && match.players.find(p => p.userId === userData._id || p.username === userData.username);

  // Handle booking
  const handleBook = async (e) => {
    e.preventDefault();
    setError("");
    setCoinError("");
    if (!userData && !loading) {
      showErrorAlert('Error', 'You must be logged in to book a slot.');
      return;
    }
    if (!selectedSlot || !inGameName.trim()) {
      showErrorAlert('Error', 'Please select a slot and enter your ID name.');
      return;
    }
    if (insufficientCoins) {
      showErrorAlert('Error', `Insufficient balance. You need ${coinsNeeded} more coins to join.`);
      return;
    }

    // Check if the selected slot is already taken (using global slot number logic)
    const isSlotAlreadyTaken = match.players && match.players.some((p) => {
      return Number(p.slotNo) === Number(selectedSlot.slotNo);
    });

    if (isSlotAlreadyTaken) {
      showErrorAlert('Error', 'This slot is already taken. Please select another slot.');
      return;
    }

    setSubmitting(true);
    showLoadingAlert('Processing', 'Joining match...');
    try {
      // Prepare player object for backend - only send required fields
      const payload = {
        matchId: match._id || match.matchId,
        slotNo: selectedSlot.slotNo,
        inGameName: inGameName.trim(),
      };
      
      console.log('Sending payload to /api/matches/join:', payload);
      console.log('Selected slot data:', selectedSlot);
      
      // POST to /api/matches/join
      const res = await fetch(`/api/matches/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);
      
      if (!res.ok) {
        // Show available slots if provided by backend
        if (data.availableSlots && data.availableSlots.length > 0) {
          const slotList = data.availableSlots.map(s => s.slotNo || `${s.team} slot ${s.slotNo}`).join(', ');
          showErrorAlert('Slot Taken', `This slot is already taken. Available slots: ${slotList}`);
        } else {
          showErrorAlert('Error', data.error || "Failed to join match. Please try again.");
        }
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
      setSelectedSlot(null);
      setSelectedTeam(null);
      setInGameName("");
      setError("");
      setCoinError("");
      // Refresh user data to get updated coins
      await refreshUserData();
      
      if (onBook) onBook();
      showSuccessAlert('Success', 'Match joined successfully!');
      
      // Log the saved player data for verification
      console.log('Successfully joined match. Saved player data:', data.savedPlayer);
    } catch (err) {
      showErrorAlert('Error', 'Failed to join match. Please try again.');
      setSubmitting(false);
    }
  };

  // UI rendering
  return (
    <div className="max-w-xl mx-auto p-4 bg-white dark:bg-gray-900 rounded-lg shadow space-y-6">
      <h2 className="text-2xl font-bold mb-2">Book Your Slot</h2>
      <div className="mb-4">
        <Progress value={Math.round((takenSlotsCount / totalSlots) * 100)} />
        <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 text-center">
          {takenSlotsCount} / {totalSlots} slots filled
        </div>
      </div>
      <div className="mb-2 text-cyan-700 font-semibold">
        Entry Fee: <span className="text-cyan-900">{match.entry} coins</span>
      </div>
      {coinError && <div className="text-red-500 text-sm mb-2">{coinError}</div>}
      {alreadyJoinedPlayer ? (
        <div className="space-y-4">
          <Button
            className="w-full bg-green-600 text-white hover:bg-green-700"
            onClick={() => setShowRoom(!showRoom)}
          >
            {showRoom ? 'Hide Id Pass' : 'Show Id Pass'}
          </Button>
          {showRoom && (
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center space-y-2">
              <div><span className="font-semibold">Room ID:</span> {match.roomId ? match.roomId : 'N/A'}</div>
              <div><span className="font-semibold">Room Password:</span> {match.roomPassword ? match.roomPassword : 'N/A'}</div>
            </div>
          )}
        </div>
      ) : (
        <>
          {isTeamMatch(match.matchType) ? (
            <div className="flex gap-8 justify-center">
              {["Team 1", "Team 2"].map((team, teamIdx) => {
                const slotsPerTeam = getSlotsPerTeam(match.matchFormat);
                // For each team, get their slots (global slot numbers)
                const teamSlots = Array.from({ length: slotsPerTeam }, (_, i) => {
                  const globalSlotNo = teamIdx === 0 ? i + 1 : slotsPerTeam + i + 1;
                  return slotRows[0].find(slot => slot.slotNo === globalSlotNo);
                });
                return (
                  <div key={team} className="flex-1 border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                    <div className="mb-2 font-bold text-lg text-center text-cyan-700 dark:text-cyan-300 uppercase tracking-wide">
                      {team}
                    </div>
                    <div className={`grid gap-2 ${teamSlots.length === 1 ? "grid-cols-1" : teamSlots.length === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"}`}>
                      {teamSlots.map((slot, idx) => (
                        <Button
                          key={slot.slotNo}
                          variant={
                            selectedSlot && selectedSlot.slotNo === slot.slotNo
                              ? "default"
                              : "outline"
                          }
                          className={`w-full flex flex-col items-center relative ${slot.taken ? "opacity-50 cursor-not-allowed" : ""}`}
                          disabled={slot.taken || submitting}
                          onClick={() => {
                            setSelectedSlot({ slotNo: slot.slotNo, team, teamSlot: idx + 1 });
                            setSelectedTeam(team);
                          }}
                        >
                          <span className="font-semibold text-base">Slot {idx + 1}</span>
                          {/* Global slot number in top-right corner, small and light */}
                          <span className="absolute top-1 right-1 text-[10px] text-gray-400 bg-white/80 dark:bg-gray-900/80 px-1 rounded z-10 pointer-events-none">
                            # {slot.slotNo}
                          </span>
                          {slot.taken && (
                            <span className="absolute bottom-1 right-1 flex items-center gap-1 text-xs text-red-500 font-bold z-20">
                              <Lock className="w-3 h-3 mr-0.5" /> Taken
                            </span>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              <div className="mb-2 font-semibold">Available Slots</div>
              <div className="grid grid-cols-4 gap-2">
                {slotRows[0].map((slot) => (
                  <Button
                    key={slot.slotNo}
                    variant={
                      selectedSlot && selectedSlot.slotNo === slot.slotNo
                        ? "default"
                        : "outline"
                    }
                    className={`w-full relative ${slot.taken ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={slot.taken || submitting}
                    onClick={() => {
                      setSelectedSlot({ slotNo: slot.slotNo });
                      setSelectedTeam(null);
                    }}
                  >
                    {slot.slotNo}
                    {slot.taken && (
                      <span className="absolute top-1 right-1 flex items-center gap-1 text-xs text-red-500 font-bold">
                        <Lock className="w-3 h-3 mr-0.5" /> Taken
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <form onSubmit={handleBook} className="space-y-4 mt-4">
            <Label htmlFor="inGameName">FREE FIRE ID name</Label>
            <Input
              id="inGameName"
              value={inGameName}
              onChange={(e) => setInGameName(e.target.value)}
              placeholder="Enter your in-game name"
              required
            />
            <Button
              type="submit"
              className="w-full bg-cyan-600 text-white hover:bg-cyan-700"
              disabled={submitting || !selectedSlot || !inGameName.trim()}
            >
              {submitting ? "Joining..." : "Join Match"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
} 