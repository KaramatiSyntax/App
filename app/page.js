// 'use client';

// import { useState, useEffect, useMemo } from 'react';
// import Image from "next/image";
// import MatchCard from "@/components/MatchCard/MatchCard";
// import MatchCardSkeleton from "@/components/MatchCard/MatchCardSkeleton";
// import { motion } from 'framer-motion';
// import ExpoSlider from "@/components/swipper";
// import { Separator } from "@/components/ui/separator";
// import { Button } from "@/components/ui/button";
// import { useRouter } from 'next/navigation';
// import { ChevronRight } from "lucide-react";
// import { Badge } from "@/components/ui/badge";

// export default function Home() {
//     const [matches, setMatches] = useState([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const router = useRouter();

//     const isMatchFull = (match) => (match.players?.length || 0) >= (match.maxParticipants || 0);

//     useEffect(() => {
//         async function fetchMatches() {
//             setIsLoading(true);
//             setError(null);
//             try {
//                 const res = await fetch('/api/matches');
//                 if (!res.ok) throw new Error('Failed to fetch matches');
//                 const data = await res.json();
//                 setMatches(data);
//             } catch (err) {
//                 setError(err.message || 'Unknown error');
//             } finally {
//                 setIsLoading(false);
//             }
//         }
//         fetchMatches();
//     }, []);

//     const categorizedMatches = useMemo(() => {
//         const upcoming = matches.filter(m => m.status === 'upcoming').sort((a, b) => new Date(a.time) - new Date(b.time));
//         const completed = matches.filter(m => m.status === 'completed').sort((a, b) => new Date(b.time) - new Date(a.time));
//         const running = matches.filter(m => m.status === 'running');
//         const battleRoyale = upcoming.filter(m => m.matchType === "br");
//         const clashSquad = upcoming.filter(m => m.matchType === "cs");
//         const loneWolf = upcoming.filter(m => m.matchType === "lw");
//         const latest = running.length > 0 ? running : upcoming.filter(m => !isMatchFull(m)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//         return {
//             upcoming,
//             completed,
//             running,
//             battleRoyale,
//             clashSquad,
//             loneWolf,
//             latest,
//         };
//     }, [matches]);

//     if (error) {
//         return (
//             <div className="flex justify-center items-center min-h-screen text-red-500">
//                 Error: {error}
//             </div>'use client';

// This file has been converted to display a sunset notification.
// All previous application code has been commented out below.

// import { useState, useEffect, useMemo } from 'react';
// import Image from "next/image";
// import MatchCard from "@/components/MatchCard/MatchCard";
// import MatchCardSkeleton from "@/components/MatchCard/MatchCardSkeleton";
// import { motion } from 'framer-motion';
// import ExpoSlider from "@/components/swipper";
// import { Separator } from "@/components/ui/separator";
// import { Button } from "@/components/ui/button";
// import { useRouter } from 'next/navigation';
// import { ChevronRight } from "lucide-react";
// import { Badge } from "@/components/ui/badge";

/*
export default function Home() {
    const [matches, setMatches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    const isMatchFull = (match) => (match.players?.length || 0) >= (match.maxParticipants || 0);

    useEffect(() => {
        async function fetchMatches() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch('/api/matches');
                if (!res.ok) throw new Error('Failed to fetch matches');
                const data = await res.json();
                setMatches(data);
            } catch (err) {
                setError(err.message || 'Unknown error');
            } finally {
                setIsLoading(false);
            }
        }
        fetchMatches();
    }, []);

    const categorizedMatches = useMemo(() => {
        const upcoming = matches.filter(m => m.status === 'upcoming').sort((a, b) => new Date(a.time) - new Date(b.time));
        const completed = matches.filter(m => m.status === 'completed').sort((a, b) => new Date(b.time) - new Date(a.time));
        const running = matches.filter(m => m.status === 'running');
        const battleRoyale = upcoming.filter(m => m.matchType === "br");
        const clashSquad = upcoming.filter(m => m.matchType === "cs");
        const loneWolf = upcoming.filter(m => m.matchType === "lw");
        const latest = running.length > 0 ? running : upcoming.filter(m => !isMatchFull(m)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return {
            upcoming,
            completed,
            running,
            battleRoyale,
            clashSquad,
            loneWolf,
            latest,
        };
    }, [matches]);

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen text-red-500">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 min-h-screen">
            <div className="flex items-center justify-center mb-8">
                <ExpoSlider />
            </div>

            <Separator className="mb-8 h-2 bg-white/30" />

            // Announcement Section
            <div className="mb-8 w-full flex justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-600 blur-md opacity-40 rounded-xl z-0" />
                <div className="relative text-white px-6 py-4 rounded-xl shadow-lg text-center font-bold text-lg sm:text-xl max-w-lg w-full border border-white/20 backdrop-blur-sm z-20 transition-all duration-300 transform ">
                    <span className="opacity-95 text-yellow-300 drop-shadow-[0_0_5px_rgba(252,211,77,0.8)]">
                        🏆 Tournament Week! 🏆
                    </span>
                    <br />
                    <span className="text-sm sm:text-base font-medium opacity-85 mt-2 inline-block">
                        Join the action. Top teams win big!
                    </span>
                </div>
            </div>

            // Category Navigation Buttons
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Explore Match Types</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <Button 
                        variant="outline" 
                        className="flex flex-col h-auto py-4 bg-gray-800 text-white border-none hover:bg-gray-700"
                        onClick={() => router.push('/matches?status=upcoming')}
                    >
                        <Image src="/icons/upcoming.png" alt="Upcoming Matches" width={48} height={48} />
                        <span className="mt-2 text-sm">Upcoming Matches</span>
                    </Button>
                    <Button 
                        variant="outline" 
                        className="flex flex-col h-auto py-4 bg-gray-800 text-white border-none hover:bg-gray-700"
                        onClick={() => router.push('/matches?type=br')}
                    >
                        <Image src="/icons/br.png" alt="Battle Royale" width={48} height={48} />
                        <span className="mt-2 text-sm">Battle Royale</span>
                    </Button>
                    <Button 
                        variant="outline" 
                        className="flex flex-col h-auto py-4 bg-gray-800 text-white border-none hover:bg-gray-700"
                        onClick={() => router.push('/matches?type=cs')}
                    >
                        <Image src="/icons/cs.png" alt="Clash Squad" width={48} height={48} />
                        <span className="mt-2 text-sm">Clash Squad</span>
                    </Button>
                    <Button 
                        variant="outline" 
                        className="flex flex-col h-auto py-4 bg-gray-800 text-white border-none hover:bg-gray-700"
                        onClick={() => router.push('/matches?type=lw')}
                    >
                        <Image src="/icons/lw.png" alt="Lone Wolf" width={48} height={48} />
                        <span className="mt-2 text-sm">Lone Wolf</span>
                    </Button>
                    <Button 
                        variant="outline" 
                        className="flex flex-col h-auto py-4 bg-gray-800 text-white border-none hover:bg-gray-700"
                        onClick={() => router.push('/matches?status=completed')}
                    >
                        <Image src="/icons/completed.png" alt="Completed Matches" width={48} height={48} />
                        <span className="mt-2 text-sm">Completed Matches</span>
                    </Button>
                </div>
            </div>

            <Separator className="my-8 h-px bg-gray-600" />

            // Latest Matches Section
            <motion.div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 drop-shadow-[0_0_8px_rgba(0,255,255,0.4)] animate-[gradient-move_4s_ease_infinite_alternate] [background-size:200%_200%]">
                        Latest Matches
                    </h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/70 hover:text-white transition-colors group"
                        onClick={() => router.push('/matches?status=running,upcoming')}
                    >
                        View All
                        <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categorizedMatches.latest.length === 0 ? (
                        <div className="text-white/60 text-center py-8 col-span-full">No latest matches available.</div>
                    ) : (
                        categorizedMatches.latest.slice(0, 3).map(match => (
                            <MatchCard key={match._id} match={match} />
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    );
}
*/

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-950 text-white text-center">
            <div className="max-w-md mx-auto space-y-6">
                <h1 className="text-4xl font-bold text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.7)]">
                    App RIP 💔
                </h1>
                <p className="text-xl text-gray-400">
                    We're deeply sorry to say that our app is no longer providing services.
                </p>
                <p className="text-lg text-gray-500 font-medium">
                    Thank you for being a part of our journey. Your passion and support meant the world to us.
                </p>
                <p className="text-sm text-gray-600">
                    We will never forget the moments we shared. hwk villan and mikasa will always be in our hearts.
                    goodbye for now, and thank you for everything.we are very grateful for your support.
                    and remember this hard work of more then  11 months.
                </p>
            </div>
        </div>
    );
}
//         );
//     }

//     return (
//         <div className="container mx-auto p-4 min-h-screen">
//             <div className="flex items-center justify-center mb-8">
//                 <ExpoSlider />
//             </div>

//             <Separator className="mb-8 h-2 bg-white/30" />

//             {/* Announcement Section */}
//             <div className="mb-8 w-full flex justify-center relative">
//                 <div className="absolute inset-0 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-600 blur-md opacity-40 rounded-xl z-0" />
//                 <div className="relative text-white px-6 py-4 rounded-xl shadow-lg text-center font-bold text-lg sm:text-xl max-w-lg w-full border border-white/20 backdrop-blur-sm z-20 transition-all duration-300 transform ">
//                     <span className="opacity-95 text-yellow-300 drop-shadow-[0_0_5px_rgba(252,211,77,0.8)]">
//                         🏆 Tournament Week! 🏆
//                     </span>
//                     <br />
//                     <span className="text-sm sm:text-base font-medium opacity-85 mt-2 inline-block">
//                         Join the action. Top teams win big!
//                     </span>
//                 </div>
//             </div>

//             {/* Category Navigation Buttons */}
//             <div className="mb-8">
//                 <h2 className="text-2xl font-bold text-white mb-4">Explore Match Types</h2>
//                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
//                     <Button 
//                         variant="outline" 
//                         className="flex flex-col h-auto py-4 bg-gray-800 text-white border-none hover:bg-gray-700"
//                         onClick={() => router.push('/matches?status=upcoming')}
//                     >
//                         <Image src="/icons/upcoming.png" alt="Upcoming Matches" width={48} height={48} />
//                         <span className="mt-2 text-sm">Upcoming Matches</span>
//                     </Button>
//                     <Button 
//                         variant="outline" 
//                         className="flex flex-col h-auto py-4 bg-gray-800 text-white border-none hover:bg-gray-700"
//                         onClick={() => router.push('/matches?type=br')}
//                     >
//                         <Image src="/icons/br.png" alt="Battle Royale" width={48} height={48} />
//                         <span className="mt-2 text-sm">Battle Royale</span>
//                     </Button>
//                     <Button 
//                         variant="outline" 
//                         className="flex flex-col h-auto py-4 bg-gray-800 text-white border-none hover:bg-gray-700"
//                         onClick={() => router.push('/matches?type=cs')}
//                     >
//                         <Image src="/icons/cs.png" alt="Clash Squad" width={48} height={48} />
//                         <span className="mt-2 text-sm">Clash Squad</span>
//                     </Button>
//                     <Button 
//                         variant="outline" 
//                         className="flex flex-col h-auto py-4 bg-gray-800 text-white border-none hover:bg-gray-700"
//                         onClick={() => router.push('/matches?type=lw')}
//                     >
//                         <Image src="/icons/lw.png" alt="Lone Wolf" width={48} height={48} />
//                         <span className="mt-2 text-sm">Lone Wolf</span>
//                     </Button>
//                     <Button 
//                         variant="outline" 
//                         className="flex flex-col h-auto py-4 bg-gray-800 text-white border-none hover:bg-gray-700"
//                         onClick={() => router.push('/matches?status=completed')}
//                     >
//                         <Image src="/icons/completed.png" alt="Completed Matches" width={48} height={48} />
//                         <span className="mt-2 text-sm">Completed Matches</span>
//                     </Button>
//                 </div>
//             </div>

//             <Separator className="my-8 h-px bg-gray-600" />

//             {/* Latest Matches Section */}
//             <motion.div className="mb-8">
//                 <div className="flex items-center justify-between mb-4">
//                     <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 drop-shadow-[0_0_8px_rgba(0,255,255,0.4)] animate-[gradient-move_4s_ease_infinite_alternate] [background-size:200%_200%]">
//                         Latest Matches
//                     </h2>
//                     <Button
//                         variant="ghost"
//                         size="sm"
//                         className="text-white/70 hover:text-white transition-colors group"
//                         onClick={() => router.push('/matches?status=running,upcoming')}
//                     >
//                         View All
//                         <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
//                     </Button>
//                 </div>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {/* The ternary operator for loading state is removed here */}
//                     {categorizedMatches.latest.length === 0 ? (
//                         <div className="text-white/60 text-center py-8 col-span-full">No latest matches available.</div>
//                     ) : (
//                         categorizedMatches.latest.slice(0, 3).map(match => (
//                             <MatchCard key={match._id} match={match} />
//                         ))
//                     )}
//                 </div>
//             </motion.div>
//         </div>
//     );
// }