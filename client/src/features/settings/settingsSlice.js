import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { publicApi } from '../../api/authApi';

export const fetchPublicSettings = createAsyncThunk('settings/fetch', async (_, { rejectWithValue }) => {
  try { return await publicApi.settings(); } catch { return rejectWithValue(null); }
});

const slice = createSlice({
  name: 'settings',
  initialState: {
    loaded: false,
    data: {
      siteName: 'DevForge', siteDescription: 'Learn Together. Build Together. Grow Together.',
      logo: null, registrationOpen: true, maintenanceMode: false, communityRules: '',
    },
  },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchPublicSettings.fulfilled, (s, a) => { s.data = { ...s.data, ...a.payload }; s.loaded = true; })
      .addCase(fetchPublicSettings.rejected, (s) => { s.loaded = true; });
  },
});

export default slice.reducer;
