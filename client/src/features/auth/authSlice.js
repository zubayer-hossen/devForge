import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authApi } from '../../api/authApi';
import { getErrorCode, getErrorDetails, getErrorMessage } from '../../utils/errors';

// unwrap() সিরিয়ালাইজড এরর দেয়, তাই সার্ভারের কোড/বিবরণ আমরা নিজেরাই payload-এ রাখি
const pack = (err) => ({ message: getErrorMessage(err), code: getErrorCode(err), details: getErrorDetails(err) });

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try { return await authApi.me(); } catch { return rejectWithValue(null); }
});

export const loginThunk = createAsyncThunk('auth/login', async (body, { dispatch, rejectWithValue }) => {
  try {
    const { user } = await authApi.login(body);
    await dispatch(fetchMe()); // আবেদনের অবস্থাসহ পূর্ণ তথ্য
    return user;
  } catch (err) {
    return rejectWithValue(pack(err));
  }
});

export const verifyEmailThunk = createAsyncThunk('auth/verifyEmail', async (body, { dispatch, rejectWithValue }) => {
  try {
    const { user } = await authApi.verifyEmail(body);
    await dispatch(fetchMe());
    return user;
  } catch (err) {
    return rejectWithValue(pack(err));
  }
});

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  try { await authApi.logout(); } catch { /* সেশন যেভাবেই হোক ক্লায়েন্টে মুছে যাবে */ }
});

const slice = createSlice({
  name: 'auth',
  initialState: { user: null, application: null, checked: false },
  reducers: {
    clearAuth(state) { state.user = null; state.application = null; },
  },
  extraReducers: (b) => {
    b.addCase(fetchMe.fulfilled, (s, a) => { s.user = a.payload.user; s.application = a.payload.application; s.checked = true; })
      .addCase(fetchMe.rejected, (s) => { s.user = null; s.application = null; s.checked = true; })
      .addCase(logoutThunk.fulfilled, (s) => { s.user = null; s.application = null; });
  },
});

export const { clearAuth } = slice.actions;
export default slice.reducer;
