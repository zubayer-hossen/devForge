export const STATUS = {
  EMAIL_UNVERIFIED: 'EMAIL_UNVERIFIED',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  WAITLISTED: 'WAITLISTED',
  SUSPENDED: 'SUSPENDED',
};

export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

export const PATHS = {
  home: '/',
  about: '/about',
  howItWorks: '/how-it-works',
  rules: '/rules',
  privacy: '/privacy',
  terms: '/terms',
  register: '/register',
  login: '/login',
  verifyEmail: '/verify-email',
  pending: '/pending',
  rejected: '/rejected',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  maintenance: '/maintenance',
  dashboard: '/dashboard',
  admin: '/admin',
};

export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

export const TASK_CATEGORIES = [
  'HTML', 'CSS', 'JavaScript', 'React', 'Redux', 'Node.js', 'Express.js', 'MongoDB', 'MERN Stack',
  'Git and GitHub', 'UI/UX Implementation', 'Full Stack Projects', 'Problem Solving', 'Other',
];

export const RESOURCE_TYPES = [
  'FIGMA', 'GITHUB', 'GOOGLE_DRIVE', 'GOOGLE_DOCS', 'PDF', 'YOUTUBE', 'DOCUMENTATION', 'ROADMAP', 'CODING_CHALLENGE', 'OTHER',
];

export const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'];
export const CODE_LANGUAGES = ['javascript', 'jsx', 'typescript', 'tsx', 'html', 'css', 'json', 'bash', 'python', 'sql', 'text'];
