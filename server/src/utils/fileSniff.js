import path from 'node:path';

// ক্লায়েন্ট যে MIME টাইপ ঘোষণা করে তা সহজেই জাল করা যায়, তাই ফাইলের আসল শুরুর বাইট (signature) যাচাই করা হয়।
const ascii = (b, from, to) => b.subarray(from, to).toString('latin1');

const SIGNATURES = {
  'image/jpeg': (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/gif': (b) => b.length > 6 && ['GIF87a', 'GIF89a'].includes(ascii(b, 0, 6)),
  'image/webp': (b) => b.length > 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP',
  'application/pdf': (b) => b.length > 5 && ascii(b, 0, 5) === '%PDF-',
  'application/zip': (b) => b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && ((b[2] === 3 && b[3] === 4) || (b[2] === 5 && b[3] === 6)),
  'text/plain': (b) => b.length > 0 && !b.includes(0),
  'application/json': (b) => { try { JSON.parse(b.toString('utf8')); return true; } catch { return false; } },
};

export const EXTENSIONS = {
  'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/gif': ['.gif'], 'image/webp': ['.webp'],
  'application/pdf': ['.pdf'], 'application/zip': ['.zip'], 'text/plain': ['.txt'], 'application/json': ['.json'],
};

export const matchesSignature = (mime, buffer) => {
  const check = SIGNATURES[mime];
  return Boolean(check && Buffer.isBuffer(buffer) && check(buffer));
};

export const extensionAllowed = (mime, filename) =>
  (EXTENSIONS[mime] || []).includes(path.extname(String(filename || '')).toLowerCase());
