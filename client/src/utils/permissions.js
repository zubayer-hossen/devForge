// সার্ভারের নিয়মের প্রতিচ্ছবি: শুধু বাটন দেখানো/লুকানোর জন্য। আসল নিয়ন্ত্রণ সবসময় সার্ভারে।
export function canManageUser(actor, target) {
  if (!actor || !target || actor._id === target._id) return false;
  if (target.role === 'SUPER_ADMIN') return false;
  if (actor.role === 'SUPER_ADMIN') return true;
  if (actor.role === 'ADMIN') return target.role === 'MEMBER' || target.role === 'MODERATOR';
  return false;
}
export const canChangeRole = (actor, target) =>
  actor?.role === 'SUPER_ADMIN' && target && actor._id !== target._id && target.role !== 'SUPER_ADMIN';
