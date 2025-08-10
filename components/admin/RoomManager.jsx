"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, Filter, Calendar, IndianRupee, Users, Award, CheckCircle, AlertCircle, Calculator, Crown, Target } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserData } from "@/lib/hooks/useUserData";

export default function RoomManager() {
  const { userData } = useUserData();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profitSummary, setProfitSummary] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPointsDialogOpen, setIsPointsDialogOpen] = useState(false);
  const [isProfitDialogOpen, setIsProfitDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [editingMatch, setEditingMatch] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pointsMessage, setPointsMessage] = useState({ type: '', message: '' });
  const [pendingPointsUpdates, setPendingPointsUpdates] = useState({});
  const [isSavingPoints, setIsSavingPoints] = useState(false);
  const [profitData, setProfitData] = useState(null);
  const [formData, setFormData] = useState({
    matchId: "",
    name: "",
    status: "upcoming",
    time: "",
    entry: 0,
    winnings: 0,
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

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await fetch("/api/matches?createdBy=" + (userData?.email || ""));
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      const data = await response.json();
      console.log('Fetched matches:', data);
      setMatches(data);
      calculateProfitSummary(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching matches:", error);
      setLoading(false);
    }
  };

  const calculateProfitSummary = (matchesData) => {
    const completedMatches = matchesData.filter(match => match.status === 'completed');
    let totalProfit = 0;
    let totalMatches = completedMatches.length;
    completedMatches.forEach(match => {
      const entries = match.players?.length || 0;
      const entryFees = entries * match.entry;
      // Use sum of player.points for winnings
      const winnings = Array.isArray(match.players) ? match.players.reduce((sum, p) => sum + (Number(p.points) || 0), 0) : 0;
      const profit = entryFees - winnings;
      totalProfit += profit;
    });
    setProfitSummary({
      totalProfit,
      totalMatches,
      managerProfit: totalProfit * 0.4,
      managementFee: totalProfit * 0.1,
      platformProfit: totalProfit * 0.5
    });
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
    if (isNaN(Number(formData.winnings)) || Number(formData.winnings) < 0) {
      setFormError("Winnings must be a non-negative number.");
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
        winnings: parseInt(formData.winnings),
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

      console.log('Submitting match data:', matchData);

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
      console.error("Error saving match:", error);
      setFormError('Error saving match: ' + error.message);
    }
  };

  const handleEdit = (match) => {
    console.log('Editing match:', match);
    setEditingMatch(match);
    const matchTime = new Date(match.time);
    const formattedTime = matchTime.toISOString().slice(0, 16);
    setFormData({
      matchId: match.matchId || "",
      name: match.name,
      banner: match.banner || "",
      status: match.status,
      time: formattedTime,
      entry: match.entry,
      winnings: match.winnings,
      roomId: match.roomId !== undefined ? match.roomId : "",
      roomPassword: match.roomPassword !== undefined ? match.roomPassword : "",
      matchFormat: match.matchFormat ? match.matchFormat.charAt(0).toUpperCase() + match.matchFormat.slice(1).toLowerCase() : "Solo",
      rules: match.rules || "No PC allowed, default rules apply",
      maxParticipants: match.maxParticipants || 48,
      minParticipants: match.minParticipants || 2,
      matchType: (match.matchType || "cs").toLowerCase(),
      createdBy: match.createdBy || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this match?")) {
      try {
        const response = await fetch(`/api/matches?id=${id}`, {
          method: "DELETE",
        });
        const responseData = await response.json();
        console.log('Delete response:', responseData);
        if (response.ok) {
          fetchMatches();
        } else {
          alert(responseData.error || responseData.message || 'Failed to delete match');
        }
      } catch (error) {
        console.error("Error deleting match:", error);
        alert('Error deleting match: ' + (error.error || error.message || 'Unknown error'));
      }
    }
  };

  const handleManagePoints = (match) => {
    setSelectedMatch(match);
    setPendingPointsUpdates({});
    setIsPointsDialogOpen(true);
  };

  const handleCalculateProfit = (match) => {
    setSelectedMatch(match);
    calculateProfit(match);
    setIsProfitDialogOpen(true);
  };

  const calculateProfit = (match) => {
    const totalEntries = match.players?.length || 0;
    const totalEntryFees = totalEntries * match.entry;
    const totalWinnings = match.winnings;
    const platformProfit = totalEntryFees - totalWinnings;
    const managerShare = platformProfit * 0.5; // 50% to manager
    const platformShare = platformProfit * 0.5; // 50% to platform

    setProfitData({
      totalEntries,
      totalEntryFees,
      totalWinnings,
      platformProfit,
      managerShare,
      platformShare,
      entryFee: match.entry
    });
  };

  const handleSavePoints = async () => {
    if (Object.keys(pendingPointsUpdates).length === 0) {
      setPointsMessage({ type: 'error', message: 'No changes to save' });
      return;
    }

    setIsSavingPoints(true);
    try {
      // Update points for each player individually using the points API
      const updatePromises = Object.entries(pendingPointsUpdates).map(async ([userId, newPoints]) => {
        const player = selectedMatch.players.find(p => p.userId === userId);
        if (!player) {
          console.error(`Player not found for userId: ${userId}`);
          return { success: false, error: 'Player not found' };
        }

        try {
          const response = await fetch(`/api/matches/${selectedMatch._id}/points`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              playerId: userId,
              points: newPoints,
              updatedBy: userData?.email || 'Manager'
            }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`Points updated for ${player.email || player.username}: ${result.message}`);
            return { success: true, result };
          } else {
            const errorData = await response.json();
            console.error(`Failed to update points for ${player.email || player.username}:`, errorData);
            return { success: false, error: errorData.error };
          }
        } catch (error) {
          console.error(`Error updating points for ${player.email || player.username}:`, error);
          return { success: false, error: error.message };
        }
      });

      // Wait for all updates to complete
      const results = await Promise.all(updatePromises);
      
      // Check if all updates were successful
      const failedUpdates = results.filter(result => !result.success);
      
      if (failedUpdates.length === 0) {
        setPointsMessage({ type: 'success', message: 'All points updated successfully! Notifications sent and coins updated.' });
        fetchMatches();
        setIsPointsDialogOpen(false);
        setPendingPointsUpdates({});
      } else {
        const errorMessages = failedUpdates.map(result => result.error).join(', ');
        setPointsMessage({ type: 'error', message: `Some updates failed: ${errorMessages}` });
      }
    } catch (error) {
      console.error("Error saving points:", error);
      setPointsMessage({ type: 'error', message: 'Error saving points: ' + error.message });
    } finally {
      setIsSavingPoints(false);
      setTimeout(() => setPointsMessage({ type: '', message: '' }), 5000);
    }
  };

  const resetForm = () => {
    setFormData({
      matchId: "",
      name: "",
      status: "upcoming",
      time: "",
      entry: 0,
      winnings: 0,
      roomId: "",
      roomPassword: "",
      matchFormat: "Solo",
      rules: "No PC allowed, default rules apply",
      maxParticipants: 48,
      minParticipants: 2,
      matchType: "cs",
      createdBy: ""
    });
    setEditingMatch(null);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      upcoming: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: "🕒" },
      running: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: "🔥" },
      completed: { color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200", icon: "✅" }
    };
    
    const config = statusConfig[status] || statusConfig.upcoming;
    return (
      <Badge className={`${config.color} font-medium`}>
        {config.icon} {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getFormatBadge = (format) => {
    const formatConfig = {
      Solo: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      Duo: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      Squad: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200"
    };
    
    return (
      <Badge className={`${formatConfig[format] || formatConfig.Squad} font-medium`}>
        {format}
      </Badge>
    );
  };

  const filteredMatches = matches.filter(match => {
    const matchesSearch = match.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         match.matchId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || match.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      <span className="ml-2 text-cyan-600 dark:text-cyan-200">Loading matches...</span>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Profit Summary for Managers */}
      {profitSummary && (
        <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400 text-lg">
              <Calculator className="w-4 h-4" />
              Profit Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
              <div className="text-center p-2 bg-green-500/20 rounded-lg">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">₹{profitSummary.totalProfit.toFixed(2)}</div>
                <div className="text-xs text-green-600 dark:text-green-400">Total Profit</div>
              </div>
              <div className="text-center p-2 bg-blue-500/20 rounded-lg">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">₹{profitSummary.managerProfit.toFixed(2)}</div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Manager Profit (40%)</div>
                </div>
              <div className="text-center p-2 bg-yellow-500/20 rounded-lg">
                <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">₹{profitSummary.managementFee.toFixed(2)}</div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400">Management Fee (10%)</div>
              </div>
              <div className="text-center p-2 bg-purple-500/20 rounded-lg">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">₹{profitSummary.platformProfit.toFixed(2)}</div>
                <div className="text-xs text-purple-600 dark:text-purple-400">Platform Profit (50%)</div>
                </div>
              </div>
            <div className="text-xs text-center text-white/70 mt-2">
              <strong>How is profit calculated?</strong><br />
              Profit = (Entry Fee × Number of Players) - (Sum of all player points)
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl sm:text-3xl font-bold text-foreground">Room Manager</h2>
          <p className="text-muted-foreground mt-1 text-sm">Create and manage matches</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Match
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                {editingMatch ? "Edit Match" : "Create Match"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="matchId" className="text-sm">Match ID</Label>
                  <Input
                    id="matchId"
                    value={formData.matchId}
                    onChange={(e) => setFormData({ ...formData, matchId: e.target.value })}
                    placeholder="match_001"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-sm">Tournament Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="time" className="text-sm">Match Time</Label>
                  <Input
                    id="time"
                    type="datetime-local"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="matchFormat" className="text-sm">Format</Label>
                  <Select
                    value={formData.matchFormat}
                    onValueChange={(value) => setFormData({ ...formData, matchFormat: value })}
                  >
                    <SelectTrigger className="h-10">
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="entry" className="text-sm">Entry Fee (₹)</Label>
                  <Input
                    id="entry"
                    type="number"
                    value={formData.entry}
                    onChange={(e) => setFormData({ ...formData, entry: e.target.value })}
                    min="0"
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="winnings" className="text-sm">Winnings (₹)</Label>
                  <Input
                    id="winnings"
                    type="number"
                    value={formData.winnings}
                    onChange={(e) => setFormData({ ...formData, winnings: e.target.value })}
                    min="0"
                    required
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="roomId" className="text-sm">Room ID</Label>
                  <Input
                    id="roomId"
                    value={formData.roomId}
                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                    placeholder="CR123456789"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="roomPassword" className="text-sm">Password</Label>
                  <Input
                    id="roomPassword"
                    value={formData.roomPassword}
                    onChange={(e) => setFormData({ ...formData, roomPassword: e.target.value })}
                    placeholder="turrani2024"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="matchType" className="text-sm">Match Type</Label>
                <Select
                  value={formData.matchType}
                  onValueChange={(value) => setFormData({ ...formData, matchType: value })}
                >
                  <SelectTrigger className="h-10">
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
                <Label htmlFor="rules" className="text-sm">Rules</Label>
                <Textarea
                  id="rules"
                  value={formData.rules}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  placeholder="No PC allowed, default rules apply"
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="status" className="text-sm">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formError && <div className="text-red-500 text-sm">{formError}</div>}
              <Button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 h-12">
                {editingMatch ? "Update Match" : "Create Match"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search matches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matches Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            Your Matches ({filteredMatches.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Banner</TableHead>
                  <TableHead className="w-20">ID</TableHead>
                  <TableHead>Tournament</TableHead>
                  <TableHead className="w-16">Format</TableHead>
                  <TableHead className="w-20">Time</TableHead>
                  <TableHead className="w-24">Entry/Win</TableHead>
                  <TableHead className="w-20">Players</TableHead>
                  <TableHead className="w-16">Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatches.length > 0 ? (
                  filteredMatches.map((match) => (
                    <TableRow key={match._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>
                        <div className="relative w-12 h-8 rounded overflow-hidden border">
                          <Image
                            src={match.banner || "https://freeimage.host/i/FCqtWHN"}
                            alt={match.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{match.matchId}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{match.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(match.time).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getFormatBadge(match.matchFormat)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs">
                            {new Date(match.time).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="w-3 h-3 text-gray-400" />
                          <span className="text-xs font-medium">₹{match.entry}</span>
                          <span className="text-gray-400">/</span>
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">₹{match.winnings}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-xs">
                            {match.players?.length || 0}/{match.maxParticipants}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(match.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(match)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManagePoints(match)}
                            className="h-8 w-8 p-0 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700"
                            title="Manage Points"
                          >
                            <Award className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCalculateProfit(match)}
                            className="h-8 w-8 p-0 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border-green-200 dark:border-green-700"
                            title="Calculate Profit"
                          >
                            <Calculator className="w-3 h-3 text-green-600 dark:text-green-400" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(match._id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Target className="w-8 h-8 text-gray-400" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No matches found</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Create your first match to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Points Management Dialog */}
      <Dialog open={isPointsDialogOpen} onOpenChange={setIsPointsDialogOpen}>
        <DialogContent className="max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Manage Player Points</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Match ID</p>
                  <p className="font-mono text-sm text-foreground">{selectedMatch.matchId}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Status</p>
                  <p>{getStatusBadge(selectedMatch.status)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Players</p>
                  <p className="text-sm text-foreground">{selectedMatch.players?.length || 0} joined</p>
                </div>
              </div>

              {pointsMessage.message && (
                <div className={`p-3 rounded-lg text-sm ${
                  pointsMessage.type === 'success' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {pointsMessage.message}
                </div>
              )}

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedMatch.players
                  .sort((a, b) => (b.points || 0) - (a.points || 0))
                  .map((player, index) => {
                    const currentPoints = pendingPointsUpdates[player.userId] !== undefined 
                      ? pendingPointsUpdates[player.userId] 
                      : (player.points || 0);
                    
                    return (
                      <div key={player.userId || index} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm flex items-center">
                              {player.username || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">{player.inGameName || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={currentPoints}
                            onChange={(e) => {
                              const newValue = parseInt(e.target.value) || 0;
                              setPendingPointsUpdates(prev => ({
                                ...prev,
                                [player.userId]: newValue
                              }));
                            }}
                            className="w-16 h-8 text-center"
                            min="0"
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setPendingPointsUpdates(prev => ({
                                  ...prev,
                                  [player.userId]: (currentPoints || 0) + 1
                                }));
                              }}
                              className="h-6 w-6 p-0"
                            >
                              +
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setPendingPointsUpdates(prev => ({
                                  ...prev,
                                  [player.userId]: Math.max(0, (currentPoints || 0) - 1)
                                }));
                              }}
                              className="h-6 w-6 p-0"
                            >
                              -
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsPointsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePoints}
                  disabled={isSavingPoints}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                >
                  {isSavingPoints ? "Saving..." : "Save Points"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Profit Calculation Dialog */}
      <Dialog open={isProfitDialogOpen} onOpenChange={setIsProfitDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Profit Calculation
            </DialogTitle>
          </DialogHeader>
          {selectedMatch && profitData && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Match</p>
                  <p className="font-medium text-sm">{selectedMatch.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Status</p>
                  <p>{getStatusBadge(selectedMatch.status)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="font-medium text-sm">Total Entries:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{profitData.totalEntries}</span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="font-medium text-sm">Entry Fees:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">₹{profitData.totalEntryFees}</span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <span className="font-medium text-sm">Winnings:</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">₹{profitData.totalWinnings}</span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <span className="font-medium text-sm">Platform Profit:</span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">₹{profitData.platformProfit}</span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                  <span className="font-medium text-sm flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Your Share (50%):
                  </span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">₹{profitData.managerShare}</span>
                </div>
              </div>

              <Button
                onClick={() => setIsProfitDialogOpen(false)}
                className="w-full bg-cyan-500 hover:bg-cyan-600"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 