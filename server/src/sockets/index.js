import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { ACCOUNT_STATUS } from '../constants/index.js';
import { ACCESS_COOKIE, verifyAccessToken } from '../utils/jwt.js';
import { parseCookieHeader } from '../utils/cookies.js';
import { setIo } from './emitter.js';

export function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
    serveClient: false,
  });

  // শুধু লগইন করা, অনুমোদিত ব্যবহারকারী সংযুক্ত হতে পারে; প্রত্যেকে কেবল নিজের "রুমে" বার্তা পায়
  io.use(async (socket, next) => {
    try {
      const token = parseCookieHeader(socket.handshake.headers.cookie)[ACCESS_COOKIE];
      if (!token) return next(new Error('unauthorized'));
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub).select('status');
      if (!user || user.status !== ACCOUNT_STATUS.APPROVED) return next(new Error('unauthorized'));
      socket.data.userId = String(user._id);
      return next();
    } catch {
      return next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => { socket.join(`user:${socket.data.userId}`); });
  setIo(io);
  return io;
}
