"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function usePageTransition() {
  const pathname = usePathname();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const t = setTimeout(() => setIsAnimating(false), 450);
    return () => clearTimeout(t);
  }, [pathname]);

  return { isAnimating, key: pathname };
}
