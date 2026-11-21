"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Distance from the bottom, in pixels, that still counts as "at the bottom". */
const THRESHOLD = 80;

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Keeps a scrollable region pinned to its latest content, the way chat
 * applications do, without fighting the user:
 *
 * - while the user is at the bottom, new content scrolls into view;
 * - once the user scrolls up, the position is left alone and `atBottom`
 *   becomes false so the screen can offer a "jump to latest" control.
 *
 * @param contentKey changes whenever the content grows (for example, the
 *   number of messages).
 * @param active false while there is nothing to follow (an empty conversation
 *   starts at the top, like any other page).
 */
export function useStickToBottom<T extends HTMLElement>(contentKey: unknown, active = true) {
  const ref = useRef<T>(null);
  const pinned = useRef(true);
  const [atBottom, setAtBottom] = useState(true);

  const onScroll = useCallback(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
    pinned.current = distance < THRESHOLD;
    setAtBottom(pinned.current);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    const element = ref.current;

    if (!element) {
      return;
    }

    pinned.current = true;
    setAtBottom(true);
    element.scrollTo({
      top: element.scrollHeight,
      behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    if (active && pinned.current) {
      scrollToBottom(false);
    }
  }, [active, contentKey, scrollToBottom]);

  return { ref, atBottom, onScroll, scrollToBottom };
}
