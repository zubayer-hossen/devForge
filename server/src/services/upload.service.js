import cloudinary from '../config/cloudinary.js';
import { services } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function assertUploadsConfigured() {
  if (!services.cloudinary()) {
    throw new AppError('ফাইল আপলোড এখনো কনফিগার করা হয়নি (Cloudinary-র তথ্য .env-এ দিন)', 503, 'UPLOAD_NOT_CONFIGURED');
  }
}

export function uploadBuffer(buffer, { folder, publicId, image = true, transformation } = {}) {
  assertUploadsConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder, public_id: publicId, overwrite: true, invalidate: true,
        resource_type: image ? 'image' : 'raw', ...(transformation ? { transformation } : {}),
      },
      (err, res) => {
        if (err || !res) {
          console.error('Cloudinary আপলোড ত্রুটি:', err?.message);
          return reject(new AppError('ফাইল আপলোড ব্যর্থ হয়েছে, আবার চেষ্টা করুন', 502, 'UPLOAD_FAILED'));
        }
        resolve({ url: res.secure_url, publicId: res.public_id, size: res.bytes });
      }
    );
    stream.end(buffer);
  });
}

// মুছতে ব্যর্থ হলে মূল কাজ আটকায় না
export async function deleteAsset(publicId, image = true) {
  if (!publicId || !services.cloudinary()) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: image ? 'image' : 'raw', invalidate: true });
  } catch (e) {
    console.error('Cloudinary মুছতে ব্যর্থ:', e.message);
  }
}
