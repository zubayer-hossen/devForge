import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { authApi } from "../../api/authApi";
import {
  getErrorCode,
  getErrorDetails,
  getErrorMessage,
} from "../../utils/errors";

// unwrap() সিরিয়ালাইজড এরর দেয়, তাই সার্ভারের কোড/বিবরণ আমরা নিজেরাই payload-এ রাখি
const pack = (err) => ({
  message: getErrorMessage(err),
  code: getErrorCode(err),
  details: getErrorDetails(err),
});

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      return await authApi.me();
    } catch {
      return rejectWithValue(null);
    }
  },
);

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (body, { dispatch, rejectWithValue }) => {
    try {
      // প্রথমে credentials যাচাই করে সার্ভার থেকে HttpOnly session cookies সেট করাই।
      await authApi.login(body);

      // Login response সফল হলেই UI-তে ঢোকা যাবে না; cookie কাজ করছে কি না
      // /auth/me দিয়ে নিশ্চিত হয়ে তারপর authenticated user ফেরত দিতে হবে।
      const session = await dispatch(fetchMe()).unwrap();

      if (!session?.user) {
        throw new Error("লগইন সেশন তৈরি হয়নি। আবার চেষ্টা করুন।");
      }

      return session.user;
    } catch (err) {
      return rejectWithValue(pack(err));
    }
  },
);

export const verifyEmailThunk = createAsyncThunk(
  "auth/verifyEmail",
  async (body, { dispatch, rejectWithValue }) => {
    try {
      const { user } = await authApi.verifyEmail(body);
      await dispatch(fetchMe()).unwrap();
      return user;
    } catch (err) {
      return rejectWithValue(pack(err));
    }
  },
);

export const logoutThunk = createAsyncThunk("auth/logout", async () => {
  try {
    await authApi.logout();
  } catch {
    // সেশন যেভাবেই হোক ক্লায়েন্টে মুছে যাবে
  }
});

const slice = createSlice({
  name: "auth",
  initialState: { user: null, application: null, checked: false },
  reducers: {
    clearAuth(state) {
      state.user = null;
      state.application = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchMe.fulfilled, (s, a) => {
      s.user = a.payload.user;
      s.application = a.payload.application;
      s.checked = true;
    })
      .addCase(fetchMe.rejected, (s) => {
        s.user = null;
        s.application = null;
        s.checked = true;
      })
      .addCase(logoutThunk.fulfilled, (s) => {
        s.user = null;
        s.application = null;
      });
  },
});

export const { clearAuth } = slice.actions;
export default slice.reducer;
