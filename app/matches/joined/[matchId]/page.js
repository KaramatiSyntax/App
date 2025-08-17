'use client';
import { useState, useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, IndianRupee, KeyRound, Trophy, MapPin, Award, Target, Shield, Zap, FileText } from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import SlotBooker from '@/components/MAtchCard/SlotBooker';

// Remove the BlueTick component definition

export default function MatchDetailsPage({ params }) {
  const { matchId } = use(params);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('details');
  const [showRoom, setShowRoom] = useState(false);
  const [user, setUser] = useState(null);
  const [showSlotBooker, setShowSlotBooker] = useState(false); // <-- added

  const router = useRouter();

  // Function to navigate to rules page
  const handleLearnMore = () => {
    router.push('/rules');
  };

  useEffect(() => {
    async function fetchMatch() {
      setLoading(true);
      try {
        const res = await fetch(`/api/matches?id=${matchId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch match');
        }
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setMatch(data);
      } catch (e) {
        console.error('Error fetching match:', e);
        setMatch(null);
      }
      setLoading(false);
    }
    fetchMatch();
    // Try to get user from Clerk if available
    if (typeof window !== 'undefined') {
      // import('@clerk/nextjs').then(({ useUser }) => {
      //   const { user } = useUser();
      //   setUser(user);
      // }).catch(() => {});
    }
  }, [matchId]);

  // Player list component
  const PlayerList = ({ players, showPoints }) => {
    // Show all players from the array without deduplication
    const allPlayers = Array.isArray(players) ? players : [];

    // Sort players by points (highest first) if showing results
    const sortedPlayers = showPoints
      ? [...allPlayers].sort((a, b) => (b.points || 0) - (a.points || 0))
      : allPlayers;

    return (
      <div className="divide-y divide-white/20">
        {sortedPlayers.map((player, idx) => (
          <motion.div
            key={`${player.userId || player.username || player.email || player.inGameName}-${player.slotNo}-${player.team || 'no-team'}-${idx}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
              <AvatarImage src={player.avatar || player.imageUrl || '/no-profile.jpg'} alt={player.name || player.username || 'Player'} />
              <AvatarFallback className="text-xs">{(player.name || player.username || 'P')[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-xs sm:text-sm text-white truncate flex items-center">
                {player.name || player.username || 'Player'}
              </div>
              {player.email && <div className="text-xs text-white/70 truncate">{player.email}</div>}
              {player.inGameName && <div className="text-xs text-blue-400">IGN: {player.inGameName}</div>}
              {player.slotNo && <div className="text-xs text-white/70">Slot: {player.slotNo}</div>}
              {player.team && <div className="text-xs text-blue-400">Team: {player.team}</div>}
            </div>
            {showPoints && (
              <div className="flex flex-col items-end gap-1">
                <div className="text-xs font-semibold text-blue-400 min-w-[30px] sm:min-w-[40px] text-right">
                  {player.points !== undefined ? player.points : '-'}
                </div>
                {showPoints && player.points !== undefined && (
                  <div className="text-xs text-white/70">
                    pts
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  // Check if user is a participant
  const isParticipant = user && match && match.players && match.players.some(
    (p) =>
      (user.id && p.userId === user.id) ||
      (user.username && p.username === user.username) ||
      (user.emailAddresses && p.email === user.emailAddresses[0]?.emailAddress)
  );

  // Helper to determine if match is team-based (CS/LW)
  const isTeamMatch = (type) => {
    return type === "cs" || type === "lw";
  };

  // Helper to get slots per team
  const getSlotsPerTeam = (format) => {
    const f = format?.toLowerCase();
    if (f === "duo") return 2;
    if (f === "squad") return 4;
    return 1; // solo default
  };

  // Deduplicate players for accurate count
  const uniquePlayers = match?.players ? match.players.reduce((acc, player) => {
    if (!acc.some(existing =>
      existing.userId === player.userId ||
      existing.username === player.username ||
      existing.email === player.email ||
      (existing.inGameName === player.inGameName && existing.slotNo === player.slotNo && existing.team === player.team)
    )) {
      acc.push(player);
    }
    return acc;
  }, []) : [];

  // Calculate progress bar values using same logic as SlotBooker
  let totalSlots = 0;
  let takenSlotsCount = 0;
  if (match && isTeamMatch(match.matchType)) {
    // For CS/LW: total slots = slotsPerTeam * 2 (not maxParticipants)
    const slotsPerTeam = getSlotsPerTeam(match.matchFormat);
    totalSlots = slotsPerTeam * 2;
    takenSlotsCount = Array.isArray(match.players)
      ? match.players.filter(p => {
        const playerTeam = p.team?.toLowerCase();
        return (playerTeam === 'team1' || playerTeam === 'team2' ||
          playerTeam === 'team 1' || playerTeam === 'team 2') &&
          p.slotNo;
      }).length
      : 0;
  } else if (match) {
    // For BR: use maxParticipants for total slots
    totalSlots = match.maxParticipants;
    takenSlotsCount = Array.isArray(match.players)
      ? match.players.filter(p => p.slotNo).length
      : 0;
  }

  // Use simple count of players array for joined players
  const joinedPlayersCount = Array.isArray(match?.players) ? match.players.length : 0;
  const playerCount = joinedPlayersCount; // Use simple count for consistency
  const progress = totalSlots > 0 ? (joinedPlayersCount / totalSlots) * 100 : 0;

  const formatDate = (date) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  const formatTime = (date) => {
    return format(new Date(date), 'hh:mm a');
  };

  const statusColors = {
    upcoming: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    running: "bg-green-500/10 text-green-500 border-green-500/20",
    completed: "bg-gray-500/10 text-gray-500 border-gray-500/20"
  };

  const matchTypeColors = {
    cs: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    lw: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    br: "bg-orange-500/10 text-orange-500 border-orange-500/20"
  };

  if (loading) {
    return null; // Let the AppWrapper handle the skeleton
  }

  if (!match) {
    return (
      <div className="min-h-screen  flex justify-center items-center">
        <div className="text-center">
          <div className="text-red-500 text-2xl font-bold mb-2">Match Not Found</div>
          <p className="text-white/70">The match you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  py-4 px-2 sm:px-0 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-4"
        >
          <Card className="relative overflow-hidden w-full aspect-video shadow-2xl bg-white/10 border border-white/20">
            <div className="absolute top-0 left-0 h-full w-full">
              <Image
                src={match?.banner || '/space.png'}
                alt={match?.name || 'Match'}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 inset-0 p-4 sm:p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="flex gap-1 sm:gap-2">
                    <Badge className={`${statusColors[match?.status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'} border text-xs`}>
                      {match?.status || 'unknown'}
                    </Badge>
                    <Badge className={`${matchTypeColors[match?.matchType] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'} border text-xs`}>
                      {match?.matchType?.toUpperCase() || 'UNKNOWN'}
                    </Badge>
                  </div>
                  {isParticipant && (match?.roomId || match?.roomPassword) && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-1 text-xs shadow-md bg-white/20 backdrop-blur-sm text-white"
                      onClick={() => setShowRoom(true)}
                    >
                      <KeyRound className="w-3 h-3" />
                      <span className="hidden sm:inline">Show Id Pass</span>
                      <span className="sm:hidden">ID</span>
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{match?.name || 'Match'}</h1>

                  <div className="flex items-center gap-2 sm:gap-4 text-white/90 text-xs sm:text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{match?.time ? formatDate(match.time) : 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{match?.time ? formatTime(match.time) : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          {/* Join Match Button */}
          <div className="flex justify-center mt-3">
            <Button
              onClick={() => setShowSlotBooker(true)}
              size="sm"
              className="w-full sm:w-auto sm:px-32 md:px-40 lg:px-52 py-5 bg-cyan-500 text-white font-semibold rounded-lg text-base sm:text-lg"
            >
              Join Match
            </Button>
          </div>

          {/* Modal Overlay with fade animation */}
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm
    transition-opacity duration-300 ease-out
    ${showSlotBooker ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          >
            {/* Modal Card with scale animation */}
            <div
              className={`relative w-full max-w-lg mx-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 
      border border-white/10 rounded-2xl p-6 shadow-xl
      transform transition-transform duration-300 ease-out
      ${showSlotBooker ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowSlotBooker(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                ✕
              </button>
              {/* SlotBooker */}
              <SlotBooker match={match} />
            </div>
          </div>
        </motion.div>

        {/* Compact Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <Card className="p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-medium">{joinedPlayersCount}/{totalSlots}</span>
                <span className="text-muted-foreground">Players</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <IndianRupee className="w-4 h-4 text-green-500" />
                  <span className="font-medium">₹{match?.entry || 0}</span>
                  <span className="text-muted-foreground">Entry</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">₹{match?.winnings || 0}</span>
                  <span className="text-muted-foreground">Prize</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">{match?.matchFormat || 'N/A'}</span>
                </div>
              </div>
            </div>
            <Progress value={progress} className="mt-2 h-1" />
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-1 sm:gap-2 mb-3"
        >
          <Button
            variant={tab === 'details' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('details')}
            className="flex items-center gap-1 text-xs"
          >
            <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Details</span>
            <span className="sm:hidden">Info</span>
          </Button>
          <Button
            variant={tab === 'joined' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('joined')}
            className="flex items-center gap-1 text-xs"
          >
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Joined ({joinedPlayersCount})</span>
            <span className="sm:hidden">{joinedPlayersCount}</span>
          </Button>
          <Button
            variant={tab === 'results' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('results')}
            className="flex items-center gap-1 text-xs"
          >
            <Award className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Results</span>
            <span className="sm:hidden">Results</span>
          </Button>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card/70 rounded-xl p-3 sm:p-6 min-h-[250px]"
        >
          {tab === 'details' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                  Match Information
                </h2>
                <div className="grid grid-col-2 gap-3">
                  <div className="space-y-3 grid grid-col-2 gap-3">
                    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-3 rounded-lg border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-sm">Match Type</span>
                      </div>
                      <Badge className={`${matchTypeColors[match.matchType]} text-xs`}>
                        {match.matchType?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-3 rounded-lg border border-green-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-sm">Format</span>
                      </div>
                      <span className="font-medium">{match.matchFormat}</span>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 p-3 rounded-lg border border-orange-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        <span className="font-medium text-sm">Date & Time</span>
                      </div>
                      <span className="text-xs sm:text-sm">{formatDate(match.time)} {formatTime(match.time)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 p-3 rounded-lg border border-yellow-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <IndianRupee className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium text-sm">Entry Fee</span>
                      </div>
                      <span className="font-medium">₹{match.entry}</span>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-3 rounded-lg border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-4 h-4 text-purple-500" />
                        <span className="font-medium text-sm">Prize Pool</span>
                      </div>
                      <span className="font-medium text-green-500">₹{match.winnings}</span>
                    </div>
                    <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-3 rounded-lg border border-cyan-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-cyan-500" />
                        <span className="font-medium text-sm">Status</span>
                      </div>
                      <Badge className={`${statusColors[match.status]} text-xs`}>
                        {match.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Rules & Guidelines
                </h3>
                <div className="p-4 bg-gradient-to-r from-gray-500/10 to-gray-600/10 rounded-lg border border-gray-500/20">
                  <p className="text-xs sm:text-sm leading-relaxed">{match.rules}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleLearnMore}
                className="text-xs"
              >
                <FileText className="w-3 h-3 mr-1" />
                Learn More
              </Button>
            </div>
          )}

          {tab === 'joined' && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                Joined Players ({joinedPlayersCount})
              </h2>
              {joinedPlayersCount === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No players have joined yet.</p>
                </div>
              ) : (
                <PlayerList players={match.players || []} showPoints={false} />
              )}
            </div>
          )}

          {tab === 'results' && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                Player Rankings
              </h2>
              {joinedPlayersCount === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">No players have joined yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Players will appear here once they join the match
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {match.players
                    .filter(player => player.points !== undefined && player.points !== null)
                    .sort((a, b) => (b.points || 0) - (a.points || 0))
                    .map((player, index) => (
                      <motion.div
                        key={`${player.userId || player.username || player.email || player.inGameName}-${player.slotNo}-${player.team || 'no-team'}-${index}`}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30' :
                          index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30' :
                            index === 2 ? 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30' :
                              'bg-white/5 border-white/10'
                          }`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {/* Rank Badge */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-amber-600 text-white' :
                              'bg-white/20 text-white'
                          }`}>
                          {index + 1}
                        </div>

                        {/* Medal Icon for top 3 */}
                        {index < 3 && (
                          <div className="flex-shrink-0">
                            {index === 0 && <span className="text-2xl">🥇</span>}
                            {index === 1 && <span className="text-2xl">🥈</span>}
                            {index === 2 && <span className="text-2xl">🥉</span>}
                          </div>
                        )}

                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-white truncate">
                            {player.name || player.username || player.inGameName || 'Player'}
                          </div>
                          {player.inGameName && player.inGameName !== (player.name || player.username) && (
                            <div className="text-xs text-blue-400">IGN: {player.inGameName}</div>
                          )}
                          {player.team && (
                            <div className="text-xs text-purple-400">Team: {player.team}</div>
                          )}
                        </div>

                        {/* Points */}
                        <div className="flex flex-col items-end gap-1">
                          <div className={`text-lg font-bold ${index === 0 ? 'text-yellow-400' :
                            index === 1 ? 'text-gray-300' :
                              index === 2 ? 'text-amber-400' :
                                'text-blue-400'
                            }`}>
                            {player.points}
                          </div>
                          <div className="text-xs text-white/70">pts</div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Room ID/Pass Modal */}
        {showRoom && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50" onClick={() => setShowRoom(false)}>
            <motion.div
              className="bg-white dark:bg-zinc-900 rounded-xl p-4 sm:p-6 shadow-xl flex flex-col items-center gap-3 sm:gap-4 min-w-[280px] sm:min-w-[300px]"
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="text-center">
                <KeyRound className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-primary" />
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Room Details</h3>
              </div>
              <div className="space-y-2 sm:space-y-3 w-full">
                <div className="flex justify-between items-center p-2 sm:p-3 bg-muted/50 rounded-lg text-sm">
                  <span className="text-muted-foreground">Room ID:</span>
                  <Badge className="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-primary/90 text-primary-foreground">
                    {match?.roomId || 'N/A'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-muted/50 rounded-lg text-sm">
                  <span className="text-muted-foreground">Password:</span>
                  <Badge className="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-primary/90 text-primary-foreground">
                    {match?.roomPassword || 'N/A'}
                  </Badge>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowRoom(false)} className="text-xs">
                Close
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
} 