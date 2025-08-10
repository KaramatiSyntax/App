"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, XCircle, Clock, DollarSign, User, Calendar, Coins } from "lucide-react";

export default function PaymentVerifier() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState({ open: false, payment: null, action: '' });
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payments');
      if (res.ok) {
        const data = await res.json();
        // Filter for pending payments that need verification
        const pendingPayments = data.filter(payment => payment.status === 'pending');
        setPayments(pendingPayments);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (paymentId, action) => {
    try {
      setProcessing(true);
      const updateData = {
        status: action,
        adminNotes: adminNotes || undefined
      };

      // Update payment status
      const paymentRes = await fetch(`/api/payments?id=${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (paymentRes.ok && action === 'verified') {
        // If payment is verified, add coins to user account
        const payment = actionDialog.payment;
        // Change user fetch to use email instead of clerkId
        const userRes = await fetch(`/api/users?email=${encodeURIComponent(payment.userEmail)}`);

        if (userRes.ok) {
          const users = await userRes.json();
          if (users.length > 0) {
            const user = users[0];
            const newCoins = (user.coins || 0) + payment.amount;
            
            const updateUserRes = await fetch(`/api/users?id=${user._id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ coins: newCoins }),
            });

            if (!updateUserRes.ok) {
              console.error('Failed to update user coins');
            }
          }
        }

        // Send notification for payment verification
        await fetch('/api/notifications/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'paymentVerified',
            userEmail: payment.userEmail,
            amount: payment.amount,
            transactionId: payment.transactionId
          }),
        });
      } else if (paymentRes.ok && action === 'rejected') {
        // Send notification for payment rejection
        const payment = actionDialog.payment;
        await fetch('/api/notifications/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'paymentRejected',
            userEmail: payment.userEmail,
            amount: payment.amount,
            reason: adminNotes || 'Payment verification failed'
          }),
        });
      }

      await fetchPayments(); // Refresh the list
      setActionDialog({ open: false, payment: null, action: '' });
      setAdminNotes("");
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Error updating payment status');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-500", icon: Clock, text: "Pending Verification" },
      verified: { color: "bg-green-500", icon: CheckCircle, text: "Verified" },
      rejected: { color: "bg-red-500", icon: XCircle, text: "Rejected" }
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
        <h2 className="text-2xl font-bold text-white">Payment Verification</h2>
        <Button onClick={fetchPayments} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {payments.length === 0 ? (
        <Card className="bg-white/10 backdrop-blur border-white/20">
          <CardContent className="p-8 text-center text-white/70">
            No pending payments to verify
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <Card key={payment._id} className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="text-blue-400" />
                    <div>
                      <CardTitle className="text-white text-lg">{payment.userEmail}</CardTitle>
                      <div className="text-white/60 text-sm flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {formatDate(payment.createdAt)}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(payment.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="text-green-400" />
                    <div>
                      <div className="text-white font-semibold">₹{payment.amount}</div>
                      <div className="text-white/60 text-sm">Payment Amount</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className="text-yellow-400" />
                    <div>
                      <div className="text-white font-semibold">{payment.amount} Coins</div>
                      <div className="text-white/60 text-sm">Coins to Add</div>
                    </div>
                  </div>
                </div>

                {payment.transactionId && (
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 mb-4">
                    <div className="text-blue-300 font-semibold text-sm mb-1">Transaction Details:</div>
                    <div className="text-blue-200 text-sm">ID: {payment.transactionId}</div>
                  </div>
                )}

                {payment.adminNotes && (
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mb-4">
                    <div className="text-yellow-300 font-semibold text-sm mb-1">Admin Notes:</div>
                    <div className="text-yellow-200 text-sm">{payment.adminNotes}</div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => setActionDialog({ open: true, payment, action: 'verified' })}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Verify & Add Coins
                  </Button>
                  <Button
                    onClick={() => setActionDialog({ open: true, payment, action: 'rejected' })}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, payment: null, action: '' })}>
        <DialogContent className="bg-white/10 backdrop-blur-xl border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {actionDialog.action === 'verified' && 'Verify Payment & Add Coins'}
              {actionDialog.action === 'rejected' && 'Reject Payment'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.payment && (
                <div className="space-y-2 text-sm">
                  <div>User: {actionDialog.payment.userEmail}</div>
                  <div>Amount: ₹{actionDialog.payment.amount}</div>
                  <div>Coins to Add: {actionDialog.payment.amount}</div>
                  {actionDialog.payment.transactionId && (
                    <div>Transaction ID: {actionDialog.payment.transactionId}</div>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/80 mb-2 block">Admin Notes (Optional)</label>
              <Textarea
                placeholder="Add any notes about this verification..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                rows={3}
              />
            </div>

            {actionDialog.action === 'verified' && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-sm">
                <div className="text-green-300 font-semibold mb-1">⚠️ Action Required:</div>
                <div className="text-green-200">
                  This will add {actionDialog.payment?.amount} coins to the user's account. 
                  Make sure the payment screenshot is valid before proceeding.
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setActionDialog({ open: false, payment: null, action: '' })}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleAction(actionDialog.payment._id, actionDialog.action)}
                disabled={processing}
                className={`flex-1 ${
                  actionDialog.action === 'verified' ? 'bg-green-600 hover:bg-green-700' :
                  'bg-red-600 hover:bg-red-700'
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