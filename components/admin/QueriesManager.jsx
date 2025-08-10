"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  Mail, 
  User, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function QueriesManager() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [selectedQueries, setSelectedQueries] = useState([]);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const response = await fetch("/api/queries");
      if (!response.ok) {
        throw new Error('Failed to fetch queries');
      }
      const data = await response.json();
      setQueries(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching queries:", error);
      setLoading(false);
    }
  };

  const handleStatusChange = async (queryId, newStatus) => {
    try {
      const response = await fetch(`/api/queries?id=${queryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          status: newStatus,
          readAt: newStatus === 'read' ? new Date() : undefined,
          repliedAt: newStatus === 'replied' ? new Date() : undefined
        }),
      });

      if (response.ok) {
        fetchQueries();
      } else {
        throw new Error('Failed to update query status');
      }
    } catch (error) {
      console.error("Error updating query status:", error);
    }
  };

  const markAsRead = async (queryId) => {
    try {
      await handleStatusChange(queryId, 'read');
      setSuccess("Query marked as read successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to mark query as read");
      setTimeout(() => setError(""), 3000);
    }
  };



  const handleQuerySelection = (queryId) => {
    setSelectedQueries(prev => 
      prev.includes(queryId) 
        ? prev.filter(id => id !== queryId)
        : [...prev, queryId]
    );
  };

  const markSelectedAsRead = async () => {
    try {
      const promises = selectedQueries.map(queryId => handleStatusChange(queryId, 'read'));
      await Promise.all(promises);
      setSelectedQueries([]);
      setSuccess(`${selectedQueries.length} queries marked as read successfully`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to mark queries as read");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this query?")) {
      try {
        const response = await fetch(`/api/queries?id=${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchQueries();
        } else {
          throw new Error('Failed to delete query');
        }
      } catch (error) {
        console.error("Error deleting query:", error);
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      unread: { 
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", 
        icon: AlertCircle,
        label: "Unread"
      },
      read: { 
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", 
        icon: Eye,
        label: "Read"
      },

    };
    
    const config = statusConfig[status] || statusConfig.unread;
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.color} font-medium`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const filteredQueries = queries.filter(query => {
    const matchesSearch = query.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         query.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         query.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || query.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: queries.length,
    unread: queries.filter(q => q.status === "unread").length,
    read: queries.filter(q => q.status === "read").length
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      <span className="ml-2 text-cyan-600 dark:text-cyan-200">Loading queries...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Queries Management</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage customer inquiries and support requests</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-green-700 dark:text-green-300 text-sm flex items-center gap-2"
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
            className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Queries</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unread</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.unread}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Read</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.read}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search queries..."
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
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queries Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Queries ({filteredQueries.length})
            </CardTitle>
            {selectedQueries.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedQueries.length} selected
                </span>
                <Button
                  onClick={markSelectedAsRead}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Read
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedQueries.length === filteredQueries.length && filteredQueries.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQueries(filteredQueries.map(q => q._id));
                        } else {
                          setSelectedQueries([]);
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQueries.length > 0 ? (
                  filteredQueries.map((query) => (
                                    <TableRow key={query._id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  query.status === 'unread' ? 'bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500' : ''
                }`}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedQueries.includes(query._id)}
                      onChange={() => handleQuerySelection(query._id)}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{query.name}</span>
                    </div>
                  </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{query.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate flex items-center gap-2" title={query.subject}>
                          {query.status === 'unread' && (
                            <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                          )}
                          <span className={query.status === 'unread' ? 'font-semibold' : ''}>
                            {query.subject}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(query.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {new Date(query.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedQuery(query);
                              setIsDialogOpen(true);
                              if (query.status === 'unread') {
                                markAsRead(query._id);
                              }
                            }}
                            className="h-8 w-8 p-0"
                            title="View Query"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {query.status === 'unread' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsRead(query._id)}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Mark as Read"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(query._id)}
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
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <MessageSquare className="w-12 h-12 text-gray-400" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No queries found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          {searchQuery || statusFilter !== "all" 
                            ? "Try adjusting your filters" 
                            : "No customer queries yet"
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

      {/* Query Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Query Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedQuery && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                  <div className="text-gray-900 dark:text-white font-medium">{selectedQuery.name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                  <div className="text-gray-900 dark:text-white font-medium">{selectedQuery.email}</div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Subject</label>
                <div className="text-gray-900 dark:text-white font-medium">{selectedQuery.subject}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Message</label>
                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-900 dark:text-white">{selectedQuery.message}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedQuery.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date</label>
                  <div className="text-gray-900 dark:text-white">
                    {new Date(selectedQuery.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>



              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 