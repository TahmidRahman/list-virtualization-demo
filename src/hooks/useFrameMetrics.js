import { useState, useEffect, useRef } from 'react';

/**
 * Tracks frame-level performance via requestAnimationFrame.
 * Resets all counters when resetKey changes (e.g. on tab switch).
 *
 * Returns:
 *   fps          — 1-second rolling average frame rate (null until first second)
 *   droppedFrames — cumulative frames with delta > 25ms since last reset
 *   worstFrame    — single longest frame (ms) since last reset
 */
export function useFrameMetrics(resetKey) {
  const [fps, setFps] = useState(null);
  const [droppedFrames, setDroppedFrames] = useState(0);
  const [worstFrame, setWorstFrame] = useState(0);

  // Mutable bucket — safe to mutate across RAF iterations without re-renders
  const s = useRef({
    windowFrameCount: 0,
    windowStart: performance.now(),
    lastFrameTime: null,
    totalDropped: 0,
    allTimeWorst: 0,
  });

  // Reset counters when the tab changes
  useEffect(() => {
    s.current.windowFrameCount = 0;
    s.current.windowStart = performance.now();
    s.current.lastFrameTime = null;
    s.current.totalDropped = 0;
    s.current.allTimeWorst = 0;
    setFps(null);
    setDroppedFrames(0);
    setWorstFrame(0);
  }, [resetKey]);

  // RAF loop — runs for the lifetime of the component
  useEffect(() => {
    let rafId;

    const loop = (timestamp) => {
      const state = s.current;

      if (state.lastFrameTime !== null) {
        const delta = timestamp - state.lastFrameTime;

        // A frame taking >25ms means the browser missed the 16.67ms budget
        if (delta > 25) {
          state.totalDropped++;
          setDroppedFrames(state.totalDropped);
        }

        if (delta > state.allTimeWorst) {
          state.allTimeWorst = delta;
          setWorstFrame(Math.round(delta));
        }
      }

      state.lastFrameTime = timestamp;
      state.windowFrameCount++;

      const elapsed = timestamp - state.windowStart;
      if (elapsed >= 1000) {
        setFps(Math.round((state.windowFrameCount * 1000) / elapsed));
        state.windowFrameCount = 0;
        state.windowStart = timestamp;
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []); // intentionally runs once; state bucket is mutable

  return { fps, droppedFrames, worstFrame };
}
