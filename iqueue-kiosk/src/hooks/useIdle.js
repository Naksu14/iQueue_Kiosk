import { useEffect, useRef } from "react";

export default function useIdle({
  timeout = 60000,
  onIdle = () => {},
  onActive = () => {},
  considerHiddenAsIdle = true,
} = {}) {
  const timerRef = useRef(null);
  const idleRef = useRef(false);

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const setIdleNow = () => {
      if (!idleRef.current) {
        idleRef.current = true;
        onIdle();
      }
    };

    const setActiveNow = () => {
      if (idleRef.current) {
        idleRef.current = false;
        onActive();
      }
    };

    const resetTimer = () => {
      setActiveNow();
      clearTimer();
      timerRef.current = setTimeout(setIdleNow, timeout);
    };

    // Initialize timer when hook mounts or deps change
    resetTimer();

    const events = [
      "pointerdown",
      "pointermove",
      "keydown",
      "wheel",
      "scroll",
      "touchstart",
    ];
    events.forEach((e) =>
      window.addEventListener(e, resetTimer, { passive: true })
    );

    const onVisibility = () => {
      if (document.hidden) {
        if (considerHiddenAsIdle) setIdleNow();
      } else {
        resetTimer();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearTimer();
      events.forEach((e) => window.removeEventListener(e, resetTimer, false));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [timeout, onIdle, onActive, considerHiddenAsIdle]);
}
