import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'notifications',
  initialState: { unread: 0, latest: [] },
  reducers: {
    setSnapshot(state, { payload }) { state.unread = payload.unread; state.latest = payload.latest; },
    setUnread(state, { payload }) { state.unread = payload; },
    // সকেটে আসা নতুন নোটিফিকেশন (একই আইডি দুইবার যোগ হয় না)
    pushNotification(state, { payload }) {
      if (state.latest.some((n) => n._id === payload._id)) return;
      state.latest = [payload, ...state.latest].slice(0, 8);
      state.unread += 1;
    },
    markReadLocal(state, { payload }) {
      const n = state.latest.find((x) => x._id === payload);
      if (n) n.isRead = true;
    },
    markAllLocal(state) { state.latest.forEach((n) => { n.isRead = true; }); state.unread = 0; },
  },
});

export const { setSnapshot, setUnread, pushNotification, markReadLocal, markAllLocal } = slice.actions;
export default slice.reducer;
