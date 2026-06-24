"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { useTheme } from "next-themes";

interface LiquidGlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function LiquidGlassCard({
  children,
  className = "",
}: LiquidGlassCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { theme } = useTheme();

  function handleMouseMove({
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const { left, top } = cardRef.current.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-[2rem] border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl backdrop-blur-[40px] transition-all duration-300 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              ${theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)'},
              transparent 40%
            )
          `,
        }}
      />
      <div className="relative z-10">{children}</div>
      {/* Edge highlight to simulate glass thickness */}
      <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] pointer-events-none" />
    </motion.div>
  );
}
