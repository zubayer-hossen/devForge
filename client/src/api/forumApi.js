import { api } from './client';

const data = (p) => p.then((r) => r.data.data);
const mutate = (method, url, body) => api({ method, url, data: body }).then((r) => r.data); // { message, data }

export const forumApi = {
  tags: () => data(api.get('/forum/tags')),
  posts: (params) => data(api.get('/forum/posts', { params })),
  post: (id) => data(api.get(`/forum/posts/${id}`)),
  createPost: (body) => mutate('post', '/forum/posts', body),
  updatePost: (id, body) => mutate('put', `/forum/posts/${id}`, body),
  deletePost: (id) => mutate('delete', `/forum/posts/${id}`),
  likePost: (id) => mutate('post', `/forum/posts/${id}/like`),
  bookmarkPost: (id) => mutate('post', `/forum/posts/${id}/bookmark`),
  reportPost: (id, body) => mutate('post', `/forum/posts/${id}/report`, body),
  addComment: (id, body) => mutate('post', `/forum/posts/${id}/comments`, body),
  acceptAnswer: (id, commentId) => mutate('post', `/forum/posts/${id}/accept`, { commentId }),
  unacceptAnswer: (id) => mutate('delete', `/forum/posts/${id}/accept`),
  editComment: (id, body) => mutate('put', `/forum/comments/${id}`, body),
  deleteComment: (id) => mutate('delete', `/forum/comments/${id}`),
  likeComment: (id) => mutate('post', `/forum/comments/${id}/like`),
  reportComment: (id, body) => mutate('post', `/forum/comments/${id}/report`, body),
  hidePost: (id, hidden) => mutate('post', `/forum/posts/${id}/hide`, { hidden }),
  pinPost: (id, pinned) => mutate('post', `/forum/posts/${id}/pin`, { pinned }),
  hideComment: (id, hidden) => mutate('post', `/forum/comments/${id}/hide`, { hidden }),
  moderationQueue: (kind) => data(api.get('/forum/moderation/reports', { params: { kind } })),
  dismissReports: (kind, id) => mutate('post', `/forum/moderation/${kind}/${id}/dismiss`),
};
