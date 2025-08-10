// app/(main)/loading.tsx
"use client";
import { motion } from "framer-motion";

export default function Loading() {
  return (
    <motion.div
      className="fixed top-16 left-0 right-0 h-1 bg-cyan-500 z-[9999]"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      exit={{ scaleX: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      style={{ transformOrigin: "left" }}
    />
  );
}