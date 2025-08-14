"use client";


import Image from "next/image";
import { ModeToggle } from "./ModeToggle";
import WalletComponent from "./walllet";
import { motion, AnimatePresence } from "framer-motion";
import { TextEffect } from "./motion-primitives/text-effect";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { MessageSquare, AlignJustify, X, Wallet, Moon, Sun, LogOut, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useUserData } from "@/lib/hooks/useUserData";
import { useRouter } from "next/navigation";

export default function TopNavbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Remove useThemeSync, theme, and toggleTheme
  // Add local state for visual-only theme toggle
  const [isDark, setIsDark] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showThemeToggle, setShowThemeToggle] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const { userData, refreshUserData } = useUserData();
  const router = useRouter();

  // Check if app is installed
  useEffect(() => {
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      setIsStandalone(standalone);
    };
    checkStandalone();
  }, []);

  // Refresh data periodically
  useEffect(() => {
    if (!userData?.email) return;
    
    const interval = setInterval(() => {
      refreshUserData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [userData?.email]); // Removed refreshUserData from dependencies

  const userCoins = userData?.coins ?? 0;

  // Logout Handler
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        // Clear any local storage or session storage
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
        }
        
        // Redirect to login page
        window.location.href = '/login';
      } else {
        // Fallback logout
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
        }
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback logout
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      window.location.href = '/login';
    }
  };

  // Install app handler
  const handleInstallClick = () => {
    const currentUrl = new URL(window.location);
    currentUrl.searchParams.set('q', 'install');
    window.location.href = currentUrl.toString();
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    
    if (!isMenuOpen) {
      // Reset states when opening menu
      setShowWallet(false);
      setShowThemeToggle(false);
      setShowChatbot(false);
      setShowLogout(false);
      setShowInstall(false);
      
      // Trigger animations with delays
      setTimeout(() => setShowWallet(true), 100);
      setTimeout(() => setShowThemeToggle(true), 200);
      setTimeout(() => setShowChatbot(true), 300);
      setTimeout(() => setShowInstall(true), 400);
      setTimeout(() => setShowLogout(true), 500);
    }
  };

  return (
    <>
      {
        pathname.includes('/admin') || pathname == '/network-error' ? null : (
          <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b-2 border-border/20">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                {/* Logo and Brand */}
                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    whileHover={{ scale: 1.05 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-cyan-500/20 blur-md rounded-full" />
                    <Image
                      className="relative z-10 transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                      src="/icon.png"
                      alt="TurraniX"
                      width={40}
                      height={40}
                      priority
                      unoptimized
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex items-center gap-2"
                  >
                    <TextEffect
                      per='char'
                      preset='fade-in-blur'
                      className="text-lg font-bold  text-cyan-500"
                      speedReveal={0.8}
                      speedSegment={1.2}
                    >
                      TurraniX
                    </TextEffect>
                  </motion.div>
                </div>

                {/* Right Side Items */}
                <div className="flex items-center">
                  {/* Wallet Button with Coins Display */}
                  <Link href="/wallet" className="mr-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative flex items-center gap-2 px-3 py-2 rounded-full bg-card/20 text-foreground backdrop-blur-sm shadow-md hover:shadow-yellow-500/20 transition-all duration-300"
                      aria-label="Wallet"
                    >
                      {/* Coins display with yellow text */}
                      {userCoins > 0 && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-yellow-400 font-semibold text-sm"
                        >
                          {userCoins}
                        </motion.span>
                      )}
                      <Wallet className="w-5 h-5" />
                    </motion.button>
                  </Link>

                  {/* AI Chat Button (replaces Hamburger) */}
                  <div className="relative">
                    {/* Subtle pulse animation for the AI button */}
                    <motion.div 
                      className="absolute inset-0 rounded-full bg-green-500/20"
                      animate={{
                        scale: [0.8, 1.1, 0.8],
                        opacity: [0, 0.2, 0]
                      }}
                      transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push('/chatbot')}
                      className="relative z-10 flex items-center justify-center w-9 h-9 rounded-full bg-card/20 text-green-500 backdrop-blur-sm shadow-md hover:shadow-green-500/20 transition-all duration-300"
                      aria-label="AI Chat"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </motion.button>
                  </div>
                  
                  {/* Hidden components that will be shown in the dropdown */}
                  <div className="hidden">
                    <WalletComponent />
                    <ModeToggle />
                  </div>
                </div>
              </div>
              
              {/* Dropdown Menu for Icon Buttons */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden absolute right-4 z-50"
                    style={{ top: "60px" }}
                  >
                    <div className="py-3 space-y-3 backdrop-blur-xl rounded-xl border shadow-lg mt-2 px-2 flex flex-col items-center w-12 relative overflow-hidden">
                      {/* 
                        // theme === 'light' 
                        //   ? 'bg-card/30 border-border/20' 
                        //   : 'bg-gradient-to-r from-gray-900/90 to-black/90 border-border/20'
                      */}
                       {/* Background glow effect */}
                       <motion.div 
                         className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         transition={{ duration: 0.5 }}
                       />

                      {/* Install App Button - Only show if not already installed */}
                      <AnimatePresence>
                        {showInstall && !isStandalone && (
                          <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                          >
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setIsMenuOpen(false);
                                handleInstallClick();
                              }}
                              className="relative flex items-center justify-center w-9 h-9 rounded-full bg-card/20 text-foreground backdrop-blur-sm shadow-md hover:shadow-blue-500/20 transition-all duration-300"
                            >
                              <Download className="h-[1.2rem] w-[1.2rem] text-blue-400" />
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Theme Toggle Button */}
                      <AnimatePresence>
                         {showThemeToggle && (
                           <motion.div
                             initial={{ opacity: 0, y: -20 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0, y: -20 }}
                             transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                           >
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setIsDark((prev) => !prev)}
                              className="relative flex items-center justify-center w-9 h-9 rounded-full bg-card/20 text-foreground backdrop-blur-sm shadow-md hover:shadow-purple-500/20 transition-all duration-300"
                            >
                              {isDark ? (
                                <Moon className="h-[1.2rem] w-[1.2rem]" />
                              ) : (
                                <Sun className="h-[1.2rem] w-[1.2rem]" />
                              )}
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Chatbot Button with Glow Effect */}
                      <AnimatePresence>
                         {showChatbot && (
                           <motion.div
                             initial={{ opacity: 0, y: -20 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0, y: -20 }}
                             transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                           >
                            <Link href="/chatbot">
                              <motion.div 
                                className="relative"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsMenuOpen(false)}
                              >
                                {/* Enhanced glow effect for chatbot button */}
                                 {pathname !== "/chatbot" && (
                                   <>
                                     {/* Outer glow */}
                                     <motion.div 
                                       className="absolute inset-0 rounded-full"
                                       animate={{
                                         boxShadow: [
                                           "0 0 0px rgba(6, 182, 212, 0)",
                                           "0 0 20px rgba(6, 182, 212, 0.8)",
                                           "0 0 0px rgba(6, 182, 212, 0)"
                                         ],
                                         scale: [0.8, 1.2, 0.8]
                                       }}
                                       transition={{ repeat: Infinity, duration: 2 }}
                                     />
                                     {/* Inner glow */}
                                     <motion.div 
                                       className="absolute inset-0 rounded-full bg-cyan-500/10"
                                       animate={{
                                         opacity: [0.2, 0.5, 0.2]
                                       }}
                                       transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
                                     />
                                   </>
                                 )}
                                <motion.button
                                   className="relative z-10 flex items-center justify-center w-9 h-9 rounded-full bg-card/20 text-foreground backdrop-blur-sm shadow-md hover:shadow-cyan-500/20 transition-all duration-300 border border-transparent"
                                 >
                                   <motion.div
                                     whileHover={{ rotate: [0, -10, 10, -5, 5, 0], scale: 1.2 }}
                                     whileTap={{ scale: 0.9 }}
                                     transition={{ duration: 0.5 }}
                                   >
                                     <MessageSquare className={`h-[1.2rem] w-[1.2rem] ${pathname !== "/chatbot" ? "text-cyan-400" : ""}`} />
                                   </motion.div>
                                 </motion.button>
                              </motion.div>
                            </Link>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Logout Button */}
                      <AnimatePresence>
                         {showLogout && (
                           <motion.div
                             initial={{ opacity: 0, y: -20 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0, y: -20 }}
                             transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                           >
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setIsMenuOpen(false);
                                handleLogout();
                              }}
                              className="relative flex items-center justify-center w-9 h-9 rounded-full bg-card/20 text-foreground backdrop-blur-sm shadow-md hover:shadow-red-500/20 transition-all duration-300"
                            >
                              <LogOut className="h-[1.2rem] w-[1.2rem] text-red-400" />
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
        )
      }
    </>
  );
}