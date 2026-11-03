import { ADMIN_ROLES, PATHS, STATUS } from '../constants';

// ব্যবহারকারীর অবস্থা অনুযায়ী তার সঠিক "ঘর" কোথায়
export function homeForUser(user) {
  if (!user) return PATHS.login;
  switch (user.status) {
    case STATUS.EMAIL_UNVERIFIED: return PATHS.verifyEmail;
    case STATUS.REJECTED: return PATHS.rejected;
    case STATUS.PENDING_APPROVAL:
    case STATUS.WAITLISTED:
    case STATUS.SUSPENDED: return PATHS.pending;
    case STATUS.APPROVED: return ADMIN_ROLES.includes(user.role) ? PATHS.admin : PATHS.dashboard;
    default: return PATHS.login;
  }
}
