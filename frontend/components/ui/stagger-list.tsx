"use client";

import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/motion";

export function StaggerList({
  children,
  className,
}: {
  children: React.ReactNode[];
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {children.map((child, i) => (
        <motion.div key={i} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
