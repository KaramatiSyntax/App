'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHome, FaBell, FaUser, FaCalendarAlt } from 'react-icons/fa';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserData } from '@/lib/hooks/useUserData';

const navItems = [
  { href: '/', icon: <FaHome />, label: 'Home' },
  { href: '/events', icon: <FaCalendarAlt />, label: 'Events' },
  { href: '/notifications', icon: <FaBell />, label: 'Alerts' },
  { href: '/profile', icon: <FaUser />, label: 'Profile' },
];

export default function Menu({ botTyping }) {
  // All original code is commented out below
  /*
  const pathname = usePathname();
  const [selectorLeft, setSelectorLeft] = useState(0);
  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatInputVisible, setIsChatInputVisible] = useState(false);
  const textareaRef = useRef(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const { userData } = useUserData();
  
  const notifications = userData?.notifications || [];
  const unreadCount = notifications.filter(notification => !notification.read).length;
  const suggestions = [
    'Tournament kab hai?',
    'Entry fee kitna hai?',
    'Prize pool kya hai?',
    'Team kaise banayein?',
    'Payment nahi ho raha, help!',
    'Result kab aayega?'
  ];

  // Detect keyboard visibility on mobile
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        const viewportHeight = window.visualViewport?.height || window.innerHeight;
        const windowHeight = window.innerHeight;
        const keyboardVisible = windowHeight - viewportHeight > 150;
        setIsKeyboardVisible(keyboardVisible);
      } else {
        setIsKeyboardVisible(false);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  useEffect(() => {
    const activeIndex = navItems.findIndex((item) => item.href === pathname);
    if (containerRef.current && itemRefs.current[activeIndex]) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const itemRect = itemRefs.current[activeIndex].getBoundingClientRect();
      const offset = itemRect.left - containerRect.left + itemRect.width / 2;
      setSelectorLeft(offset);
    }
    
    // Show chat input only on chatbot page
    setIsChatInputVisible(pathname === "/chatbot");
  }, [pathname]);
  
  // Auto-expand textarea with better height management
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // Maximum height in pixels
      const newHeight = Math.min(scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [chatInput]);

  useEffect(() => {
    if (!isChatInputVisible) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % suggestions.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isChatInputVisible]);
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    // Dispatch the chat message event for the chatbot page to handle
    window.dispatchEvent(new CustomEvent('chatMessage', { detail: chatInput.trim() }));
    
    // Clear the input
    setChatInput("");
  };

  // Add min-height if on /chatbot for send layout space
  const isChatbot = pathname === "/chatbot";
  const activeIndex = navItems.findIndex((item) => item.href === pathname);

  // Don't render navbar on admin pages
  if (pathname.includes('/admin')) {
    return null;
  }

  return (
    <div
      className="fixed z-50 left-1/2 -translate-x-1/2 w-[95%] max-w-md px-2 bottom-4 border border-border/20 backdrop-blur-xl rounded-2xl shadow-xl transition-all duration-300 ease-out"
    >
      <div className="flex flex-col gap-0">
        // Chat Input - Only visible on chatbot page
        <AnimatePresence>
          {isChatInputVisible && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="mb-0"
            >
              <motion.form
                className="w-full"
                onSubmit={handleSendMessage}
              >
                <div className={`w-full flex items-end gap-2 rounded-t-2xl border-t border-l border-r shadow-xl backdrop-blur-xl px-3 py-2 bg-gradient-to-r from-gray-900/90 to-black/90 border-border/20`}>
                  <div className="w-full relative flex items-end">
                    // Animated placeholder div with better positioning
                    <AnimatePresence mode="wait">
                      {chatInput.length === 0 && (
                        <motion.div
                          key={placeholderIndex}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.4 }}
                          className="absolute left-3 bottom-2 text-muted-foreground text-sm pointer-events-none select-none whitespace-nowrap overflow-hidden"
                          style={{ zIndex: 2 }}
                        >
                          {suggestions[placeholderIndex]}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <textarea
                      ref={textareaRef}
                      className="w-full resize-none min-h-[36px] max-h-[120px] bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm px-2 py-2 rounded-lg scrollbar-none hide-scrollbar relative z-10 leading-relaxed"
                      placeholder=""
                      value={chatInput}
                      rows={1}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      onFocus={() => {
                        // Scroll to input on focus for better mobile experience
                        setTimeout(() => {
                          textareaRef.current?.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                          });
                        }, 100);
                      }}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="icon"
                    className="rounded-full bg-cyan-500 hover:bg-cyan-600 text-white shadow-cyan-500/40 shadow-lg h-8 w-8 flex items-center justify-center mb-1 flex-shrink-0"
                    disabled={!chatInput.trim() || botTyping}
                    aria-label="Send"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </motion.form>
              
              // Visual connector between input and navbar
              <div className={`h-1 w-full backdrop-blur-xl border-l border-r bg-gradient-to-r from-gray-900/90 to-black/90 border-border/20`}></div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div
          ref={containerRef}
          className="relative backdrop-blur-xl rounded-2xl border flex justify-between items-center px-4 py-2 shadow-xl h-[70px] transition-colors duration-300"
        >
        // Animated Selector
        {activeIndex !== -1 && selectorLeft !== 0 && (
          <motion.div
            className="absolute left-8 top-1/2 w-16 h-16 bg-cyan-500 rounded-full shadow-cyan-500/40 shadow-lg z-0"
            animate={{ left: selectorLeft }}
            initial={false}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}

        // Nav Items
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          const isBellIcon = item.href === '/notifications';
          // Fallback for unreadCount since userData is disabled
          const unreadCount = 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              ref={(el) => (itemRefs.current[index] = el)}
              aria-label={item.label}
              onMouseEnter={() => {}}
              onTouchStart={() => {}}
              className={`relative z-10 flex flex-col items-center justify-center w-14 h-14 transition-all duration-300 ${
                isActive
                  ? 'text-foreground scale-110 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <motion.span
                className="text-xl relative"
                animate={isActive ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : {}}
                transition={{ duration: 0.6 }}
              >
                {item.icon}
                // Blue dot indicator for unread notifications
                {isBellIcon && unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-card/20 shadow-lg"
                  />
                )}
              </motion.span>
              <span className="text-[11px] mt-1">{item.label}</span>
            </Link>
          );
        })}
        </div>
      </div>
    </div>
  );
  */
  
  // This return statement ensures nothing is rendered.
  return null;
}