// ব্যবহারকারী ব্যবস্থাপনার অনুমতির নিয়ম (কোনো বাইরের নির্ভরতা নেই, তাই সহজে টেস্টযোগ্য)
const sameId = (a, b) => String(a._id ?? a) === String(b._id ?? b);

// ADMIN শুধু MEMBER ও MODERATOR-কে ম্যানেজ করতে পারে; SUPER_ADMIN কে কেউই (নিজেও নয়) ম্যানেজ করতে পারে না
export function canManageUser(actor, target) {
  if (!actor || !target) return false;
  if (sameId(actor, target)) return false;
  if (target.role === 'SUPER_ADMIN') return false;
  if (actor.role === 'SUPER_ADMIN') return true;
  if (actor.role === 'ADMIN') return target.role === 'MEMBER' || target.role === 'MODERATOR';
  return false;
}

// শুধু SUPER_ADMIN রোল বদলাতে পারে; SUPER_ADMIN রোল কাউকে দেওয়া যায় না
export function canChangeRole(actor, target, newRole) {
  if (!actor || !target) return false;
  if (actor.role !== 'SUPER_ADMIN') return false;
  if (sameId(actor, target)) return false;
  if (target.role === 'SUPER_ADMIN') return false;
  return ['ADMIN', 'MODERATOR', 'MEMBER'].includes(newRole);
}
