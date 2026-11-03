import { Router } from 'express';
import * as c from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { authLimiter, otpLimiter } from '../middlewares/rateLimiters.js';
import {
  registerSchema, verifyEmailSchema, resendOtpSchema, loginSchema,
  forgotPasswordSchema, resetPasswordSchema, changePasswordSchema,
} from '../validators/auth.validator.js';

const r = Router();

r.post('/register', authLimiter, validate(registerSchema), c.register);
r.post('/verify-email', otpLimiter, validate(verifyEmailSchema), c.verifyEmail);
r.post('/resend-otp', otpLimiter, validate(resendOtpSchema), c.resendOtp);
r.post('/login', authLimiter, validate(loginSchema), c.login);
r.post('/refresh', c.refresh);
r.post('/logout', c.logout);
r.get('/me', authenticate, c.me);
r.post('/forgot-password', otpLimiter, validate(forgotPasswordSchema), c.forgotPassword);
r.post('/reset-password', authLimiter, validate(resetPasswordSchema), c.resetPassword);
r.post('/change-password', authenticate, authLimiter, validate(changePasswordSchema), c.changePassword);

export default r;
