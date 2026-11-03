import { api } from './client';

const data = (p) => p.then((r) => r.data.data);
const mutate = (url) => api.post(url).then((r) => r.data);

export const gamificationApi = {
  notifications: (params) => data(api.get('/notifications', { params })),
  unreadCount: () => data(api.get('/notifications/unread-count')),
  markRead: (id) => data(api.post(`/notifications/${id}/read`)),
  markAllRead: () => mutate('/notifications/read-all'),
  leaderboard: (params) => data(api.get('/leaderboard', { params })),
  progress: () => data(api.get('/me/progress')),
};
