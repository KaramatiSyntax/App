"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Filter, Calendar, User, Coins, Hash, AlertTriangle, CheckCircle, XCircle, Clock, Pause, Ban, Download } from "lucide-react";
import { format } from "date-fns";

export default function TransitionLogManager() {
  const [transitionLogs, setTransitionLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState({ open: false, log: null, action: '' });
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showOnlySnoozed, setShowOnlySnoozed] = useState(false);
  const [newCoins, setNewCoins] = useState(0);
  const [userCoins, setUserCoins] = useState(null);
  const [acceptedLogs, setAcceptedLogs] = useState([]);
  const [showDoneLogs, setShowDoneLogs] = useState(false);

  useEffect(() => {
    fetchTransitionLogs();
  }, []);

  useEffect(() => {
    if (actionDialog.open && actionDialog.action === 'reject' && actionDialog.log) {
      // Fetch the user's current coins from the backend
      const fetchUserCoins = async () => {
        try {
          const res = await fetch(`/api/users?email=${encodeURIComponent(actionDialog.log.userEmail)}`);
          if (res.ok) {
            const users = await res.json();
            const user = Array.isArray(users) ? users[0] : users;
            setUserCoins(user?.coins ?? 0);
            setNewCoins(Math.max(0, (user?.coins ?? 0) - (actionDialog.log.amount ?? 0)));
          } else {
            setUserCoins(0);
            setNewCoins(0);
          }
        } catch {
          setUserCoins(0);
          setNewCoins(0);
        }
      };
      fetchUserCoins();
    }
  }, [actionDialog]);

  const fetchTransitionLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/transition-log');
      if (res.ok) {
        const data = await res.json();
        setTransitionLogs(data.transitionLogs || []);
      }
    } catch (error) {
      console.error('Error fetching transition logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { 
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", 
        icon: Clock,
        label: "Pending"
      },
      verified: { 
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", 
        icon: CheckCircle,
        label: "Verified"
      },
      rejected: { 
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", 
        icon: XCircle,
        label: "Rejected"
      },
      duplicate: { 
        color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", 
        icon: AlertTriangle,
        label: "Duplicate"
      },
      failed: {
        color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
        icon: AlertTriangle,
        label: "Failed"
      }
    };
    
    return configs[status] || configs.pending;
  };

  const handleAction = async (action) => {
    if (!actionDialog.log) return;
    
    try {
      setProcessing(true);
      const body = {
        transitionId: actionDialog.log.transitionId,
        action,
        adminNotes,
      };
      if (action === 'reject') {
        body.coins = newCoins;
      }
      const res = await fetch('/api/transition-log/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Action result:', data);
        
        // Refresh the logs
        await fetchTransitionLogs();
        
        // Close dialogs
        setActionDialog({ open: false, log: null, action: '' });
        setAdminNotes("");
        
      } else {
        const error = await res.json();
        console.error(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error processing action:', error);
      console.error('Error processing action');
    } finally {
      setProcessing(false);
    }
  };

  const handleAccept = async (log) => {
    try {
      setProcessing(true);
      const res = await fetch('/api/transition-log/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transitionId: log.transitionId,
          action: 'admin_accepted',
        }),
      });
      if (res.ok) {
        // Update local state to reflect accepted status
        setTransitionLogs((prevLogs) =>
          prevLogs.map((l) =>
            l.transitionId === log.transitionId ? { ...l, status: 'admin_accepted' } : l
          )
        );
      } else {
        const error = await res.json();
        console.error(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error processing accept action');
    } finally {
      setProcessing(false);
    }
  };

  // Show all logs except blacklisted and done (unless viewing done logs)
  const filteredLogs = transitionLogs.filter(log =>
    !log.isBlacklisted &&
    (showDoneLogs ? log.status === 'done' : log.status !== 'done') &&
    (statusFilter === 'all' || log.status === statusFilter)
  );

  const stats = {
    total: transitionLogs.length,
    pending: transitionLogs.filter(log => log.status === "pending").length,
    verified: transitionLogs.filter(log => log.status === "verified").length,
    rejected: transitionLogs.filter(log => log.status === "rejected").length,
    snoozed: transitionLogs.filter(log => log.status === "snoozed").length,
    duplicate: transitionLogs.filter(log => log.status === "duplicate").length,
    failed: transitionLogs.filter(log => log.status === "failed").length,
    blacklisted: transitionLogs.filter(log => log.isBlacklisted).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Transition Logs Dashboard</h2>
        <div className="flex gap-2">
          <Button 
            onClick={() => window.open('/api/transition-log/download', '_blank')} 
            variant="outline" 
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Log File
          </Button>
          <Button onClick={fetchTransitionLogs} variant="outline" size="sm">
            <Loader2 className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowDoneLogs(v => !v)} variant={showDoneLogs ? 'default' : 'outline'} size="sm">
            {showDoneLogs ? 'Show Main Logs' : 'Show Done Logs'}
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-white/60 text-sm">Total</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-white/60 text-sm">Pending</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">{stats.verified}</div>
            <div className="text-white/60 text-sm">Verified</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
            <div className="text-white/60 text-sm">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
            <Input
              placeholder="Search by Transaction ID, Email, or Hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white/20 bg-clip-padding backdrop-blur-md border border-white/30 text-white rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
            style={{ WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)' }}
          >
            <option value="all" className="bg-white/30 text-blue-900 dark:text-white/90">All Status</option>
            <option value="pending" className="bg-white/30 text-yellow-700 dark:text-yellow-200">Pending</option>
            <option value="verified" className="bg-white/30 text-green-700 dark:text-green-200">Verified</option>
            <option value="rejected" className="bg-white/30 text-red-700 dark:text-red-200">Rejected</option>
          </select>
        </div>
      </div>

      {/* Transition Logs List */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-8 text-center">
              <div className="text-white/60">No transactions found for this status</div>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => {
            const statusConfig = getStatusConfig(log.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <Card key={log._id} className="bg-white/10 border-white/20 hover:bg-white/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={`${statusConfig.color} font-medium`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      <span className="text-white font-mono text-sm break-all">{String(log.transitionId || 'N/A')}</span>
                      {log.isBlacklisted && (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 font-medium">
                          <Ban className="w-3 h-3 mr-1" />
                          Blacklisted
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedLog(log);
                          setDetailDialog(true);
                        }}
                      >
                        View Details
                      </Button>
                      {(log.status === 'pending' || log.status === 'verified' || log.status === 'admin_accepted') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActionDialog({ open: true, log, action: 'reject' });
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Reject
                        </Button>
                      )}
                      {log.status !== 'done' && log.status !== 'rejected' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            setProcessing(true);
                            await fetch('/api/transition-log/action', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ transitionId: log.transitionId, action: 'done' })
                            });
                            await fetchTransitionLogs();
                            setProcessing(false);
                          }}
                          className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                        >
                          Done
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-white/60" />
                      <span className="text-white break-all">{String(log.userEmail || 'N/A')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-white/60" />
                      <span className="text-white">₹{String(log.amount || 'N/A')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-white/60" />
                      <span className="text-white">{log.createdAt ? format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-white/60" />
                    <span className="text-white/60 text-xs font-mono break-all">{log.screenshotHash ? log.screenshotHash : 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="bg-white/10 backdrop-blur-xl border-white/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Transition Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about the transition log
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60">Transaction ID</label>
                  <div className="text-white font-mono">{String(selectedLog.transitionId || 'N/A')}</div>
                </div>
                <div>
                  <label className="text-sm text-white/60">Status</label>
                  <div className="text-white">{String(selectedLog.status || 'N/A')}</div>
                </div>
                <div>
                  <label className="text-sm text-white/60">User Email</label>
                  <div className="text-white">{String(selectedLog.userEmail || 'N/A')}</div>
                </div>
                <div>
                  <label className="text-sm text-white/60">Amount</label>
                  <div className="text-white">₹{String(selectedLog.amount || 'N/A')}</div>
                </div>
                <div>
                  <label className="text-sm text-white/60">Created At</label>
                  <div className="text-white">{selectedLog.createdAt ? format(new Date(selectedLog.createdAt), 'MMM dd, yyyy HH:mm:ss') : 'N/A'}</div>
                </div>
                {selectedLog.verifiedAt && (
                  <div>
                    <label className="text-sm text-white/60">Verified At</label>
                    <div className="text-white">{format(new Date(selectedLog.verifiedAt), 'MMM dd, yyyy HH:mm:ss')}</div>
                  </div>
                )}
                <div>
                  <label className="text-sm text-white/60">Action By</label>
                  <div className="text-white">{selectedLog.actionBy ? selectedLog.actionBy : 'admin'}</div>
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60">Screenshot Hash</label>
                <div className="text-white font-mono text-xs break-all bg-white/10 p-2 rounded">
                  {String(selectedLog.screenshotHash || 'N/A')}
                </div>
              </div>

              {selectedLog.paymentId && (
                <div>
                  <label className="text-sm text-white/60">Payment ID</label>
                  <div className="text-white font-mono">
                    {String(selectedLog.paymentId || 'N/A')}
                  </div>
                </div>
              )}

              {selectedLog.adminNotes && (
                <div>
                  <label className="text-sm text-white/60">Admin Notes</label>
                  <div className="text-white bg-white/10 p-2 rounded">
                    {String(selectedLog.adminNotes || 'N/A')}
                  </div>
                </div>
              )}

              {selectedLog.isBlacklisted && (
                <div>
                  <label className="text-sm text-white/60">Blacklist Reason</label>
                  <div className="text-red-300 bg-red-500/20 p-2 rounded">
                    {String(selectedLog.blacklistReason || 'N/A')}
                  </div>
                </div>
              )}

              {selectedLog.retryCount > 0 && (
                <div>
                  <label className="text-sm text-white/60">Retry Count</label>
                  <div className="text-orange-300 bg-orange-500/20 p-2 rounded">
                    {selectedLog.retryCount}/5 attempts
                  </div>
                </div>
              )}

              {selectedLog.blacklistExpiry && (
                <div>
                  <label className="text-sm text-white/60">Blacklist Expiry</label>
                  <div className="text-yellow-300 bg-yellow-500/20 p-2 rounded">
                    {format(new Date(selectedLog.blacklistExpiry), 'MMM dd, yyyy HH:mm:ss')}
                  </div>
                </div>
              )}

              {selectedLog.isSnoozed && (
                <div>
                  <label className="text-sm text-white/60">Snooze Reason</label>
                  <div className="text-red-300 bg-red-500/20 p-2 rounded">
                    {String(selectedLog.snoozeReason || 'N/A')}
                  </div>
                </div>
              )}
              {selectedLog.snoozeExpiry && (
                <div>
                  <label className="text-sm text-white/60">Snooze Expiry</label>
                  <div className="text-yellow-300 bg-yellow-500/20 p-2 rounded">
                    {format(new Date(selectedLog.snoozeExpiry), 'MMM dd, yyyy HH:mm:ss')}
                  </div>
                </div>
              )}
              {/* Show full JSON data for the selected transaction in the details dialog */}
              <div className="mt-4 bg-black/30 rounded p-2 overflow-x-auto">
                <pre className="text-xs text-green-300 whitespace-pre-wrap break-all">{JSON.stringify(selectedLog, null, 2)}</pre>
              </div>
            </div>
          )}
          {detailDialog && selectedLog && selectedLog.status === 'verified' && (
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActionDialog({ open: true, log: selectedLog, action: 'reject' })}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, log: null, action: '' })}>
        <DialogContent className="bg-white/10 backdrop-blur-xl border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {actionDialog.action === 'accept' && 'Accept Payment'}
              {actionDialog.action === 'reject' && 'Reject Payment'}
              {actionDialog.action === 'snooze' && 'Snooze Payment'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.log && (
                <span className="space-y-2 text-sm block">
                  <span>Transaction ID: {actionDialog.log.transitionId}</span><br/>
                  <span>User: {actionDialog.log.userEmail}</span><br/>
                  <span>Amount: ₹{actionDialog.log.amount}</span><br/>
                  <span>Status: {actionDialog.log.status}</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/80 mb-2 block">Admin Notes (Optional)</label>
              <Textarea
                placeholder="Add any notes about this action..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                rows={3}
              />
            </div>

            {actionDialog.action === 'accept' && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-sm">
                <div className="text-green-300 font-semibold mb-1">✅ Accept Action:</div>
                <div className="text-green-200">
                  This will verify the payment and keep the coins in the user's wallet.
                </div>
              </div>
            )}

            {(actionDialog.action === 'reject' || actionDialog.action === 'snooze') && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-sm">
                <div className="text-red-300 font-semibold mb-1">⚠️ {actionDialog.action === 'reject' ? 'Reject' : 'Snooze'} Action:</div>
                <div className="text-red-200">
                  This will deduct ₹{actionDialog.log?.amount} coins from the user's wallet and send a notification.
                  <br/><br/>
                  <strong>Retry System:</strong>
                  <br/>• User retry count will be incremented
                  <br/>• After 5 retries, user will be blacklisted for 24 hours
                  <br/>• Duplicate screenshots count towards blacklisting
                </div>
              </div>
            )}

            {actionDialog.action === 'snooze' && (
              <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3 text-sm">
                <div className="text-orange-300 font-semibold mb-1">⏸️ Snooze Action:</div>
                <div className="text-orange-200">
                  This will snooze the user's account for 24 hours. They will not be able to add coins or redeem during this period, but can still play matches.
                </div>
              </div>
            )}

            {actionDialog.action === 'reject' && (
              <div>
                <label className="text-sm text-white/80 mb-2 block">User's Coins After Rejection</label>
                <Input
                  type="number"
                  value={newCoins}
                  disabled
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  min={0}
                />
                <div className="text-xs text-white/60 mt-1">Current Balance: {userCoins !== null ? userCoins : 'Loading...'} | Deduct: {actionDialog.log.amount ?? 0}</div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setActionDialog({ open: false, log: null, action: '' })}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleAction(actionDialog.action)}
                disabled={processing}
                className={`flex-1 ${
                  actionDialog.action === 'accept' ? 'bg-green-600 hover:bg-green-700' :
                  actionDialog.action === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-orange-600 hover:bg-orange-700'
                } text-white`}
              >
                {processing ? <Loader2 className="animate-spin" /> : `Confirm ${actionDialog.action}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 