"use client";
import { useState, useEffect } from "react";
import "./Clock.scss";

/** Reloj en vivo HH:mm:ss (se actualiza cada segundo, solo en cliente). */
export default function Clock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="fl-clock" suppressHydrationWarning>
      {time || "--:--:--"}
    </span>
  );
}
