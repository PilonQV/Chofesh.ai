import { useEffect, useRef, useCallback } from "react";

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  enabled?: boolean;
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  enabled = true,
}: SwipeOptions) {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartX.current === null || touchEndX.current === null) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > threshold;
    const isRightSwipe = distance < -threshold;

    // Only trigger if swipe started from edge (within 30px of screen edge)
    const startedFromLeftEdge = touchStartX.current < 30;
    const startedFromRightEdge = touchStartX.current > window.innerWidth - 30;

    if (isLeftSwipe && startedFromRightEdge && onSwipeLeft) {
      onSwipeLeft();
    }

    if (isRightSwipe && startedFromLeftEdge && onSwipeRight) {
      onSwipeRight();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  }, [onSwipeLeft, onSwipeRight, threshold]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);
}
