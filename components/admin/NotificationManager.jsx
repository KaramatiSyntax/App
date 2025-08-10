"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Users, User, Bell, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recipientType, setRecipientType] = useState("specific");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        
        // Fetch subscription data for each user
        const usersWithSubscriptions = await Promise.all(
          data.map(async (user) => {
            try {
              const subResponse = await fetch(`/api/subscription?userEmail=${user.email}`);
              if (subResponse.ok) {
                const subscription = await subResponse.json();
                return {
                  ...user,
                  hasPushNotification: !!(subscription?.endpoint && subscription?.keys?.auth && subscription?.keys?.p256dh)
                };
              }
              return { ...user, hasPushNotification: false };
            } catch (error) {
              console.error(`Error fetching subscription for ${user.email}:`, error);
              return { ...user, hasPushNotification: false };
            }
          })
        );
        
        setUsers(usersWithSubscriptions);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelection = (userId) => {
    if (recipientType === "specific") {
      setSelectedUser(userId);
    } else {
      setSelectedUsers(prev => 
        prev.includes(userId) 
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    }
  };

  const selectAllUsers = () => {
    setSelectedUsers(users.map(user => user._id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
    setSelectedUser("");
  };

  const sendNotification = async () => {
    // Clear previous messages
    setError("");
    setSuccess("");

    if (!title.trim() || !message.trim()) {
      setError("Please fill in both title and message");
      return;
    }

    if (recipientType === "specific" && !selectedUser) {
      setError("Please select a user");
      return;
    }

    if (recipientType === "selected" && selectedUsers.length === 0) {
      setError("Please select at least one user");
      return;
    }

    if (users.length === 0) {
      setError("No users available to send notifications to");
      return;
    }

    try {
      setSending(true);
      setError("");
      setSuccess("");

      let targetUsers = [];
      
      if (recipientType === "all") {
        targetUsers = users.map(user => user.email);
      } else if (recipientType === "specific") {
        const user = users.find(u => u._id === selectedUser);
        targetUsers = user ? [user.email] : [];
      } else if (recipientType === "selected") {
        targetUsers = users
          .filter(user => selectedUsers.includes(user._id))
          .map(user => user.email);
      }

      if (targetUsers.length === 0) {
        setError("No valid recipients found");
        return;
      }

      console.log(`Sending notifications to ${targetUsers.length} users:`, targetUsers);

      // Send notifications using the admin push notifications API
      const response = await fetch("/api/admin/push-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmails: targetUsers,
          title,
          message,
          type: "custom"
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Failed to send notifications:', result.error);
        setError(`Failed to send notifications: ${result.error}`);
        return;
      }
      
      const successful = result.summary.successful;
      const failed = result.summary.failed;

      console.log(`Notification results: ${successful} successful, ${failed.length} failed`);

      if (successful > 0) {
        let successMessage = `Notification sent successfully to ${successful} user${successful > 1 ? 's' : ''}`;
        if (failed > 0) {
          successMessage += ` (${failed} failed)`;
          console.log('Failed notifications:', result.results.filter(r => !r.success));
        }
        setSuccess(successMessage);
        setTitle("");
        setMessage("");
        clearSelection();
      } else {
        setError(`Failed to send notifications to all users`);
        console.error('All notification attempts failed:', result.results);
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      setError("Failed to send notification: " + error.message);
    } finally {
      setSending(false);
    }
  };

  const getSelectedUserCount = () => {
    if (recipientType === "specific") return selectedUser ? 1 : 0;
    return selectedUsers.length;
  };

  const getTotalUserCount = () => {
    if (recipientType === "all") return users.length;
    if (recipientType === "specific") return 1;
    return users.length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bell className="text-blue-400 text-2xl" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">Notification Manager</h2>
          <p className="text-muted-foreground text-sm">Send notifications to users</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-100 border border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-700/30 dark:text-green-200 rounded-lg p-3 text-sm flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-100 border border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-700/30 dark:text-red-200 rounded-lg p-3 text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Send Notification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipient Type Selection */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Recipient Type</label>
              <Select value={recipientType} onValueChange={setRecipientType}>
                <SelectTrigger className="bg-background border-input text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users ({users.length})</SelectItem>
                  <SelectItem value="specific">Specific User</SelectItem>
                  <SelectItem value="selected">Selected Users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Specific User Selection */}
            {recipientType === "specific" && (
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Select User</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="bg-background border-input text-foreground">
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.username} ({user.email}) {user.hasPushNotification ? '🔔' : '🔕'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notification Title */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Notification Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter notification title"
                className="bg-background border-input text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Notification Message */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Message</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter notification message"
                rows={4}
                className="bg-background border-input text-foreground placeholder:text-muted-foreground resize-none"
              />
            </div>



            {/* Send Button */}
            <Button
              onClick={sendNotification}
              disabled={sending || !title.trim() || !message.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Notification
            </Button>

            {/* Recipient Count */}
            <div className="text-center text-sm text-muted-foreground">
              <Users className="w-4 h-4 inline mr-1" />
              {getSelectedUserCount()} of {getTotalUserCount()} users selected
              {recipientType === "all" && (
                <div className="mt-1 text-xs text-muted-foreground/60">
                  This will send notifications to all registered users
                </div>
              )}
            </div>

            {/* Push Notification Stats */}
            <div className="text-center text-xs text-muted-foreground/60">
              <div className="flex justify-center gap-4">
                <span className="flex items-center gap-1">
                  🔔 {users.filter(u => u.hasPushNotification).length} with push notifications
                </span>
                <span className="flex items-center gap-1">
                  🔕 {users.filter(u => !u.hasPushNotification).length} without push notifications
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Selection */}
        {recipientType === "selected" && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center justify-between">
                Select Users
                <div className="flex gap-2">
                  <Button
                    onClick={selectAllUsers}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    onClick={clearSelection}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Clear
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => handleUserSelection(user._id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedUsers.includes(user._id)
                        ? "bg-blue-500/20 border-blue-500/30 dark:bg-blue-500/20 dark:border-blue-500/30"
                        : "bg-background border-border hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground flex items-center gap-2">
                            {user.username}
                            {user.hasPushNotification ? (
                              <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                                🔔 Push
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs bg-gray-500/20 text-gray-400 border-gray-500/30">
                                🔕 No Push
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      {selectedUsers.includes(user._id) && (
                        <CheckCircle className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 