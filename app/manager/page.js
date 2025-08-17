"use client";

import { useUserData } from "@/lib/hooks/useUserData";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RefreshCw, Plus, Pencil, Trash2, Award, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Image from "next/image";
import { Calendar, IndianRupee, Users as UsersIcon } from 'lucide-react';

export default function ManagerPage() {
  // Remove Clerk logic and use local auth (already implemented)
  const { userData, loading: userDataLoading } = useUserData();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [matches, setMatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [playerDialogMatch, setPlayerDialogMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [formData, setFormData] = useState({
    matchId: "",
    name: "",
    status: "upcoming",
    time: "",
    entry: 0,
    winnings: "0",
    roomId: "",
    roomPassword: "",
    matchFormat: "Solo",
    rules: "No PC allowed, default rules apply",
    maxParticipants: 48,
    minParticipants: 2,
    matchType: "cs",
    createdBy: ""
  });
  const [formError, setFormError] = useState("");
  const [isPointsDialogOpen, setIsPointsDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [pendingPointsUpdates, setPendingPointsUpdates] = useState({});
  const [isSavingPoints, setIsSavingPoints] = useState(false);
  const [pointsMessage, setPointsMessage] = useState({ type: '', message: '' });
  const [notifyLoading, setNotifyLoading] = useState({});
  const [notifyMessage, setNotifyMessage] = useState({});

  useEffect(() => {
    // Check if user is authenticated and has proper role
    if (!userDataLoading && userData && !["manager", "admin", "host"].includes(userData.role)) {
      setShouldRedirect(true);
    }
  }, [userDataLoading, userData?.role]);

  useEffect(() => {
    if (shouldRedirect) {
      router.push("/");
    }
  }, [shouldRedirect, router]);

  // Helper to calculate profits (match manager style)
  function getProfitFields(s) {
    const entryFee = Number(s.entry) || 0;
    const joinedPlayers = Array.isArray(s.players) ? s.players.length : 0;
    const totalCollected = entryFee * joinedPlayers;
    const totalWinnings = Array.isArray(s.players) ? s.players.reduce((sum, p) => sum + (Number(p.points) || 0), 0) : 0;
    const profit = totalCollected - totalWinnings;
    const platformProfit = profit * 0.5;
    const managementFee = profit * 0.1;
    const managerProfit = profit * 0.4;
    return {
      totalCollected,
      totalWinnings,
      profit,
      platformProfit,
      managementFee,
      managerProfit,
    };
  }

  // Helper to get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "upcoming":
        return (
          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
            Upcoming
          </span>
        );
      case "running":
        return (
          <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
            Running
          </span>
        );
      case "completed":
        return (
          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full">
            Unknown
          </span>
        );
    }
  };

  // Helper to get format badge
  const getFormatBadge = (format) => {
    switch (format) {
      case "Solo":
        return (
          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
            Solo
          </span>
        );
      case "Duo":
        return (
          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full">
            Duo
          </span>
        );
      case "Squad":
        return (
          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
            Squad
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full">
            N/A
          </span>
        );
    }
  };

  // Fetch all matches, but filter for those created by the manager
  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches`);
      if (res.ok) {
        const data = await res.json();
        // Only show matches managed/created by this user
        const filtered = data.filter(s => s.createdBy === userData?.email);

        setMatches(filtered);
      } else {
        console.error('Manager Page: Failed to fetch matches');
      }
    } catch (error) {
      console.error('Manager Page: Error fetching matches:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMatches();
    // eslint-disable-next-line
  }, []);

  const filteredMatches = matches.filter(match => {
    const matchesSearch = match.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.matchId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || match.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate total manager profit and platform charge
  const totalManagerProfit = matches.reduce((sum, m) => sum + getProfitFields(m).managerProfit, 0);
  const totalPlatformCharge = matches.reduce((sum, m) => sum + getProfitFields(m).platformProfit, 0);
  // Calculate total management cost
  const totalManagementCost = matches.reduce((sum, m) => sum + getProfitFields(m).managementFee, 0);

  const handleEdit = (match) => {
    setEditingMatch(match);
     
     const localDate = new Date(match.time);

    // 2. Manually build the required 'YYYY-MM-DDTHH:mm' string from local components.
    // We use padStart() to add a leading zero if a value is a single digit (e.g., '08' instead of '8').
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0'); // getMonth() is 0-indexed, so we add 1.
    const day = String(localDate.getDate()).padStart(2, '0');
    const hours = String(localDate.getHours()).padStart(2, '0');
    const minutes = String(localDate.getMinutes()).padStart(2, '0');

    // 3. This is the correctly formatted string for the input field.
    const formattedLocalDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

    setFormData({
      matchId: match.matchId || "",
      name: match.name,
      status: match.status,
      time: formattedLocalDateTime,
      entry: match.entry,
      winnings: match.winnings?.toString() || "0",
      roomId: match.roomId !== undefined ? match.roomId : "",
      roomPassword: match.roomPassword !== undefined ? match.roomPassword : "",
      matchFormat: match.matchFormat ? match.matchFormat.charAt(0).toUpperCase() + match.matchFormat.slice(1).toLowerCase() : "Solo",
      rules: match.rules || "No PC allowed, default rules apply",
      maxParticipants: match.maxParticipants || 48,
      minParticipants: match.minParticipants || 2,
      matchType: (match.matchType || "cs").toLowerCase(),
      createdBy: match.createdBy || userData?.email || ""
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      matchId: "",
      name: "",
      status: "upcoming",
      time: "",
      entry: 0,
      winnings: "0",
      roomId: "",
      roomPassword: "",
      matchFormat: "Solo",
      rules: "No PC allowed, default rules apply",
      maxParticipants: 48,
      minParticipants: 2,
      matchType: "cs",
      createdBy: userData?.email || ""
    });
    setEditingMatch(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!formData.name.trim() || !formData.time || !formData.matchId.trim() || !formData.matchFormat || !formData.matchType || !formData.roomId.trim() || !formData.roomPassword.trim()) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (isNaN(Number(formData.entry)) || Number(formData.entry) < 0) {
      setFormError("Entry fee must be a non-negative number.");
      return;
    }
    if (isNaN(Number(formData.maxParticipants)) || Number(formData.maxParticipants) < 1) {
      setFormError("Max participants must be at least 1.");
      return;
    }
    if (isNaN(Number(formData.minParticipants)) || Number(formData.minParticipants) < 1) {
      setFormError("Min participants must be at least 1.");
      return;
    }
    try {
      const url = editingMatch 
        ? `/api/matches?id=${editingMatch._id}`
        : "/api/matches";
      // Pick a random banner if creating (not editing)
      let banner = formData.banner;
      if (!editingMatch) {
        const randomIdx = Math.floor(Math.random() * 4) + 1;
        banner = `/${randomIdx}.jpg`;
      }
      const matchData = {
        ...formData,
        banner,
        time: new Date(formData.time).toISOString(),
        entry: parseInt(formData.entry),
        winnings: formData.winnings, // keep as string
        maxParticipants: parseInt(formData.maxParticipants),
        minParticipants: parseInt(formData.minParticipants),
        matchFormat: formData.matchFormat.charAt(0).toUpperCase() + formData.matchFormat.slice(1).toLowerCase(),
        matchType: formData.matchType.toLowerCase(),
        roomId: formData.roomId,
        roomPassword: formData.roomPassword,
        status: formData.status,
        rules: formData.rules || "No PC allowed, default rules apply",
        createdBy: userData?.email || ""
      };
      const response = await fetch(url, {
        method: editingMatch ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(matchData),
      });
      const responseData = await response.json();
      if (response.ok) {
        fetchMatches();
        setIsDialogOpen(false);
        resetForm();
      } else {
        setFormError(responseData.error || responseData.message || 'Failed to save match');
      }
    } catch (error) {
      setFormError('Error saving match: ' + error.message);
    }
  };

  const handleManagePoints = (match) => {
    setSelectedMatch(match);
    setIsPointsDialogOpen(true);
  };

  const handleDelete = async (matchId) => {
    if (window.confirm('Are you sure you want to delete this match?')) {
      const res = await fetch(`/api/matches?id=${matchId}`, { method: 'DELETE' });
      if (res.ok) fetchMatches();
      else alert('Failed to delete match');
    }
  };

  // Notify all joined users for a match
  const handleNotifyMatch = async (match) => {
    if (!match.players || match.players.length === 0) {
      setNotifyMessage((prev) => ({ ...prev, [match._id]: 'No players to notify.' }));
      return;
    }
    setNotifyLoading((prev) => ({ ...prev, [match._id]: true }));
    setNotifyMessage((prev) => ({ ...prev, [match._id]: '' }));
    try {
      // Fetch user emails for all players
      const playerIds = match.players.map((p) => p.userId);
      // Fetch user details in bulk
      const res = await fetch('/api/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: playerIds }),
      });
      let emails = [];
      if (res.ok) {
        const users = await res.json();
        emails = users.map((u) => u.email).filter(Boolean);
      } else {
        // fallback: try to get emails from match.players if available
        emails = match.players.map((p) => p.email).filter(Boolean);
      }
      if (!emails.length) {
        setNotifyMessage((prev) => ({ ...prev, [match._id]: 'No emails found for players.' }));
        setNotifyLoading((prev) => ({ ...prev, [match._id]: false }));
        return;
      }
      // Send notification to each email
      const results = await Promise.all(emails.map(email =>
        fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'custom',
            userEmail: email,
            title: 'Match Starting Soon!',
            message: 'Get ready for war!'
          })
        })
      ));
      const allSuccess = results.every(r => r.ok);
      setNotifyMessage((prev) => ({ ...prev, [match._id]: allSuccess ? 'Notification sent to all joined users!' : 'Some notifications failed.' }));
    } catch (err) {
      setNotifyMessage((prev) => ({ ...prev, [match._id]: 'Error sending notifications.' }));
    }
    setNotifyLoading((prev) => ({ ...prev, [match._id]: false }));
  };

  if (userDataLoading) {
    return null; // Let the AppWrapper handle the skeleton
  }

  if (!userData) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <Card className="p-8 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-[12px] shadow-2xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-white/70">Please log in to access the manager panel.</p>
          </div>
        </Card>
      </div>
    );
  }

  if (userData && !["manager", "admin", "host"].includes(userData.role)) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <Card className="p-8 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-[12px] shadow-2xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-white/70">You don't have permission to access the manager panel.</p>
            <p className="text-white/50 text-sm mt-2">Your role: {userData?.role || 'No role assigned'}</p>
          </div>
        </Card>
      </div>
    );
  }



  return (
    <div className="min-h-screen ">
      <div className="container mx-auto px-2 py-8 pb-[64px]">
        <h1 className="text-2xl font-bold text-white mb-4">Room Manager Panel</h1>
        {/* Profit Summary */}
        <div className="w-full overflow-x-auto mb-4">
          <div className="flex gap-2 min-w-[500px]">
            <div className="flex-1 min-w-[140px] p-2 rounded bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 text-center">
              <div className="text-xs font-semibold text-green-700 dark:text-green-300">Your Profit</div>
              <div className="text-lg font-bold text-green-900 dark:text-green-100">₹{totalManagerProfit.toFixed(2)}</div>
            </div>
            <div className="flex-1 min-w-[140px] p-2 rounded bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 text-center">
              <div className="text-xs font-semibold text-blue-700 dark:text-blue-300">Platform</div>
              <div className="text-lg font-bold text-blue-900 dark:text-blue-100">₹{totalPlatformCharge.toFixed(2)}</div>
            </div>
            <div className="flex-1 min-w-[140px] p-2 rounded bg-orange-100 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 text-center">
              <div className="text-xs font-semibold text-orange-700 dark:text-orange-300">Mgmt Cost</div>
              <div className="text-lg font-bold text-orange-900 dark:text-orange-100">₹{totalManagementCost.toFixed(2)}</div>
            </div>
          </div>
        </div>
        {/* Remove verbose instructions, keep only a one-line formula */}
        <div className="mb-4 text-xs text-gray-600 dark:text-gray-400 text-center bg-white/20 dark:bg-black/20 rounded p-2 border border-gray-100 dark:border-gray-800">
          Profit = (Entry × Players) − (Points sum) &nbsp;|&nbsp; 40% You, 50% Platform, 10% Mgmt
        </div>
        <Card className="max-w-6xl mx-auto p-4 sm:p-10 rounded-2xl sm:rounded-3xl border border-white/20 bg-white/10 backdrop-blur-[12px] shadow-2xl">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
            <Button onClick={fetchMatches} variant="outline" size="icon" disabled={loading} className="h-8 w-8 p-0">
              <RefreshCw className={loading ? 'animate-spin' : ''} />
            </Button>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-cyan-500 hover:bg-cyan-600 text-white h-8 text-xs px-2">
                  <Plus className="w-4 h-4 mr-1" />
                  {editingMatch ? 'Edit' : 'Create'}
                </Button>
              </DialogTrigger>
              <DialogContent 
                className="max-w-xs sm:max-w-sm p-1 sm:p-2 max-h-[90vh] overflow-y-auto text-xs"
                onInteractOutside={e => e.preventDefault()}
              >
                <DialogHeader>
                  <DialogTitle className="text-xs font-bold">
                    {editingMatch ? "Edit Match" : "Create Match"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-2 mt-2">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="matchId" className="text-xs">Match ID</Label>
                      <Input
                        id="matchId"
                        value={formData.matchId}
                        onChange={(e) => setFormData({ ...formData, matchId: e.target.value })}
                        placeholder="match_001"
                        className="h-8"
                        disabled={!!editingMatch}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="name" className="text-xs">Tournament Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="h-8"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="entry" className="text-xs">Entry Fee (₹)</Label>
                      <Input
                        id="entry"
                        type="number"
                        value={formData.entry}
                        onChange={(e) => setFormData({ ...formData, entry: e.target.value })}
                        min="0"
                        required
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="winnings" className="text-xs">Winnings (₹)</Label>
                      <Input
                        id="winnings"
                        type="text"
                        value={formData.winnings}
                        onChange={(e) => setFormData({ ...formData, winnings: e.target.value })}
                        min="0"
                        required
                        className="h-8"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="time" className="text-xs">Time</Label>
                      <Input
                        id="time"
                        type="datetime-local"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        required
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="matchFormat" className="text-xs">Format</Label>
                      <Select
                        value={formData.matchFormat}
                        onValueChange={(value) => setFormData({ ...formData, matchFormat: value })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Solo">Solo</SelectItem>
                          <SelectItem value="Duo">Duo</SelectItem>
                          <SelectItem value="Squad">Squad</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="roomId" className="text-xs">Room ID</Label>
                      <Input
                        id="roomId"
                        value={formData.roomId}
                        onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                        placeholder="CR123456789"
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="roomPassword" className="text-xs">Password</Label>
                      <Input
                        id="roomPassword"
                        value={formData.roomPassword}
                        onChange={(e) => setFormData({ ...formData, roomPassword: e.target.value })}
                        placeholder="turrani2024"
                        className="h-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="matchType" className="text-xs">Match Type</Label>
                    <Select
                      value={formData.matchType}
                      onValueChange={(value) => setFormData({ ...formData, matchType: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select match type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cs">cs</SelectItem>
                        <SelectItem value="lw">lw</SelectItem>
                        <SelectItem value="br">br</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="status" className="text-xs">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="running">Running</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="rules" className="text-xs">Rules</Label>
                    <Textarea
                      id="rules"
                      value={formData.rules}
                      onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                      placeholder="No PC allowed, default rules apply"
                      rows={2}
                      className="resize-none text-xs"
                    />
                  </div>
                  {formError && <div className="text-red-500 text-xs">{formError}</div>}
                  <Button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white h-8 text-xs px-2">
                    {editingMatch ? 'Update Match' : 'Create Match'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          {/* Filters */}
          {/* Removed duplicate status filter dropdown inside Card */}
          {/* Matches Table */}
          {/* Card grid for matches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {filteredMatches.length > 0 ? (
                      filteredMatches.map((match) => (
                <Card key={match._id} className="rounded-xl border border-white/10 bg-white/10 backdrop-blur-[6px] shadow-lg flex flex-col min-h-[180px] p-0">
                  <div className="relative w-full h-24 rounded-t-xl overflow-hidden border-b">
                              <Image
                                src={match.banner || "https://freeimage.host/i/FCqtWHN"}
                                alt={match.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                  <div className="flex-1 flex flex-col px-3 py-2 gap-1">
                    <div className="font-bold text-base text-white truncate mb-1">{match.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(match.time).toLocaleDateString()} {new Date(match.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                    <div className="flex items-center gap-2 text-xs">
                      <IndianRupee className="w-3 h-3 text-gray-400" />
                      <span className="font-medium text-white">₹{match.entry}</span>
                              <span className="text-gray-400">/</span>
                      <span className="font-medium text-green-400">₹{match.winnings}</span>
                            </div>
                    <div className="flex items-center gap-2 text-xs">
                      <UsersIcon className="w-3 h-3 text-gray-400" />
                      <span className="font-medium text-white">{match.players?.length || 0}/{match.maxParticipants}</span>
                      {getStatusBadge(match.status)}
                      {getFormatBadge(match.matchFormat)}
                            </div>
                  </div>
                  <div className="flex gap-1 px-3 pb-2 pt-1 mt-auto flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(match)}
                      className="h-7 px-2 flex items-center gap-1"
                              >
                                <Pencil className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleManagePoints(match)}
                      className="h-7 px-2 flex items-center gap-1 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700"
                                title="Manage Points"
                              >
                                <Award className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="hidden sm:inline">Points</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setPlayerDialogMatch(match); setIsPlayerDialogOpen(true); }}
                      className="h-7 px-2 flex items-center gap-1 text-blue-600 hover:text-blue-700"
                                title="View Players"
                              >
                                <UsersIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Players</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNotifyMatch(match)}
                      className="h-7 px-2 flex items-center gap-1 text-red-600 hover:text-red-700"
                      title="Notify all joined users"
                      disabled={notifyLoading[match._id]}
                    >
                      {notifyLoading[match._id] ? (
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">Notify</span>
                              </Button>
                            </div>
                  {notifyMessage[match._id] && (
                    <span className="text-xs text-green-500 px-3 pb-2 block">{notifyMessage[match._id]}</span>
                  )}
                </Card>
                      ))
                    ) : (
              <div className="col-span-full text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No matches found</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                              {searchQuery || statusFilter !== "all" 
                                ? "Try adjusting your filters" 
                                : "Create your first match to get started"
                              }
                            </p>
                          </div>
                    )}
              </div>
          {/* Player View Dialog */}
          <Dialog open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen}>
            <DialogContent className="bg-white/10 backdrop-blur-xl border-white/20 text-white max-w-full sm:max-w-2xl p-2 sm:p-4 text-xs">
              <DialogHeader>
                <DialogTitle className="text-xs">Players List</DialogTitle>
                <div className="text-white/60 text-xs mb-1">
                  Match: <span className="font-mono">{playerDialogMatch?.name}</span> | Match ID: <span className="font-mono">{playerDialogMatch?.matchId}</span>
                </div>
              </DialogHeader>
              <div className="overflow-x-auto">
                <Table className="min-w-[400px] text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead>In-Game Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Slot No</TableHead>
                      <TableHead>Team</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(playerDialogMatch?.players || []).map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{p.inGameName || ''}</TableCell>
                        <TableCell>
                          <span className="flex items-center">
                            {p.username || ''}
                          </span>
                        </TableCell>
                        <TableCell>{p.email || ''}</TableCell>
                        <TableCell>{p.points ?? ''}</TableCell>
                        <TableCell>{p.slotNo ?? ''}</TableCell>
                        <TableCell>{p.team || ''}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </DialogContent>
          </Dialog>
          {/* Points Management Dialog */}
          <Dialog open={isPointsDialogOpen} onOpenChange={setIsPointsDialogOpen}>
            <DialogContent className="max-w-xs sm:max-w-sm p-1 sm:p-2 max-h-[90vh] overflow-y-auto text-xs">
              <DialogHeader>
                <DialogTitle className="text-xs font-bold flex items-center gap-2 text-foreground">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Manage Player Points - {selectedMatch?.name}
                </DialogTitle>
              </DialogHeader>
              {pointsMessage.type && (
                <div className={`p-2 rounded border text-xs mb-2 ${
                  pointsMessage.type === 'success' 
                    ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-700/30 dark:text-green-200'
                    : 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-700/30 dark:text-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {pointsMessage.type === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span className="font-medium">{pointsMessage.message}</span>
                  </div>
                </div>
              )}
              {selectedMatch && (
                <div className="space-y-2">
                  {selectedMatch.players && selectedMatch.players.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Player Points</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{selectedMatch.players.length} Players</span>
                          {Object.keys(pendingPointsUpdates).length > 0 && (
                            <span className="bg-orange-100 text-orange-800 text-xs rounded px-2 py-1">
                              {Object.keys(pendingPointsUpdates).length} Pending
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <Table className="text-xs w-full">
                          <TableHeader>
                            <TableRow>
                              <TableHead>In-Game Name</TableHead>
                              <TableHead>Points</TableHead>
                              {/* Hide other columns on mobile */}
                              <TableHead className="hidden sm:table-cell">Username</TableHead>
                              <TableHead className="hidden sm:table-cell">Email</TableHead>
                              <TableHead className="hidden sm:table-cell">Slot No</TableHead>
                              <TableHead className="hidden sm:table-cell">Team</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedMatch.players
                              .sort((a, b) => (b.points || 0) - (a.points || 0))
                              .map((player, index) => {
                                const currentPoints = pendingPointsUpdates[player.userId] !== undefined 
                                  ? pendingPointsUpdates[player.userId] 
                                  : (player.points || 0);
                                return (
                                  <TableRow key={player.userId} className="hover:bg-accent/50">
                                    <TableCell>{player.inGameName || "N/A"}</TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          value={currentPoints}
                                          onChange={(e) => {
                                            const newPoints = parseInt(e.target.value) || 0;
                                            setPendingPointsUpdates(prev => ({ ...prev, [player.userId]: newPoints }));
                                          }}
                                          className="w-16 h-7 text-xs"
                                          min="0"
                                        />
                                        <span className="text-xs text-muted-foreground">pts</span>
                                      </div>
                                    </TableCell>
                                    {/* Hide details on mobile, show on sm+ */}
                                    <TableCell className="hidden sm:table-cell">{player.username || ''}</TableCell>
                                    <TableCell className="hidden sm:table-cell">{player.email || ''}</TableCell>
                                    <TableCell className="hidden sm:table-cell">{player.slotNo ?? ''}</TableCell>
                                    <TableCell className="hidden sm:table-cell">{player.team || ''}</TableCell>
                                    <TableCell>
                                      <div className="flex gap-1">
                                        <Button size="sm" variant="outline" onClick={() => setPendingPointsUpdates(prev => ({ ...prev, [player.userId]: currentPoints + 10 }))} className="h-6 px-2 text-xs bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300">+10</Button>
                                        <Button size="sm" variant="outline" onClick={() => setPendingPointsUpdates(prev => ({ ...prev, [player.userId]: Math.max(0, currentPoints - 10) }))} className="h-6 px-2 text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300">-10</Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="flex justify-end pt-4 border-t border-border">
                        <Button
                          onClick={async () => {
                            if (Object.keys(pendingPointsUpdates).length === 0) {
                              setPointsMessage({ type: 'error', message: 'No changes to save' });
                              return;
                            }
                            setIsSavingPoints(true);
                            try {
                              const updatePromises = Object.entries(pendingPointsUpdates).map(async ([userId, newPoints]) => {
                                const player = selectedMatch.players.find(p => p.userId === userId);
                                if (!player) return { success: false, error: 'Player not found' };
                                const response = await fetch(`/api/matches/${selectedMatch._id}/points`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ playerId: userId, points: newPoints, updatedBy: 'Manager' }),
                                });
                                if (response.ok) return { success: true };
                                const errorData = await response.json();
                                return { success: false, error: errorData.error };
                              });
                              const results = await Promise.all(updatePromises);
                              const failed = results.filter(r => !r.success);
                              if (failed.length === 0) {
                                setPointsMessage({ type: 'success', message: 'All points updated successfully!' });
                                fetchMatches();
                                setIsPointsDialogOpen(false);
                                setPendingPointsUpdates({});
                              } else {
                                setPointsMessage({ type: 'error', message: `Some updates failed: ${failed.map(f => f.error).join(', ')}` });
                              }
                            } catch (error) {
                              setPointsMessage({ type: 'error', message: 'Error saving points: ' + error.message });
                            } finally {
                              setIsSavingPoints(false);
                            }
                          }}
                          disabled={isSavingPoints || Object.keys(pendingPointsUpdates).length === 0}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs px-2"
                        >
                          {isSavingPoints ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Save Changes ({Object.keys(pendingPointsUpdates).length})
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No players joined yet</p>
                      <p className="text-sm text-gray-400">
                        Players will appear here once they join the match
                      </p>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </Card>
      </div>
    </div>
  );
} 