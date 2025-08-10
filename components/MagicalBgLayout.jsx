"use client";
import { usePathname } from "next/navigation";

export default function MagicalBgLayout({ children }) {
  const pathname = usePathname();
  const isEvents = pathname.startsWith("/events");

  return (
    <div className={isEvents ? "bg-gradient-to-br from-[#7f5fff] via-[#a685ff] to-[#4e1fa4] animate-fadein min-h-screen" : ""}>
      {isEvents && (
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#7f5fff] via-[#a685ff] to-[#4e1fa4] animate-fadein" />
      )}
      {children}
    </div>
  );
} 