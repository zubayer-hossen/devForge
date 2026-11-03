import { api } from './client';

const data = (p) => p.then((r) => r.data.data);

// রিসোর্স ও ঘোষণা পড়ার API: অনুমোদিত সব ব্যবহারকারীর জন্য (সদস্য ও অ্যাডমিন)
export const libraryApi = {
  resources: (params) => data(api.get('/resources', { params })),
  resourceMeta: () => data(api.get('/resources/meta')),
  announcements: (params) => data(api.get('/announcements', { params })),
};
