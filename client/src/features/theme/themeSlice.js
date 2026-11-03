import { createSlice } from '@reduxjs/toolkit';

const stored = () => { try { return localStorage.getItem('df_theme'); } catch { return null; } };

const slice = createSlice({
  name: 'theme',
  initialState: { mode: stored() === 'light' ? 'light' : 'dark' },
  reducers: {
    toggleTheme(state) { state.mode = state.mode === 'dark' ? 'light' : 'dark'; },
    // অ্যাডমিনের ডিফল্ট থিম: শুধু যখন ব্যবহারকারী নিজে কখনো থিম বেছে নেননি
    applyDefaultTheme(state, { payload }) {
      if (stored()) return;
      if (payload === 'light' || payload === 'dark') state.mode = payload;
      else if (payload === 'system') state.mode = window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    },
  },
});

export const { toggleTheme, applyDefaultTheme } = slice.actions;
export default slice.reducer;
