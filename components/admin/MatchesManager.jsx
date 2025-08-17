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
import { Plus, Pencil, Trash2, Search, Filter, Calendar, IndianRupee, Users, Award, CheckCircle, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MatchesManager() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPointsDialogOpen, setIsPointsDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [editingMatch, setEditingMatch] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
    matchType: "cs"
  });
  const [formError, setFormError] = useState("");
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [playerDialogMatch, setPlayerDialogMatch] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await fetch("/api/matches");
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      const data = await response.json();
      console.log('Fetched matches:', data);
      setMatches(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching matches:", error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    // Frontend validation
    if (!formData.name.trim() || !formData.time || !formData.matchId.trim() || !formData.matchFormat || !formData.matchType || !formData.roomId.trim() || !formData.roomPassword.trim()) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (isNaN(Number(formData.entry)) || Number(formData.entry) < 0) {
      setFormError("Entry fee must be a non-negative number.");
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
        winnings: formData.winnings, // Keep as string
        maxParticipants: parseInt(formData.maxParticipants),
        minParticipants: parseInt(formData.minParticipants),
        matchFormat: formData.matchFormat.charAt(0).toUpperCase() + formData.matchFormat.slice(1).toLowerCase(),
        matchType: formData.matchType.toLowerCase(),
        roomId: formData.roomId,
        roomPassword: formData.roomPassword,
        status: formData.status,
        rules: formData.rules || "No PC allowed, default rules apply"
      };

      console.log('Submitting match data:', matchData); // Debug log
      console.log('Editing match?', !!editingMatch);
      console.log('URL:', url);

      const response = await fetch(url, {
        method: editingMatch ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(matchData),
      });

      const responseData = await response.json();
      console.log('Server response:', responseData); // Debug log

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

    // 1. Create a Date object from the database time string.
    // The browser automatically interprets this in the user's local timezone.
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

    // 4. Set the form data using the locally formatted time.
    setFormData({
      matchId: match.matchId || "",
      name: match.name,
      banner: match.banner || "",
      status: match.status,
      time: formattedLocalDateTime, // Use the new local time string
      entry: match.entry,
      winnings: match.winnings,
      roomId: match.roomId !== undefined ? match.roomId : "",
      roomPassword: match.roomPassword !== undefined ? match.roomPassword : "",
      matchFormat: match.matchFormat ? match.matchFormat.charAt(0).toUpperCase() + match.matchFormat.slice(1).toLowerCase() : "Solo",
      rules: match.rules || "No PC allowed, default rules apply",
      maxParticipants: match.maxParticipants || 48,
      minParticipants: match.minParticipants || 2,
      matchType: (match.matchType || "cs").toLowerCase(),
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
        console.log('Delete response:', responseData); // Debug log
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
    setPendingPointsUpdates({}); // Clear any pending changes
    setIsPointsDialogOpen(true);
  };

  const handlePointsChange = (playerId, points) => {
    setPendingPointsUpdates(prev => ({
      ...prev,
      [playerId]: points
    }));
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
              updatedBy: 'Admin'
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
      matchType: "cs"
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Matches Management</h2>
          <p className="text-muted-foreground mt-1">Create and manage tournament matches</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="bg-cyan-500 hover:bg-cyan-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Match
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {editingMatch ? "Edit Match" : "Add New Match"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="matchId">Match ID</Label>
                  <Input
                    id="matchId"
                    value={formData.matchId}
                    onChange={(e) => setFormData({ ...formData, matchId: e.target.value })}
                    placeholder="match_001"
                    disabled={!!editingMatch}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Tournament Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner">Banner URL</Label>
                <Input
                  id="banner"
                  value={formData.banner}
                  onChange={(e) => setFormData({ ...formData, banner: e.target.value })}
                  placeholder="https://freeimage.host/i/FCqtWHN"
                />
                {formData.banner && (
                  <div className="relative w-full h-32 mt-2 rounded-lg overflow-hidden border">
                    <Image
                      src={formData.banner || "https://freeimage.host/i/FCqtWHN"}
                      alt="Banner preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="time">Match Time</Label>
                  <Input
                    id="time"
                    type="datetime-local"
                    value={formData.time}
                    onChange={(e) => { setFormData({ ...formData, time: e.target.value }); }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="matchFormat">Match Format</Label>
                  <Select
                    value={formData.matchFormat}
                    onValueChange={(value) => setFormData({ ...formData, matchFormat: value })}
                  >
                    <SelectTrigger>
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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entry">Entry Fee (₹)</Label>
                  <Input
                    id="entry"
                    type="number"
                    value={formData.entry}
                    onChange={(e) => setFormData({ ...formData, entry: e.target.value })}
                    min="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="winnings">Winnings (₹)</Label>
                  <Input
                    id="winnings"
                    value={formData.winnings}
                    onChange={(e) => setFormData({ ...formData, winnings: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxParticipants">Max Participants</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                    min="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minParticipants">Min Participants</Label>
                  <Input
                    id="minParticipants"
                    type="number"
                    value={formData.minParticipants}
                    onChange={(e) => setFormData({ ...formData, minParticipants: e.target.value })}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roomId">Room ID</Label>
                  <Input
                    id="roomId"
                    value={formData.roomId}
                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                    placeholder="e.g. CR123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomPassword">Room Password</Label>
                  <Input
                    id="roomPassword"
                    value={formData.roomPassword}
                    onChange={(e) => setFormData({ ...formData, roomPassword: e.target.value })}
                    placeholder="e.g. turrani2024"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="matchType">Match Type</Label>
                <Select
                  value={formData.matchType}
                  onValueChange={(value) => setFormData({ ...formData, matchType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select match type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cs">cs</SelectItem>
                    <SelectItem value="lw">lw</SelectItem>
                    <SelectItem value="br">br</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rules">Rules</Label>
                <Textarea
                  id="rules"
                  value={formData.rules}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  placeholder="No PC allowed, default rules apply"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
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

              {formError && <div className="text-red-500 text-sm mb-2">{formError}</div>}
              <Button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600">
                {editingMatch ? "Update Match" : "Create Match"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Points Management Dialog */}
      <Dialog open={isPointsDialogOpen} onOpenChange={setIsPointsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Award className="w-5 h-5 text-yellow-500" />
              Manage Player Points - {selectedMatch?.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Update player points and automatically adjust their wallet coins. Points are converted 1:1 to coins. Use Save Changes to apply all updates at once.
            </p>
          </DialogHeader>

          {/* Points Message */}
          {pointsMessage.type && (
            <div className={`p-3 rounded-lg border ${pointsMessage.type === 'success'
                ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-700/30 dark:text-green-200'
                : 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-700/30 dark:text-red-200'
              }`}>
              <div className="flex items-center gap-2">
                {pointsMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">{pointsMessage.message}</span>
              </div>
            </div>
          )}

          {selectedMatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Match ID</p>
                  <p className="font-mono text-sm text-foreground">{selectedMatch.matchId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p>{getStatusBadge(selectedMatch.status)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Players</p>
                  <p className="text-sm text-foreground">{selectedMatch.players?.length || 0} joined</p>
                </div>
              </div>

              {selectedMatch.players && selectedMatch.players.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Player Points</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-sm">
                        {selectedMatch.players.length} Players
                      </Badge>
                      {Object.keys(pendingPointsUpdates).length > 0 && (
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs">
                          {Object.keys(pendingPointsUpdates).length} Pending
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-foreground">Player</TableHead>
                          <TableHead className="text-foreground">In-Game Name</TableHead>
                          <TableHead className="text-foreground">Points</TableHead>
                          <TableHead className="text-foreground">Actions</TableHead>
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
                              <TableRow key={player.userId || player._id || index} className="hover:bg-accent/50">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                      <span className="text-xs font-medium text-white">
                                        {player.name?.charAt(0)?.toUpperCase() || "U"}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm text-foreground">{player.name || player.username || "Unknown"}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {player.email || "No email"}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <p className="text-sm text-primary font-medium">
                                    {player.inGameName || "N/A"}
                                  </p>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      value={currentPoints}
                                      onChange={(e) => {
                                        const newPoints = parseInt(e.target.value) || 0;
                                        handlePointsChange(player.userId, newPoints);
                                      }}
                                      className="w-20 h-8 text-sm"
                                      min="0"
                                    />
                                    <span className="text-sm text-muted-foreground">pts</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePointsChange(player.userId, currentPoints + 10)}
                                      className="h-6 px-2 text-xs bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300"
                                    >
                                      +10
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePointsChange(player.userId, Math.max(0, currentPoints - 10))}
                                      className="h-6 px-2 text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300"
                                    >
                                      -10
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4 border-t border-border">
                    <Button
                      onClick={handleSavePoints}
                      disabled={isSavingPoints || Object.keys(pendingPointsUpdates).length === 0}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No players joined yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Players will appear here once they join the match
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Player View Dialog */}
      <Dialog open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-xl border-white/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Players List</DialogTitle>
            <div className="text-white/60 text-sm mb-2">
              Match: <span className="font-mono">{playerDialogMatch?.name}</span> | Match ID: <span className="font-mono">{playerDialogMatch?.matchId}</span>
            </div>
          </DialogHeader>
          <div className="overflow-x-auto">
            <Table className="min-w-[600px] text-xs">
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
                  <TableRow key={p.userId || p._id || idx}>
                    <TableCell>{p.inGameName || ''}</TableCell>
                    <TableCell>{p.username || ''}</TableCell>
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matches Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Matches ({filteredMatches.length})
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
                    <TableRow key={match._id || match.matchId || match.name} className="hover:bg-gray-50 dark:hover:bg-gray-800">
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
                            onClick={() => { setPlayerDialogMatch(match); setIsPlayerDialogOpen(true); }}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                            title="View Players"
                          >
                            <Users className="w-4 h-4" />
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
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No matches found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          {searchQuery || statusFilter !== "all"
                            ? "Try adjusting your filters"
                            : "Create your first match to get started"
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