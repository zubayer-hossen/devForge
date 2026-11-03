import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../features/theme/themeSlice';

// শুধু বর্তমান মোড পেজে প্রয়োগ করে; পছন্দ সংরক্ষণ হয় কেবল ব্যবহারকারী নিজে বদলালে
export function useThemeEffect() {
  const mode = useSelector((s) => s.theme.mode);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'dark' ? '#0b1020' : '#f8fafc');
  }, [mode]);
}

export function useTheme() {
  const dispatch = useDispatch();
  const mode = useSelector((s) => s.theme.mode);
  const toggle = () => {
    try { localStorage.setItem('df_theme', mode === 'dark' ? 'light' : 'dark'); } catch { /* স্টোরেজ বন্ধ থাকলেও ঠিক আছে */ }
    dispatch(toggleTheme());
  };
  return { mode, toggle };
}
