"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Menu from '@/components/navbar';

// Add CSS animation for border pulse
const borderPulseStyle = `
  @keyframes borderPulse {
    0% {
      border-color: rgba(34, 197, 94, 0.5);
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
    }
    50% {
      border-color: rgba(34, 197, 94, 0.8);
      box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
    }
    100% {
      border-color: rgba(34, 197, 94, 0.5);
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
    }
  }
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = borderPulseStyle;
  document.head.appendChild(style);
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-center h-5">
      <motion.span className="w-2 h-2 rounded-full bg-white/60"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1, delay: 0 }}
      />
      <motion.span className="w-2 h-2 rounded-full bg-white/60"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
      />
      <motion.span className="w-2 h-2 rounded-full bg-white/60"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
      />
    </span>
  );
}

// Helper to render **bold**, bullet points, emojis, color formatting, links, and buttons in bot messages
function renderWithFormatting(text, showButtons = true) {
  // Replace color tags with spans
  text = text.replace(/\[green\](.*?)\[\/green\]/g, '<span style="color:#16a34a;font-weight:600">$1</span>');
  text = text.replace(/\[red\](.*?)\[\/red\]/g, '<span style="color:#dc2626;font-weight:600">$1</span>');
  text = text.replace(/\[yellow\](.*?)\[\/yellow\]/g, '<span style="color:#eab308;font-weight:600">$1</span>');

  // Replace emoji codes with actual emojis
  text = text.replace(/:warning:/g, '⚠️');
  text = text.replace(/:check:/g, '✅');
  text = text.replace(/:info:/g, 'ℹ️');
  text = text.replace(/:star:/g, '⭐');
  text = text.replace(/:money:/g, '💰');
  text = text.replace(/:success:/g, '🟢');
  text = text.replace(/:error:/g, '🔴');
  text = text.replace(/:alert:/g, '🟡');

  // Gaming & Esports specific emojis
  text = text.replace(/:game:/g, '🎮');
  text = text.replace(/:tournament:/g, '🏆');
  text = text.replace(/:winner:/g, '🥇');
  text = text.replace(/:coins:/g, '🪙');
  text = text.replace(/:wallet:/g, '💳');
  text = text.replace(/:payment:/g, '💸');
  text = text.replace(/:withdraw:/g, '📤');
  text = text.replace(/:addmoney:/g, '📥');
  text = text.replace(/:match:/g, '⚔️');
  text = text.replace(/:team:/g, '👥');
  text = text.replace(/:player:/g, '👤');
  text = text.replace(/:hack:/g, '🕵️');
  text = text.replace(/:report:/g, '📋');
  text = text.replace(/:support:/g, '🆘');
  text = text.replace(/:help:/g, '❓');
  text = text.replace(/:time:/g, '⏰');
  text = text.replace(/:clock:/g, '🕐');
  text = text.replace(/:fast:/g, '⚡');
  text = text.replace(/:slow:/g, '🐌');
  text = text.replace(/:fire:/g, '🔥');
  text = text.replace(/:cool:/g, '😎');
  text = text.replace(/:sad:/g, '😔');
  text = text.replace(/:happy:/g, '😊');
  text = text.replace(/:angry:/g, '😠');
  text = text.replace(/:confused:/g, '🤔');
  text = text.replace(/:thinking:/g, '🤨');
  text = text.replace(/:wow:/g, '😲');
  text = text.replace(/:lol:/g, '😂');
  text = text.replace(/:ok:/g, '👍');
  text = text.replace(/:no:/g, '👎');
  text = text.replace(/:heart:/g, '❤️');
  text = text.replace(/:broken:/g, '💔');
  text = text.replace(/:phone:/g, '📱');
  text = text.replace(/:email:/g, '📧');
  text = text.replace(/:insta:/g, '📸');
  text = text.replace(/:link:/g, '🔗');
  text = text.replace(/:download:/g, '⬇️');
  text = text.replace(/:upload:/g, '⬆️');
  text = text.replace(/:refresh:/g, '🔄');
  text = text.replace(/:settings:/g, '⚙️');
  text = text.replace(/:profile:/g, '👤');
  text = text.replace(/:home:/g, '🏠');
  text = text.replace(/:events:/g, '📅');
  text = text.replace(/:notifications:/g, '🔔');

  // Split into lines for bullet point detection
  const lines = text.split(/\r?\n/);
  const elements = [];
  let bulletList = [];
  let key = 0;

  const boldRegex = /\*\*(.*?)\*\*/g;

  function parseBold(str) {
    const parts = [];
    let lastIndex = 0;
    let match;
    let boldKey = 0;
    while ((match = boldRegex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.slice(lastIndex, match.index));
      }
      parts.push(<strong key={"b" + boldKey++}>{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < str.length) {
      parts.push(str.slice(lastIndex));
    }
    return parts;
  }

  function parseLinks(str) {
    // Parse markdown links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let linkKey = 0;
    while ((match = linkRegex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(...parseColors(str.slice(lastIndex, match.index)));
      }
      parts.push(
        <a
          key={"l" + linkKey++}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700 underline"
        >
          {match[1]}
        </a>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < str.length) {
      parts.push(...parseColors(str.slice(lastIndex)));
    }
    return parts;
  }

  function parseButtons(str, showButtons = true) {
    // Parse button syntax [button:action]text[/button]
    const buttonRegex = /\[button:([^\]]+)\](.*?)\[\/button\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let buttonKey = 0;
    let buttons = [];

    while ((match = buttonRegex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(...parseLinks(str.slice(lastIndex, match.index)));
      }

      // If showButtons is false, completely hide the button syntax
      if (!showButtons) {
        lastIndex = match.index + match[0].length;
        continue;
      }

      const action = match[1];
      const buttonText = match[2];

      let buttonElement;
      if (action === 'instagram') {
        buttonElement = (
          <a
            key={"btn" + buttonKey++}
            href="https://instagram.com/turrani_esports"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            📸 {buttonText}
          </a>
        );
      } else if (action === 'email') {
        buttonElement = (
          <a
            key={"btn" + buttonKey++}
            href="mailto:turraniesports@gmail.com"
            className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            📧 {buttonText}
          </a>
        );
      } else if (action === 'telegram') {
        buttonElement = (
          <a
            key={"btn" + buttonKey++}
            href="https://t.me/turraniEsports"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            4AC {buttonText}
          </a>
        );
      } else if (action === 'wallet') {
        buttonElement = (
          <a
            key={"btn" + buttonKey++}
            href="/wallet"
            className="inline-flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            💳 {buttonText}
          </a>
        );
      } else if (action === 'events') {
        buttonElement = (
          <a
            key={"btn" + buttonKey++}
            href="/events"
            className="inline-flex items-center justify-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            🏆 {buttonText}
          </a>
        );
      } else if (action === 'settings') {
        buttonElement = (
          <a
            key={"btn" + buttonKey++}
            href="/settings"
            className="inline-flex items-center justify-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            ⚙️ {buttonText}
          </a>
        );
      } else if (action === 'profile') {
        buttonElement = (
          <a
            key={"btn" + buttonKey++}
            href="/profile"
            className="inline-flex items-center justify-center gap-2 bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            👤 {buttonText}
          </a>
        );
      } else {
        buttonElement = (
          <span
            key={"btn" + buttonKey++}
            className="inline-flex items-center justify-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md"
          >
            {buttonText}
          </span>
        );
      }

      buttons.push(buttonElement);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < str.length) {
      parts.push(...parseLinks(str.slice(lastIndex)));
    }

    // If we have buttons and showButtons is true, wrap them in a container with pop animation
    if (buttons.length > 0 && showButtons) {
      parts.push(
        <motion.div
          key={"btn-container-" + buttonKey}
          className="flex flex-wrap gap-2 mt-3 mb-2"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.4,
            type: "spring",
            stiffness: 300,
            damping: 25
          }}
        >
          {buttons.map((button, index) => (
            <motion.div
              key={button.key}
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.1,
                type: "spring",
                stiffness: 400,
                damping: 30
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {button}
            </motion.div>
          ))}
        </motion.div>
      );
    }

    return parts;
  }

  function parseColors(str) {
    // Parse <span style="color:...">...</span> to React elements
    const colorRegex = /<span style=\"color:(#[0-9a-fA-F]{6});font-weight:600\">(.*?)<\/span>/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let colorKey = 0;
    while ((match = colorRegex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(...parseBold(str.slice(lastIndex, match.index)));
      }
      parts.push(<span key={"c" + colorKey++} style={{ color: match[1], fontWeight: 600 }}>{match[2]}</span>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < str.length) {
      parts.push(...parseBold(str.slice(lastIndex)));
    }
    return parts;
  }

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (/^[-*•]\s+/.test(trimmed)) {
      bulletList.push(parseButtons(trimmed.replace(/^[-*•]\s+/, '')));
    } else {
      if (bulletList.length > 0) {
        elements.push(<ul key={"ul" + key++} className="list-disc pl-5 my-1">{bulletList.map((item, i) => <li key={i}>{item}</li>)}</ul>);
        bulletList = [];
      }
      if (trimmed.length > 0) {
        elements.push(<div key={"d" + key++}>{parseButtons(trimmed)}</div>);
      }
    }
  });
  if (bulletList.length > 0) {
    elements.push(<ul key={"ul" + key++} className="list-disc pl-5 my-1">{bulletList.map((item, i) => <li key={i}>{item}</li>)}</ul>);
  }
  return elements;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [currentTypingIndex, setCurrentTypingIndex] = useState(0);
  const [showBorderAnimation, setShowBorderAnimation] = useState(false);
  const messagesEndRef = useRef(null);
  const [chatInput, setChatInput] = useState("");
  const textareaRef = useRef(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const suggestions = [
    'Tournament kab hai?',
    'Entry fee kitna hai?',
    'Prize pool kya hai?',
    'Team kaise banayein?',
    'Payment nahi ho raha, help!',
    'Result kab aayega?'
  ];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120;
      const newHeight = Math.min(scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [chatInput]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % suggestions.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    window.dispatchEvent(new CustomEvent('chatMessage', { detail: chatInput.trim() }));
    setChatInput("");
  };

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, botTyping]);

  // Listen for chat messages from the navbar input
  useEffect(() => {
    const handleChatMessage = async (event) => {
      const message = event.detail;

      setSending(true);
      setMessages((prev) => [
        ...prev,
        { type: "user", text: message }
      ]);
      setBotTyping(true);

      // Call AI chatbot API with full history
      try {
        const res = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, history: [...messages, { type: "user", text: message }] })
        });
        const data = await res.json();
        setBotTyping(false);

        // Start typing animation
        const botResponse = data.message || "Sorry, I couldn't generate a response.";
        setTypingText("");
        setCurrentTypingIndex(0);
        setShowBorderAnimation(false);

        // Add message with animated flag and its own typing text
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: botResponse,
            animated: true,
            typingText: "",
            currentTypingIndex: 0
          },
        ]);
      } catch (err) {
        setBotTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: "⚠️ There was an error contacting the AI.",
            animated: true,
            typingText: "",
            currentTypingIndex: 0
          },
        ]);
      }
      setSending(false);
    };

    window.addEventListener('chatMessage', handleChatMessage);
    return () => window.removeEventListener('chatMessage', handleChatMessage);
  }, [messages]);

  // Typing animation effect
  useEffect(() => {
    const currentMessage = messages[messages.length - 1];
    if (currentMessage?.type === "bot" && currentMessage?.animated && !botTyping) {
      const text = currentMessage.text;
      const currentIndex = currentMessage.currentTypingIndex || 0;

      if (currentIndex < text.length) {
        const timer = setTimeout(() => {
          const newTypingText = text.slice(0, currentIndex + 1);
          setMessages(prev =>
            prev.map((msg, idx) =>
              idx === prev.length - 1
                ? { ...msg, typingText: newTypingText, currentTypingIndex: currentIndex + 1 }
                : msg
            )
          );
        }, 30); // Adjust speed here (lower = faster)
        return () => clearTimeout(timer);
      } else {
        // Animation complete, show border animation
        setShowBorderAnimation(true);

        // After border animation, mark as not animated
        setTimeout(() => {
          setMessages(prev =>
            prev.map((msg, idx) =>
              idx === prev.length - 1
                ? { ...msg, animated: false }
                : msg
            )
          );
          setShowBorderAnimation(false);
        }, 2000); // Show border for 2 seconds
      }
    }
  }, [messages, botTyping]);

  return (
    <div className="min-h-screen ">
      {/* Plain chat container, no glass, no background, no overlay */}
      <div className="fixed left-0 right-0 z-30" style={{ top: '4rem', bottom: '5.5rem' }}>
        <div className="w-full h-full flex flex-col">
          {/* Scrollable chat messages area with extra bottom padding for input */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 px-3 sm:px-4 pb-32 scrollbar-none">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.25 }}
                  className={`w-fit max-w-[85vw] sm:max-w-[70%] rounded-xl px-3 py-2 text-sm shadow-md break-words relative
                    ${msg.type === "user"
                      ? "ml-auto bg-blue-500 text-white"
                      : "mr-auto bg-white/10 border border-white/20 text-white"
                    }
                    ${idx === 0 ? 'mt-8' : ''}`}
                >
                  {msg.type === "bot" && showBorderAnimation && idx === messages.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 rounded-xl border-2 border-green-500/50 bg-green-500/10 pointer-events-none"
                      style={{
                        animation: 'borderPulse 2s ease-in-out'
                      }}
                    />
                  )}
                  {msg.type === "bot" && msg.animated && idx === messages.length - 1 ? (
                    <span>
                      {renderWithFormatting(msg.typingText, false)}
                    </span>
                  ) : (
                    <div>
                      {renderWithFormatting(msg.text, true)}
                    </div>
                  )}
                </motion.div>
              ))}
              {botTyping && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.25 }}
                  className="mr-auto w-fit max-w-[70%] rounded-xl px-3 py-2 text-sm shadow-md bg-white/10 border border-white/20 text-white flex items-center"
                >
                  <TypingDots />
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
      {/* Independent Chat Input fixed at bottom above nav */}
      <div className="fixed left-0 right-0 bottom-[5.5rem] z-50 flex justify-center pointer-events-none">
        <form
          className="w-full max-w-md px-2 pointer-events-auto"
          onSubmit={handleSendMessage}
        >
          <div className="w-full flex items-end gap-2 rounded-2xl border shadow-xl backdrop-blur-xl px-3 py-2 bg-gradient-to-r from-gray-900/90 to-black/90 border-border/20">
            <div className="w-full relative flex items-end">
              {/* Animated placeholder div with better positioning */}
              {chatInput.length === 0 && (
                <div
                  className="absolute left-3 bottom-2 text-muted-foreground text-sm pointer-events-none select-none whitespace-nowrap overflow-hidden"
                  style={{ zIndex: 2 }}
                >
                  {suggestions[placeholderIndex]}
                </div>
              )}
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
                  setTimeout(() => {
                    textareaRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center'
                    });
                  }, 100);
                }}
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-cyan-500 hover:bg-cyan-600 text-white shadow-cyan-500/40 shadow-lg h-8 w-8 flex items-center justify-center mb-1 flex-shrink-0"
              disabled={!chatInput.trim() || botTyping}
              aria-label="Send"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          </div>
        </form>
      </div>
      {/* Bottom nav bar */}
      <Menu botTyping={botTyping} />
    </div>
  );
}