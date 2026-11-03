import { api } from './client';

const data = (p) => p.then((r) => r.data.data);
const mutate = (method, url, body) => api({ method, url, data: body }).then((r) => r.data); // { message, data }

export const memberApi = {
  dashboard: () => data(api.get('/me/dashboard')),
  tasks: (params) => data(api.get('/tasks', { params })),
  task: (id) => data(api.get(`/tasks/${id}`)),
  startTask: (id) => mutate('post', `/tasks/${id}/start`),
  submissions: (params) => data(api.get('/submissions', { params })),
  submission: (id) => data(api.get(`/submissions/${id}`)),
  createSubmission: (body) => mutate('post', '/submissions', body),
  updateSubmission: (id, body) => mutate('put', `/submissions/${id}`, body),
  uploadScreenshot: (id, file) => { const f = new FormData(); f.append('file', file); return mutate('post', `/submissions/${id}/screenshots`, f); },
  uploadSubmissionFile: (id, file) => { const f = new FormData(); f.append('file', file); return mutate('post', `/submissions/${id}/files`, f); },
  removeMedia: (id, kind, publicId) => api.delete(`/submissions/${id}/media`, { params: { kind, publicId } }).then((r) => r.data),
  updateProfile: (body) => mutate('patch', '/me/profile', body),
  // FormData দিলে axios নিজেই সঠিক multipart boundary বসায়
  uploadAvatar: (file) => { const f = new FormData(); f.append('avatar', file); return mutate('post', '/me/avatar', f); },
  removeAvatar: () => mutate('delete', '/me/avatar'),
};
