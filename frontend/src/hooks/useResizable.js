// src/hooks/useResizable.js
import { useState, useEffect, useCallback, useRef } from 'react';

export function useResizable({ min = 200, max = 500, defaultWidth = 280, storageKey }) {
  const [width, setWidth] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) return Number(saved);
    }
    return defaultWidth;
  });
  const isDragging = useRef(false);

  const startDragging = useCallback(() => {
    isDragging.current = true;
  }, []);

  useEffect(() => {
    function handleMouseMove(e) {
      if (!isDragging.current) return;
      const newWidth = Math.min(max, Math.max(min, e.clientX));
      setWidth(newWidth);
    }

    function handleMouseUp() {
      if (isDragging.current) {
        isDragging.current = false;
        if (storageKey) localStorage.setItem(storageKey, width.toString());
      }
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [min, max, width, storageKey]);

  return { width, startDragging };
}