"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, Download, 
  Eye, User, Coins, Calendar, Filter, Search, Users, TrendingUp 
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

export default function PaymentManager() {
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    snoozed: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch payments
      const paymentsRes = await fetch('/api/payments?limit=100');
      const paymentsData = await paymentsRes.json();
      setPayments(paymentsData);

      // Fetch users with retry counts
      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      setUsers(usersData);

      // Calculate stats
      const statsData = {
        total: paymentsData.length,
        pending: paymentsData.filter(p => p.status === 'pending').length,
        verified: paymentsData.filter(p => p.status === 'verified').length,
        rejected: paymentsData.filter(p => p.status === 'rejected').length,
        snoozed: usersData.filter(u => u.isSnoozed).length
      };
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAction = async (paymentId, action) => {
    try {
      const response = await fetch('/api/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, action })
      });

      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  const handleUserAction = async (userId, action, data = {}) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data })
      });

      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesFilter = filter === 'all' || payment.status === filter;
    const matchesSearch = payment.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.transactionId?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusConfig = (status) => {
    switch (status) {
      case 'verified':
        return { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' };
      case 'rejected':
        return { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' };
      case 'pending':
      default:
        return { icon: Clock, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Management</h1>
          <p className="text-muted-foreground">Manage payment verifications and user accounts</p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Verified</span>
            </div>
            <div className="text-2xl font-bold">{stats.verified}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">Rejected</span>
            </div>
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">Snoozed</span>
            </div>
            <div className="text-2xl font-bold">{stats.snoozed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search payments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Verifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPayments.map((payment) => {
              const statusConfig = getStatusConfig(payment.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <motion.div
                  key={payment._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border ${statusConfig.bgColor} ${statusConfig.borderColor}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                      <div>
                        <div className="font-medium">{payment.userEmail}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(payment.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-medium">
                        ₹{payment.amount}
                      </Badge>
                      {payment.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handlePaymentAction(payment._id, 'approve')}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePaymentAction(payment._id, 'reject')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {payment.transactionId && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Transaction ID:</span> {payment.transactionId}
                    </div>
                  )}
                  
                  {payment.adminNotes && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {payment.adminNotes}
                    </div>
                  )}
                </motion.div>
              );
            })}
            
            {filteredPayments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No payments found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.filter(user => user.retryCount > 0 || user.isSnoozed).map((user) => (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg border bg-white/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-gray-500">
                        Retry Count: {user.retryCount || 0}/3
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.isSnoozed && (
                      <Badge variant="destructive">Snoozed</Badge>
                    )}
                    <Badge variant="outline">
                      ₹{user.coins || 0}
                    </Badge>
                  </div>
                </div>
                
                {user.isSnoozed && (
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Snooze Reason:</span> {user.snoozeReason}
                    {user.snoozeExpiry && (
                      <span className="ml-2">
                        (Expires: {new Date(user.snoozeExpiry).toLocaleString()})
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2">
                  {user.isSnoozed && (
                    <Button
                      size="sm"
                      onClick={() => handleUserAction(user._id, 'unsnooze')}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      Unsnooze
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUserAction(user._id, 'resetRetry')}
                  >
                    Reset Retry Count
                  </Button>
                </div>
              </motion.div>
            ))}
            
            {users.filter(user => user.retryCount > 0 || user.isSnoozed).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No users with issues found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 