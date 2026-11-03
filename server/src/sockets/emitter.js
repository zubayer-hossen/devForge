// Socket.IO ঐচ্ছিক: চালু না থাকলে (বা সংযোগ না থাকলে) এই ফাংশনগুলো কিছু করে না, অ্যাপ স্বাভাবিক চলে।
let io = null;
export const setIo = (instance) => { io = instance; };
export function emitToUser(userId, event, payload) {
  try { io?.to(`user:${userId}`).emit(event, payload); } catch { /* রিয়েল-টাইম ব্যর্থ হলে পোলিং আছে */ }
}
