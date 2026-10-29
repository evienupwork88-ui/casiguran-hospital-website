"use client";

import { useCallback, useEffect, useState } from "react";
import { getBackendTime } from "@/lib/api/health";

export function useServerClock() {
  const [anchor, setAnchor] = useState<{ serverTime: number; performanceTime: number } | null>(null);
  const [performanceNow, setPerformanceNow] = useState<number | null>(null);
  const [error, setError] = useState("");

  const sync = useCallback(async () => {
    const requestStartedAt = window.performance.now();
    try {
      const serverTime = await getBackendTime();
      const requestCompletedAt = window.performance.now();
      setAnchor({
        serverTime,
        performanceTime: (requestStartedAt + requestCompletedAt) / 2,
      });
      setError("");
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Unable to sync with the server clock.");
    }
  }, []);

  useEffect(() => {
    void sync();
    setPerformanceNow(window.performance.now());
    const tickInterval = window.setInterval(() => setPerformanceNow(window.performance.now()), 1000);
    const syncInterval = window.setInterval(() => void sync(), 60_000);
    return () => {
      window.clearInterval(tickInterval);
      window.clearInterval(syncInterval);
    };
  }, [sync]);

  return {
    time: anchor && performanceNow !== null
      ? new Date(anchor.serverTime + performanceNow - anchor.performanceTime)
      : null,
    error,
    sync,
  };
}
