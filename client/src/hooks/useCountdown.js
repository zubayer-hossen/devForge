import { useCallback, useEffect, useState } from 'react';

// রিসেন্ড বাটনের কুলডাউন টাইমার
export function useCountdown(initial = 0) {
  const [seconds, setSeconds] = useState(initial);
  useEffect(() => {
    if (seconds <= 0) return undefined;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);
  const start = useCallback((s) => setSeconds(s), []);
  return [seconds, start];
}
