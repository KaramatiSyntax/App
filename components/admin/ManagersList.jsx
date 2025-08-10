import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Award, List, RefreshCw } from "lucide-react";

export default function ManagersList() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isManagerDialogOpen, setIsManagerDialogOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [managerMatches, setManagerMatches] = useState([]);
  const [managerProfit, setManagerProfit] = useState({ profit: 0, platform: 0, management: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('ManagersList: Fetching managers and hosts...');
      const response = await fetch("/api/users?role=manager,host");
      if (!response.ok) {
        throw new Error(`Failed to fetch managers and hosts: ${response.status}`);
      }
      const data = await response.json();
      console.log('ManagersList: Fetched managers and hosts:', data);
      setUsers(data);
    } catch (error) {
      console.error('ManagersList: Error fetching managers and hosts:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredManagers = users.filter(user =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleManagerDetails = async (user) => {
    setSelectedManager(user);
    setIsManagerDialogOpen(true);
    
    try {
      // Fetch matches for this manager
      const res = await fetch(`/api/matches?createdBy=${user.email}`);
      const matches = res.ok ? await res.json() : [];
      console.log('ManagersList: Fetched matches for manager:', user.email, matches);
      setManagerMatches(matches);
      
      // Calculate profit summary
      let profit = 0, platform = 0, management = 0;
      matches.forEach(m => {
        const entry = Number(m.entry) || 0;
        const joined = Array.isArray(m.players) ? m.players.length : 0;
        const totalCollected = entry * joined;
        const totalWinnings = Array.isArray(m.players) ? m.players.reduce((sum, p) => sum + (Number(p.points) || 0), 0) : 0;
        const matchProfit = totalCollected - totalWinnings;
        profit += matchProfit * 0.4; // 40% to manager
        platform += matchProfit * 0.5; // 50% to platform
        management += matchProfit * 0.1; // 10% to management
      });
      setManagerProfit({ profit, platform, management });
    } catch (error) {
      console.error('ManagersList: Error fetching manager details:', error);
      setManagerMatches([]);
      setManagerProfit({ profit: 0, platform: 0, management: 0 });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Managers</h2>
        <div className="flex items-center gap-2">
          <Button 
            onClick={fetchUsers} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="Search managers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading managers...</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredManagers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-400">
                  {searchQuery ? 'No managers found matching your search.' : 'No managers found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredManagers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <Badge variant="secondary" className="capitalize">
                        {user.role}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleManagerDetails(user)}
                    >
                      <List className="w-4 h-4 mr-1" /> 
                      Matches & Profit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* Manager Matches & Profit Dialog */}
      <Dialog open={isManagerDialogOpen} onOpenChange={setIsManagerDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Manager: {selectedManager?.username}
            </DialogTitle>
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
                {managerMatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400">
                      No matches found for this manager.
                    </TableCell>
                  </TableRow>
                ) : (
                  managerMatches.map((m, idx) => {
                    const entry = Number(m.entry) || 0;
                    const joined = Array.isArray(m.players) ? m.players.length : 0;
                    const totalCollected = entry * joined;
                    const totalWinnings = Array.isArray(m.players) ? m.players.reduce((sum, p) => sum + (Number(p.points) || 0), 0) : 0;
                    const matchProfit = totalCollected - totalWinnings;
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">{m.matchId}</TableCell>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell>
                          <Badge variant={m.status === 'completed' ? 'default' : m.status === 'running' ? 'secondary' : 'outline'}>
                            {m.status}
                          </Badge>
                        </TableCell>
                        <TableCell>₹{entry}</TableCell>
                        <TableCell>{joined}</TableCell>
                        <TableCell className={matchProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ₹{matchProfit.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}