"use client";
import { useEffect } from "react";
import { usePathname } from "@/navigation";

/** Sube el scroll al tope cada vez que cambia de página. */
export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
