import path from 'node:path';
import { Resource } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { escapeRegex, paginate, parsePagination } from '../utils/pagination.js';
import { randomToken } from '../utils/crypto.js';
import { logActivity } from './activity.service.js';
import { uploadBuffer, deleteAsset } from './upload.service.js';

const isImage = (m) => Boolean(m?.startsWith('image/'));

async function storeFile(file) {
  const image = isImage(file.mimetype);
  const ext = path.extname(file.originalname).toLowerCase();
  const up = await uploadBuffer(file.buffer, {
    folder: 'devforge/resources', publicId: `${randomToken(8)}${image ? '' : ext}`, image,
  });
  return {
    name: file.originalname.replace(/[\u0000-\u001f]/g, '').slice(0, 120),
    url: up.url, publicId: up.publicId, size: file.size, mimeType: file.mimetype,
  };
}

export async function listResources(q) {
  const filter = {};
  if (q.type) filter.type = q.type;
  if (q.category) filter.category = q.category;
  if (q.tag) filter.tags = q.tag;
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    filter.$or = [{ title: rx }, { description: rx }, { tags: rx }];
  }
  return paginate(Resource, filter, parsePagination(q, { defaultLimit: 12 }), { sort: '-pinned -createdAt' });
}

export async function resourceMeta() {
  const [categories, tags] = await Promise.all([
    Resource.distinct('category', { category: { $ne: '' } }),
    Resource.aggregate([{ $unwind: '$tags' }, { $group: { _id: '$tags', n: { $sum: 1 } } }, { $sort: { n: -1, _id: 1 } }, { $limit: 30 }]),
  ]);
  return { categories: categories.sort((a, b) => a.localeCompare(b)), tags: tags.map((t) => t._id) };
}

export async function createResource(data, file, actor, req) {
  if (!data.url && !file) throw AppError.badRequest('একটি লিংক দিন অথবা ফাইল আপলোড করুন');
  const { removeFile, ...fields } = data; // eslint-disable-line no-unused-vars
  const stored = file ? await storeFile(file) : undefined;
  const resource = await Resource.create({ ...fields, url: fields.url || undefined, file: stored, createdBy: actor._id });
  await logActivity({ actor: actor._id, action: 'RESOURCE_CREATED', targetType: 'Resource', targetId: resource._id, metadata: { title: resource.title }, req, isAudit: true });
  return resource.toObject();
}

export async function updateResource(id, data, file, actor, req) {
  const resource = await Resource.findById(id);
  if (!resource) throw AppError.notFound('রিসোর্স পাওয়া যায়নি');
  const { removeFile, ...fields } = data;

  const willHaveFile = file || (resource.file?.url && !removeFile);
  if (!fields.url && !willHaveFile) throw AppError.badRequest('একটি লিংক দিন অথবা ফাইল রাখুন');

  const oldFile = resource.file?.publicId ? resource.file : null;
  if (file) resource.file = await storeFile(file);
  else if (removeFile) resource.file = undefined;

  resource.set({ ...fields, url: fields.url || undefined });
  await resource.save();
  // নতুন সংরক্ষণ সফল হওয়ার পরই পুরনো ফাইল মুছি (মাঝপথে ব্যর্থ হলে ফাইল হারায় না)
  if (oldFile && (file || removeFile)) await deleteAsset(oldFile.publicId, isImage(oldFile.mimeType));
  await logActivity({ actor: actor._id, action: 'RESOURCE_UPDATED', targetType: 'Resource', targetId: resource._id, metadata: { title: resource.title }, req, isAudit: true });
  return resource.toObject();
}

export async function deleteResource(id, actor, req) {
  const resource = await Resource.findById(id);
  if (!resource) throw AppError.notFound('রিসোর্স পাওয়া যায়নি');
  if (resource.file?.publicId) await deleteAsset(resource.file.publicId, isImage(resource.file.mimeType));
  await Resource.deleteOne({ _id: id });
  await logActivity({ actor: actor._id, action: 'RESOURCE_DELETED', metadata: { title: resource.title }, req, isAudit: true });
}
