import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { TURNSTILE_SITE_KEY } from '../../constants';
import Alert from './Alert';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise = null;

function loadScript() {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SCRIPT_SRC; s.async = true; s.defer = true;
      s.onload = resolve;
      s.onerror = () => { scriptPromise = null; reject(new Error('turnstile load failed')); };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

// Cloudflare Turnstile: SITE KEY না থাকলে কিছুই দেখায় না (সার্ভারও তখন যাচাই বাদ দেয়)
const Turnstile = forwardRef(function Turnstile({ onToken }, ref) {
  const box = useRef(null);
  const widgetId = useRef(null);
  const onTokenRef = useRef(onToken);
  const theme = useSelector((s) => s.theme.mode);
  const [failed, setFailed] = useState(false);
  onTokenRef.current = onToken;

  useImperativeHandle(ref, () => ({
    reset() {
      onTokenRef.current(null);
      if (widgetId.current !== null && window.turnstile) window.turnstile.reset(widgetId.current);
    },
  }));

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return undefined;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !box.current) return;
        widgetId.current = window.turnstile.render(box.current, {
          sitekey: TURNSTILE_SITE_KEY, theme,
          callback: (t) => onTokenRef.current(t),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null),
        });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      onTokenRef.current(null);
      if (widgetId.current !== null && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [theme]);

  if (!TURNSTILE_SITE_KEY) return null;
  if (failed) return <Alert variant="error">বট-যাচাই লোড হয়নি। ইন্টারনেট সংযোগ দেখে পেজ রিফ্রেশ করুন।</Alert>;
  return <div ref={box} className="flex min-h-[65px] justify-center" />;
});

export default Turnstile;
