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
import { Plus, Pencil, Trash2, Search, Filter, Calendar, IndianRupee, Users, Award, CheckCircle, AlertCircle, Calculator, Crown, Target, Eye, UserCheck } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminRoomManager() {
  const [allMatches, setAllMatches] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profitSummary, setProfitSummary] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPointsDialogOpen, setIsPointsDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [editingMatch, setEditingMatch] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");
  const [pointsMessage, setPointsMessage] = useState({ type: '', message: '' });
  const [pendingPointsUpdates, setPendingPointsUpdates] = useState({});
  const [isSavingPoints, setIsSavingPoints] = useState(false);
  const [formData, setFormData] = useState({
    matchId: "",
    name: "",
    banner: "",
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
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch all matches
      const matchesResponse = await fetch("/api/matches");
      if (!matchesResponse.ok) {
        throw new Error('Failed to fetch matches');
      }
      const matchesData = await matchesResponse.json();
      setAllMatches(matchesData);

      // Fetch all managers
      const managersResponse = await fetch("/api/users?role=manager");
      if (!managersResponse.ok) {
        throw new Error('Failed to fetch managers');
      }
      const managersData = await managersResponse.json();
      setManagers(managersData);

      calculateOverallProfitSummary(matchesData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const calculateOverallProfitSummary = (matchesData) => {
    const completedMatches = matchesData.filter(match => match.status === 'completed');
    let totalEarnings = 0;
    let totalMatches = completedMatches.length;
    let totalEntryFees = 0;
    let totalWinnings = 0;
    let totalPlayers = 0;
    let managerProfits = {};

    completedMatches.forEach(match => {
      const entries = match.players?.length || 0;
      const entryFees = entries * match.entry;
      const winnings = match.winnings;
      const profit = entryFees - winnings;
      const managerShare = profit * 0.5; // 50% to manager
      
      totalEarnings += managerShare;
      totalEntryFees += entryFees;
      totalWinnings += winnings;
      totalPlayers += entries;

      // Track per-manager profits
      const managerEmail = match.createdBy;
      if (!managerProfits[managerEmail]) {
        managerProfits[managerEmail] = {
          totalEarnings: 0,
          totalMatches: 0,
          totalEntryFees: 0,
          totalWinnings: 0
        };
      }
      managerProfits[managerEmail].totalEarnings += managerShare;
      managerProfits[managerEmail].totalMatches += 1;
      managerProfits[managerEmail].totalEntryFees += entryFees;
      managerProfits[managerEmail].totalWinnings += winnings;
    });

    setProfitSummary({
      totalEarnings,
      totalMatches,
      totalEntryFees,
      totalWinnings,
      totalPlayers,
      averageProfit: totalMatches > 0 ? totalEarnings / totalMatches : 0,
      averagePlayers: totalMatches > 0 ? totalPlayers / totalMatches : 0,
      managerProfits
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
      
      const matchData = {
        ...formData,
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
        createdBy: formData.createdBy
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
        fetchAllData();
        setIsDialogOpen(false);
        resetForm();
      } else {
        setFormError(responseData.error || "Failed to create match");
      }
    } catch (error) {
      console.error("Error creating match:", error);
      setFormError("An error occurred while creating the match");
    }
  };

  const handleEdit = (match) => {
    setEditingMatch(match);
    setFormData({
      matchId: match.matchId || "",
      name: match.name || "",
      banner: match.banner || "",
      status: match.status || "upcoming",
      time: match.time ? new Date(match.time).toISOString().slice(0, 16) : "",
      entry: match.entry || 0,
      winnings: match.winnings || 0,
      roomId: match.roomId || "",
      roomPassword: match.roomPassword || "",
      matchFormat: match.matchFormat || "Solo",
      rules: match.rules || "No PC allowed, default rules apply",
      maxParticipants: match.maxParticipants || 48,
      minParticipants: match.minParticipants || 2,
      matchType: match.matchType || "cs",
      createdBy: match.createdBy || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this match?")) return;
    
    try {
      const response = await fetch(`/api/matches?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchAllData();
      } else {
        console.error("Failed to delete match");
      }
    } catch (error) {
      console.error("Error deleting match:", error);
    }
  };

  const handleManagePoints = (match) => {
    setSelectedMatch(match);
    setPendingPointsUpdates({});
    setIsPointsDialogOpen(true);
  };

  const handlePointsChange = (playerId, points) => {
    setPendingPointsUpdates(prev => ({
      ...prev,
      [playerId]: points
    }));
  };

  const handleSavePoints = async () => {
    if (!selectedMatch) return;
    
    setIsSavingPoints(true);
    setPointsMessage({ type: '', message: '' });
    
    try {
      const response = await fetch(`/api/matches/${selectedMatch._id}/points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points: pendingPointsUpdates
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPointsMessage({ type: 'success', message: 'Points updated successfully!' });
        fetchAllData();
        setTimeout(() => {
          setIsPointsDialogOpen(false);
          setPointsMessage({ type: '', message: '' });
        }, 2000);
      } else {
        setPointsMessage({ type: 'error', message: data.error || 'Failed to update points' });
      }
    } catch (error) {
      console.error('Error updating points:', error);
      setPointsMessage({ type: 'error', message: 'An error occurred while updating points' });
    } finally {
      setIsSavingPoints(false);
    }
  };

  const resetForm = () => {
    setFormData({
      matchId: "",
      name: "",
      banner: "",
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
    setFormError("");
    setEditingMatch(null);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      upcoming: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: "⏰" },
      running: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: "▶️" },
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

  const getManagerName = (managerEmail) => {
    const manager = managers.find(m => m.email === managerEmail);
    return manager ? manager.username || manager.firstName || managerEmail : managerEmail;
  };

  const filteredMatches = allMatches.filter(match => {
    const matchesSearch = match.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         match.matchId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || match.status === statusFilter;
    const matchesManager = managerFilter === "all" || match.createdBy === managerFilter;
    return matchesSearch && matchesStatus && matchesManager;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      <span className="ml-2 text-cyan-600 dark:text-cyan-200">Loading all manager matches...</span>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Overall Profit Summary */}
      {profitSummary && (
        <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400 text-lg">
              <Calculator className="w-4 h-4" />
              Overall Profit Summary (All Managers)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-2 bg-green-500/20 rounded-lg">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  ₹{profitSummary.totalEarnings.toFixed(0)}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">Total Earnings</div>
              </div>
              <div className="text-center p-2 bg-blue-500/20 rounded-lg">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {profitSummary.totalMatches}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Completed</div>
              </div>
              <div className="text-center p-2 bg-purple-500/20 rounded-lg">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  ₹{profitSummary.averageProfit.toFixed(0)}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">Avg/Match</div>
              </div>
              <div className="text-center p-2 bg-orange-500/20 rounded-lg">
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  ₹{profitSummary.totalEntryFees.toFixed(0)}
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-400">Entry Fees</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-3xl font-bold text-foreground">All Manager Matches</h2>
            <p className="text-muted-foreground mt-1 text-sm">View and manage all matches created by all managers</p>
          </div>
          <Button 
            onClick={fetchAllData} 
            disabled={loading}
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Refresh
          </Button>
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

              <div className="space-y-1">
                <Label htmlFor="banner" className="text-sm">Banner URL</Label>
                <Input
                  id="banner"
                  value={formData.banner}
                  onChange={(e) => setFormData({ ...formData, banner: e.target.value })}
                  placeholder="https://freeimage.host/i/FCqtWHN"
                  className="h-10"
                />
                {formData.banner && (
                  <div className="relative w-full h-24 mt-2 rounded-lg overflow-hidden border">
                    <Image
                      src={formData.banner || "https://freeimage.host/i/FCqtWHN"}
                      alt="Banner preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
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
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="roomPassword" className="text-sm">Room Password</Label>
                  <Input
                    id="roomPassword"
                    value={formData.roomPassword}
                    onChange={(e) => setFormData({ ...formData, roomPassword: e.target.value })}
                    required
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="maxParticipants" className="text-sm">Max Participants</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                    min="1"
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="minParticipants" className="text-sm">Min Participants</Label>
                  <Input
                    id="minParticipants"
                    type="number"
                    value={formData.minParticipants}
                    onChange={(e) => setFormData({ ...formData, minParticipants: e.target.value })}
                    min="1"
                    required
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="matchType" className="text-sm">Game Type</Label>
                  <Select
                    value={formData.matchType}
                    onValueChange={(value) => setFormData({ ...formData, matchType: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select game type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cs">CS</SelectItem>
                      <SelectItem value="bgmi">BGMI</SelectItem>
                      <SelectItem value="ff">Free Fire</SelectItem>
                    </SelectContent>
                  </Select>
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
              </div>

              <div className="space-y-1">
                <Label htmlFor="rules" className="text-sm">Rules</Label>
                <Textarea
                  id="rules"
                  value={formData.rules}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  placeholder="Enter match rules..."
                  className="min-h-[80px]"
                />
              </div>

              {formError && (
                <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  {formError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 bg-cyan-500 hover:bg-cyan-600">
                  {editingMatch ? "Update Match" : "Create Match"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Points Management Dialog */}
      <Dialog open={isPointsDialogOpen} onOpenChange={setIsPointsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Manage Points - {selectedMatch?.name}
            </DialogTitle>
          </DialogHeader>
          
          {pointsMessage.message && (
            <div className={`p-3 rounded-lg ${
              pointsMessage.type === 'success' 
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' 
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
            }`}>
              {pointsMessage.message}
            </div>
          )}

          {selectedMatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                <div>Player</div>
                <div>Current Points</div>
                <div>New Points</div>
              </div>
              
              {selectedMatch.players && selectedMatch.players.length > 0 ? (
                selectedMatch.players.map((player) => (
                  <div key={player._id} className="grid grid-cols-3 gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                        {player.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="font-medium">{player.username || player.email}</div>
                        <div className="text-xs text-gray-500">{player.email}</div>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="font-medium">{player.points || 0}</span>
                    </div>
                    <div>
                      <Input
                        type="number"
                        value={pendingPointsUpdates[player._id] !== undefined ? pendingPointsUpdates[player._id] : (player.points || 0)}
                        onChange={(e) => handlePointsChange(player._id, parseInt(e.target.value) || 0)}
                        className="h-8 text-sm"
                        min="0"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No players joined yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Players will appear here once they join the match
                  </p>
                </div>
              )}
            </div>
          )}
          
          {selectedMatch?.players?.length > 0 && (
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleSavePoints} 
                disabled={isSavingPoints}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600"
              >
                {isSavingPoints ? 'Saving...' : 'Save Points'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsPointsDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search matches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={managerFilter} onValueChange={setManagerFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Managers</SelectItem>
                  {managers.map((manager) => (
                    <SelectItem key={manager.email} value={manager.email}>
                      {manager.username || manager.firstName || manager.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Table Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            All Manager Matches ({filteredMatches.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Banner</TableHead>
                  <TableHead>Match ID</TableHead>
                  <TableHead>Tournament</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Entry/Winnings</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatches.length > 0 ? (
                  filteredMatches.map((match) => (
                    <TableRow key={match._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>
                        <div className="relative w-20 h-12 rounded-lg overflow-hidden border">
                          <Image
                            src={match.banner || "https://freeimage.host/i/FCqtWHN"}
                            alt={match.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{match.matchId}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{match.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(match.time).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-blue-500" />
                          <div>
                            <div className="font-medium">{getManagerName(match.createdBy)}</div>
                            <div className="text-xs text-gray-500">{match.createdBy}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getFormatBadge(match.matchFormat)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {new Date(match.time).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">₹{match.entry}</span>
                          <span className="text-gray-400">/</span>
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">₹{match.winnings}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-sm">
                            {match.players?.length || 0}/{match.maxParticipants}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(match.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(match)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManagePoints(match)}
                            className="h-8 w-8 p-0 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700"
                            title="Manage Points"
                          >
                            <Award className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(match._id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No matches found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          {searchQuery || statusFilter !== "all" || managerFilter !== "all"
                            ? "Try adjusting your filters" 
                            : "No matches have been created yet"
                          }
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 