import { SystemSetting } from '../models/index.js';

let cache = null;
let cachedAt = 0;
const TTL_MS = 15_000;

export async function getSettings() {
  if (cache && Date.now() - cachedAt < TTL_MS) return cache;
  cache = (await SystemSetting.getMain()).toObject();
  cachedAt = Date.now();
  return cache;
}

export function invalidateSettingsCache() {
  cache = null;
}
