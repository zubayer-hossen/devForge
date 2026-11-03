export const ok = (res, data = null, message = 'সফল হয়েছে', status = 200) =>
  res.status(status).json({ success: true, message, data });
