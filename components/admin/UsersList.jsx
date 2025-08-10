"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, ShieldCheck, ShieldX, Coins, Save, X, DollarSign, TrendingUp, TrendingDown, Pause, Play, Award, List } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// Blue tick SVG component for table
function BlueTick({ size = '1em', onClick }) {
  return (
    <span className="inline-block align-middle ml-1" title="Verified" onClick={onClick}>
      <svg className={`inline text-blue-500`} style={{ width: size, height: size }} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#2563eb" />
        <path d="M8.5 12.5l2.2 2.2 4.3-4.4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    role: "",
    coins: 0,
  });
  const [showOnlySnoozed, setShowOnlySnoozed] = useState(false);
  const [isManagerDialogOpen, setIsManagerDialogOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [managerMatches, setManagerMatches] = useState([]);
  const [managerProfit, setManagerProfit] = useState({ profit: 0, platform: 0, management: 0 });
  const [user, setUser] = useState(null); // Added local user state

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      console.log("Fetched users data:", data); // Debug log
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      role: user.role,
      coins: user.coins || 0,
    });
    setDialogOpen(true);
  };

  const handleCancel = () => {
    setEditingUser(null);
    setDialogOpen(false);
    setEditForm({
      role: "",
      coins: 0,
    });
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    
    setIsUpdating(true);
    try {
      // Update user in database
      const response = await fetch(`/api/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: editForm.role,
          coins: editForm.coins
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      // Refresh the users list
      await fetchUsers();
      handleCancel();
    } catch (error) {
      console.error("Error updating user:", error);
      alert(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleSnooze = async (user) => {
    try {
      const res = await fetch(`/api/users/toggle-snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          isSnoozed: !user.isSnoozed,
        }),
      });
      if (!res.ok) throw new Error('Failed to toggle snooze');
      await fetchUsers();
    } catch (err) {
      alert('Failed to toggle snooze: ' + err.message);
    }
  };

  // 1. Restore UsersList to show all users as before
  const filteredUsers = users.filter((user) =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showOnlySnoozed) {
    console.log('Filtered snoozed users:', filteredUsers.filter(u => u.isSnoozed));
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="h-4 w-4 text-green-500" />;
      case 'user':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <ShieldX className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCoinBadgeColor = (coins) => {
    if (coins >= 1000) return "bg-green-500";
    if (coins >= 500) return "bg-blue-500";
    if (coins >= 100) return "bg-yellow-500";
    return "bg-gray-500";
  };

  const getCoinStatusIcon = (coins) => {
    if (coins >= 1000) return <TrendingUp className="h-3 w-3 text-green-400" />;
    if (coins >= 500) return <TrendingUp className="h-3 w-3 text-blue-400" />;
    if (coins >= 100) return <TrendingUp className="h-3 w-3 text-yellow-400" />;
    return <TrendingDown className="h-3 w-3 text-gray-400" />;
  };

  const totalCoins = users.reduce((sum, user) => sum + (user.coins || 0), 0);
  const averageCoins = users.length > 0 ? Math.round(totalCoins / users.length) : 0;
  const usersWithCoins = users.filter(user => (user.coins || 0) > 0).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Users</h2>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="outline" className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-yellow-500" />
              Total Coins: {totalCoins.toLocaleString()}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Average: {averageCoins}
            </Badge>
            <Badge variant="outline">
              Users with Coins: {usersWithCoins}/{users.length}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant={showOnlySnoozed ? 'default' : 'outline'} onClick={() => setShowOnlySnoozed(v => !v)}>
            {showOnlySnoozed ? 'Show All' : 'Show Snoozed Only'}
          </Button>
          <div className="w-64">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-center">Coins</TableHead>
            <TableHead>Snoozed</TableHead>
            <TableHead>Snoozed (debug)</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(showOnlySnoozed ? filteredUsers.filter(u => Boolean(u.isSnoozed) === true) : filteredUsers).length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-400">
                {showOnlySnoozed ? 'No users are currently snoozed.' : 'No users found.'}
              </TableCell>
            </TableRow>
          ) : (
            (showOnlySnoozed ? filteredUsers.filter(u => Boolean(u.isSnoozed) === true) : filteredUsers).map((user) => (
              <TableRow key={user._id}>
                <TableCell className="font-medium">
                  {user.username}
                  {user.isVerified && <BlueTick size="1em" />}
                </TableCell>
                <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(user.role)}
                    <span className="capitalize">{user.role}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Badge className={`${getCoinBadgeColor(user.coins || 0)} text-white flex items-center gap-1`}>
                      {getCoinStatusIcon(user.coins || 0)}
                      <Coins className="h-3 w-3" />
                      <span className="font-semibold">{user.coins || 0}</span>
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {user.isSnoozed ? (
                    <Badge className="bg-orange-500/20 text-orange-700">Snoozed</Badge>
                  ) : (
                    <Badge className="bg-green-500/20 text-green-700">Active</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2"
                    onClick={() => handleToggleSnooze(user)}
                  >
                    {user.isSnoozed ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {user.isSnoozed ? 'Unsnooze' : 'Snooze'}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                    Edit
                  </Button>
                </TableCell>
                <TableCell>{String(user.isSnoozed)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User: {editingUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400">
                Current Balance: <strong>{editingUser?.coins || 0} coins</strong>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={editForm.role}
                onValueChange={(value) => setEditForm({ ...editForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Coins</label>
              <Input
                type="number"
                min="0"
                value={editForm.coins}
                onChange={(e) => setEditForm({ ...editForm, coins: parseInt(e.target.value) || 0 })}
                placeholder="Enter coin amount"
              />
              <div className="text-xs text-gray-500">
                Set the exact number of coins for this user
              </div>
            </div>

            {editForm.coins !== (editingUser?.coins || 0) && (
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <div className="text-sm">
                  <strong>Change:</strong> {
                    editForm.coins > (editingUser?.coins || 0) 
                      ? `+${editForm.coins - (editingUser?.coins || 0)} coins`
                      : `-${(editingUser?.coins || 0) - editForm.coins} coins`
                  }
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manager Matches & Profit Dialog */}
      <Dialog open={isManagerDialogOpen} onOpenChange={setIsManagerDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manager: {selectedManager?.username}</DialogTitle>
          </DialogHeader>
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700">
              <div className="text-sm font-bold text-green-700 dark:text-green-300">Manager Profit</div>
              <div className="text-lg font-bold text-green-900 dark:text-green-100">₹{managerProfit.profit.toFixed(2)}</div>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700">
              <div className="text-sm font-bold text-blue-700 dark:text-blue-300">Platform Charge</div>
              <div className="text-lg font-bold text-blue-900 dark:text-blue-100">₹{managerProfit.platform.toFixed(2)}</div>
            </div>
            <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700">
              <div className="text-sm font-bold text-orange-700 dark:text-orange-300">Management Cost</div>
              <div className="text-lg font-bold text-orange-900 dark:text-orange-100">₹{managerProfit.management.toFixed(2)}</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-[600px] text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead>Match ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead>Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managerMatches.map((m, idx) => {
                  const entry = Number(m.entry) || 0;
                  const joined = Array.isArray(m.players) ? m.players.length : 0;
                  const totalCollected = entry * joined;
                  const totalWinnings = Array.isArray(m.players) ? m.players.reduce((sum, p) => sum + (Number(p.points) || 0), 0) : 0;
                  const matchProfit = totalCollected - totalWinnings;
                  return (
                    <TableRow key={idx}>
                      <TableCell>{m.matchId}</TableCell>
                      <TableCell>{m.name}</TableCell>
                      <TableCell>{m.status}</TableCell>
                      <TableCell>₹{entry}</TableCell>
                      <TableCell>{joined}</TableCell>
                      <TableCell>₹{matchProfit.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 