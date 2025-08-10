"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, XCircle, Clock, DollarSign, User, Calendar } from "lucide-react";

export default function WithdrawalsManager() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState({ open: false, withdrawal: null, action: '' });
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/withdraws');
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (withdrawalId, action) => {
    try {
      setProcessing(true);
      const updateData = {
        status: action,
        adminNotes: adminNotes || undefined
      };

      const res = await fetch(`/api/withdraws?id=${withdrawalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        // Send notification based on action
        const withdrawal = actionDialog.withdrawal;
        await fetch('/api/notifications/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: action === 'approved' ? 'withdrawalApproved' : 
                  action === 'rejected' ? 'withdrawalRejected' : 'withdrawalCompleted',
            userEmail: withdrawal.userEmail,
            amount: withdrawal.withdrawAmount,
            upiId: withdrawal.upiId,
            reason: adminNotes || (action === 'rejected' ? 'Withdrawal request rejected' : undefined),
            transactionId: withdrawal.transactionId
          }),
        });

        await fetchWithdrawals(); // Refresh the list
        setActionDialog({ open: false, withdrawal: null, action: '' });
        setAdminNotes("");
      } else {
        alert('Failed to update withdrawal status');
      }
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      alert('Error updating withdrawal status');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-500", icon: Clock, text: "Pending" },
      approved: { color: "bg-blue-500", icon: CheckCircle, text: "Approved" },
      rejected: { color: "bg-red-500", icon: XCircle, text: "Rejected" },
      completed: { color: "bg-green-500", icon: CheckCircle, text: "Completed" }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Withdrawal Requests</h2>
        <Button onClick={fetchWithdrawals} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {withdrawals.length === 0 ? (
        <Card className="bg-white/10 backdrop-blur border-white/20">
          <CardContent className="p-8 text-center text-white/70">
            No withdrawal requests found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {withdrawals.map((withdrawal) => (
            <Card key={withdrawal._id} className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="text-blue-400" />
                    <div>
                      <CardTitle className="text-white text-lg">{withdrawal.userEmail}</CardTitle>
                      <div className="text-white/60 text-sm flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {formatDate(withdrawal.createdAt)}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(withdrawal.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="text-green-400" />
                    <div>
                      <div className="text-white font-semibold">₹{withdrawal.withdrawAmount}</div>
                      <div className="text-white/60 text-sm">Amount</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="text-purple-400" />
                    <div>
                      <div className="text-white font-semibold">{withdrawal.upiId}</div>
                      <div className="text-white/60 text-sm">UPI ID</div>
                    </div>
                  </div>
                  {withdrawal.transactionId && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-blue-400" />
                      <div>
                        <div className="text-white font-semibold text-sm">{withdrawal.transactionId}</div>
                        <div className="text-white/60 text-sm">Transaction ID</div>
                      </div>
                    </div>
                  )}
                </div>

                {withdrawal.adminNotes && (
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mb-4">
                    <div className="text-yellow-300 font-semibold text-sm mb-1">Admin Notes:</div>
                    <div className="text-yellow-200 text-sm">{withdrawal.adminNotes}</div>
                  </div>
                )}

                {withdrawal.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setActionDialog({ open: true, withdrawal, action: 'approved' })}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => setActionDialog({ open: true, withdrawal, action: 'rejected' })}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, withdrawal: null, action: '' })}>
        <DialogContent className="bg-white/10 backdrop-blur-xl border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {actionDialog.action === 'approved' && 'Approve Withdrawal'}
              {actionDialog.action === 'rejected' && 'Reject Withdrawal'}
              {actionDialog.action === 'completed' && 'Complete Withdrawal'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.withdrawal && (
                <span className="space-y-2 text-sm block">
                  <span>User: {actionDialog.withdrawal.userEmail}</span><br/>
                  <span>Amount: ₹{actionDialog.withdrawal.withdrawAmount}</span><br/>
                  <span>UPI ID: {actionDialog.withdrawal.upiId}</span>
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

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setActionDialog({ open: false, withdrawal: null, action: '' })}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleAction(actionDialog.withdrawal._id, actionDialog.action)}
                disabled={processing}
                className={`flex-1 ${
                  actionDialog.action === 'approved' ? 'bg-green-600 hover:bg-green-700' :
                  actionDialog.action === 'rejected' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {processing ? <Loader2 className="animate-spin" /> : 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}