"use client";

import { motion } from "framer-motion";
import { pageTransition } from "@/lib/motion";
import { usePageTransition } from "@/hooks/usePageTransition";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const { key } = usePageTransition();

  return (
    <motion.div
      key={key}
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
