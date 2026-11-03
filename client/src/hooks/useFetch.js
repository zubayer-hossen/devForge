import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../utils/errors';

// fn(): প্রমিস রিটার্ন করবে; deps বদলালে আবার লোড হয়। দ্রুত deps বদলালে পুরনো ফলাফল উপেক্ষিত হয়।
export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: '' }));
    fnRef.current()
      .then((data) => alive && setState({ data, loading: false, error: '' }))
      .catch((e) => alive && setState((s) => ({ ...s, loading: false, error: getErrorMessage(e) })));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
