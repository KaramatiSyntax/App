"use client";

import { useRouter } from "next/navigation";
import UsersList from "@/components/admin/UsersList";
import EventsManager from "@/components/admin/EventsManager";
import MatchesManager from "@/components/admin/MatchesManager";
import WithdrawalsManager from "@/components/admin/WithdrawalsManager";
import NotificationManager from "@/components/admin/NotificationManager";
import QueriesManager from "@/components/admin/QueriesManager";
import TransitionLogManager from "@/components/admin/TransitionLogManager";
import ManagersList from "@/components/admin/ManagersList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeToggle } from "@/components/ModeToggle";
import { useUserData } from "@/lib/hooks/useUserData";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const { userData, loading: userDataLoading } = useUserData();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Only redirect non-admin users, admin users should have immediate access
  useEffect(() => {
    if (!userDataLoading && userData && userData.role !== "admin") {
      setShouldRedirect(true);
    }
  }, [userDataLoading, userData?.role]);

  // Handle redirect only for non-admin users
  useEffect(() => {
    if (shouldRedirect) {
      router.push("/");
    }
  }, [shouldRedirect, router]);

  // Show loading only if we're still checking permissions
  if (userDataLoading || shouldRedirect) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show message if user is not logged in
  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-700 dark:text-white mb-4">Access Denied</h1>
          <p className="text-blue-600 dark:text-cyan-200">Please log in to access the admin panel.</p>
        </div>
      </div>
    );
  }

  // Show message if user is not an admin
  if (userData && userData.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-700 dark:text-white mb-4">Access Denied</h1>
          <p className="text-blue-600 dark:text-cyan-200">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <ModeToggle />
        </div>
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-4 bg-white/10 border border-white/20">
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-white/20">Users</TabsTrigger>
            <TabsTrigger value="employes" className="text-white data-[state=active]:bg-white/20">Managers</TabsTrigger>
            <TabsTrigger value="events" className="text-white data-[state=active]:bg-white/20">Events</TabsTrigger>
            <TabsTrigger value="matches" className="text-white data-[state=active]:bg-white/20">Matches</TabsTrigger>
            <TabsTrigger value="withdrawals" className="text-white data-[state=active]:bg-white/20">Withdrawals</TabsTrigger>
            <TabsTrigger value="notifications" className="text-white data-[state=active]:bg-white/20">Notifications</TabsTrigger>
            <TabsTrigger value="queries" className="text-white data-[state=active]:bg-white/20">Queries</TabsTrigger>
            <TabsTrigger value="transitions" className="text-white data-[state=active]:bg-white/20">Transition Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <UsersList />
          </TabsContent>
          <TabsContent value="employes">
            <ManagersList />
          </TabsContent>
          <TabsContent value="events">
            <EventsManager />
          </TabsContent>
          <TabsContent value="matches">
            <MatchesManager />
          </TabsContent>
          <TabsContent value="withdrawals">
            <WithdrawalsManager />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationManager />
          </TabsContent>
          <TabsContent value="queries">
            <QueriesManager />
          </TabsContent>
          <TabsContent value="transitions">
            <TransitionLogManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 