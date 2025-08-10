"use client"

import { Wallet, Coins, Plus, History, IndianRupee } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUserData } from "@/lib/hooks/useUserData";

export default function WalletComponent() {
    const { userData, loading, refreshUserData } = useUserData();
    
    // Auto-refresh user data every 30 seconds to keep coins updated
    useEffect(() => {
        if (!userData?.email) return;
        
        const interval = setInterval(() => {
            refreshUserData();
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, [userData?.email]); // Removed refreshUserData from dependencies
    
    return (
        <div className="absolute top-5 right-20">
            <Link href="/wallet">
                <Button variant="outline" size="icon" className="relative">
                    <Wallet className="h-[1.2rem] w-[1.2rem]" />
                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {loading ? '...' : (userData?.coins ?? 0)}
                    </div>
                </Button>
            </Link>
        </div>
    );
}
