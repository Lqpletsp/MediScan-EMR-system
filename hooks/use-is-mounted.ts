
"use client";

import { useState, useEffect } from 'react';

/**
 * Custom hook to determine if a component is mounted on the client.
 * This is useful for preventing hydration errors by ensuring that
 * components relying on client-side state or APIs only render
 * after the initial server render.
 *
 * @returns {boolean} - True if the component is mounted, false otherwise.
 */
export function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}
