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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Update the date formatting functions
const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 16);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

const formatDateForDisplay = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error("Error formatting date for display:", error);
    return "Invalid Date";
  }
};

export default function EventsManager({ isMatch = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    banner: "",
    status: "upcoming",
    time: "",
    entry: 0,
    winnings: 0,
    matchFormat: "Squad",
    rules: "No PC allowed, default rules apply",
    maxParticipants: 48,
    players: [],
    eventId: ""
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/${isMatch ? 'matches' : 'events'}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch ${isMatch ? 'matches' : 'events'}`);
      }
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error(`Error fetching ${isMatch ? 'matches' : 'events'}:`, error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingItem 
        ? `/api/${isMatch ? 'matches' : 'events'}?id=${editingItem._id}`
        : `/api/${isMatch ? 'matches' : 'events'}`;
      
      const itemData = isMatch ? {
        ...formData,
        entry: parseInt(formData.entry),
        winnings: parseInt(formData.winnings),
        maxParticipants: parseInt(formData.maxParticipants),
        time: formData.time // Keep as string
      } : {
        ...formData,
        entryFee: parseInt(formData.entryFee),
        totalWinnings: parseInt(formData.totalWinnings),
        startTime: formData.startTime, // Keep as string
        endTime: formData.endTime // Keep as string
      };

      const response = await fetch(url, {
        method: editingItem ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `Failed to save ${isMatch ? 'match' : 'event'}`);
      }

      fetchItems();
      setIsDialogOpen(false);
      resetForm();
      alert(`${isMatch ? 'Match' : 'Event'} ${editingItem ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error(`Error saving ${isMatch ? 'match' : 'event'}:`, error);
      alert(error.message);
    }
  };

  const handleEdit = (item) => {
    console.log("Editing item:", item); // Debug log
    setEditingItem(item);
    
    if (isMatch) {
      const formattedTime = formatDateForInput(item.time);
      console.log("Formatted match time:", formattedTime); // Debug log
      
      setFormData({
        name: item.name || "",
        banner: item.banner || "",
        status: item.status || "upcoming",
        time: formattedTime,
        entry: item.entry || 0,
        winnings: item.winnings || 0,
        matchFormat: item.matchFormat || "Squad",
        rules: item.rules || "No PC allowed, default rules apply",
        maxParticipants: item.maxParticipants || 48,
        players: item.players || [],
        eventId: item.eventId || ""
      });
    } else {
      const formattedStartTime = formatDateForInput(item.startTime);
      const formattedEndTime = formatDateForInput(item.endTime);
      console.log("Formatted event times:", { start: formattedStartTime, end: formattedEndTime }); // Debug log
      
      setFormData({
        eventName: item.eventName || "",
        banner: item.banner || "",
        status: item.status || "upcoming",
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        entryFee: item.entryFee || 0,
        totalWinnings: item.totalWinnings || 0,
        teams: item.teams || [],
        stages: item.stages || [],
        eventId: item.eventId || ""
      });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete this ${isMatch ? 'match' : 'event'}?`)) {
      try {
        const response = await fetch(`/api/${isMatch ? 'matches' : 'events'}?id=${id}`, {
          method: "DELETE",
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.error || `Failed to delete ${isMatch ? 'match' : 'event'}`);
        }

        fetchItems();
        alert(`${isMatch ? 'Match' : 'Event'} deleted successfully!`);
      } catch (error) {
        console.error(`Error deleting ${isMatch ? 'match' : 'event'}:`, error);
        alert(error.message);
      }
    }
  };

  const resetForm = () => {
    if (isMatch) {
      setFormData({
        name: "",
        banner: "",
        status: "upcoming",
        time: "",
        entry: 0,
        winnings: 0,
        matchFormat: "Squad",
        rules: "No PC allowed, default rules apply",
        maxParticipants: 48,
        players: [],
        eventId: ""
      });
    } else {
      setFormData({
        eventName: "",
        banner: "",
        status: "upcoming",
        startTime: "",
        endTime: "",
        entryFee: 0,
        totalWinnings: 0,
        teams: [],
        stages: [],
        eventId: ""
      });
    }
    setEditingItem(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{isMatch ? 'Matches' : 'Tournaments'}</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add {isMatch ? 'Match' : 'Tournament'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? `Edit ${isMatch ? 'Match' : 'Tournament'}` : `Add New ${isMatch ? 'Match' : 'Tournament'}`}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isMatch ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eventId">Event ID</Label>
                      <Input
                        id="eventId"
                        value={formData.eventId}
                        onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                        placeholder="event_001"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Match Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="banner">Banner URL</Label>
                      <Input
                        id="banner"
                        value={formData.banner}
                        onChange={(e) => setFormData({ ...formData, banner: e.target.value })}
                        placeholder="https://example.com/banner.jpg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="time">Match Time</Label>
                      <Input
                        id="time"
                        type="datetime-local"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
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
                          <SelectValue />
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
                        type="number"
                        value={formData.winnings}
                        onChange={(e) => setFormData({ ...formData, winnings: e.target.value })}
                        min="0"
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rules">Rules</Label>
                    <Textarea
                      id="rules"
                      value={formData.rules}
                      onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                      placeholder="No PC allowed, default rules apply"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eventId">Event ID</Label>
                      <Input
                        id="eventId"
                        value={formData.eventId}
                        onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                        placeholder="event_001"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventName">Event Name</Label>
                      <Input
                        id="eventName"
                        value={formData.eventName}
                        onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
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
                      placeholder="https://example.com/banner.jpg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="banner">Banner Preview</Label>
                    {formData.banner && (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden">
                        <Image
                          src={formData.banner || "https://freeimage.host/i/FCqtWHN"}
                          alt={`Banner preview for ${formData.eventName || 'event'}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="entryFee">Entry Fee (₹)</Label>
                      <Input
                        id="entryFee"
                        type="number"
                        value={formData.entryFee}
                        onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
                        min="0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalWinnings">Total Winnings (₹)</Label>
                      <Input
                        id="totalWinnings"
                        type="number"
                        value={formData.totalWinnings}
                        onChange={(e) => setFormData({ ...formData, totalWinnings: e.target.value })}
                        min="0"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full">
                {editingItem ? `Update ${isMatch ? 'Match' : 'Tournament'}` : `Create ${isMatch ? 'Match' : 'Tournament'}`}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-gray-500 mb-4">No {isMatch ? 'matches' : 'tournaments'} found</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create your first {isMatch ? 'match' : 'tournament'}
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Banner</TableHead>
              <TableHead>Name</TableHead>
              {isMatch ? (
                <>
                  <TableHead>Format</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Entry/Winnings</TableHead>
                  <TableHead>Participants</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Entry Fee</TableHead>
                  <TableHead>Total Winnings</TableHead>
                  <TableHead>Teams</TableHead>
                </>
              )}
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item._id}>
                <TableCell>
                  <div className="relative w-20 h-12 rounded overflow-hidden">
                    <Image
                      src={item.banner || "https://freeimage.host/i/FCqtWHN"}
                      alt={isMatch ? item.name : item.eventName}
                      fill
                      className="object-cover"
                    />
                  </div>
                </TableCell>
                <TableCell>{isMatch ? item.name : item.eventName}</TableCell>
                {isMatch ? (
                  <>
                    <TableCell>{item.matchFormat}</TableCell>
                    <TableCell>{formatDateForDisplay(item.time)}</TableCell>
                    <TableCell>₹{item.entry} / ₹{item.winnings}</TableCell>
                    <TableCell>{item.players?.length || 0}/{item.maxParticipants}</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{formatDateForDisplay(item.startTime)}</TableCell>
                    <TableCell>{formatDateForDisplay(item.endTime)}</TableCell>
                    <TableCell>₹{item.entryFee}</TableCell>
                    <TableCell>₹{item.totalWinnings}</TableCell>
                    <TableCell>{item.teams?.length || 0}</TableCell>
                  </>
                )}
                <TableCell>{item.status}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(item._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
} 