// Cloudflare Pages Function: send a transactional email.
//
// SECURITY: this endpoint used to send any HTML to any address with no
// credentials at all - an open relay on our own domain. A caller must now be
// either a scheduled worker (bearer secret) or a signed-in Supabase user, and a
// signed-in user may only email their own address unless their profile role is
// admin/super_admin (support replies, advertiser invoices).

import {
  parseAndValidateBody,
  validateEmailContent,
  sanitizeString,
  jsonError,
  jsonSuccess,
} from '../lib/validation';
import { sendMail, type MailerEnv } from '../lib/mailer';
import { handleCorsPreflightRequest } from './_cors';
import { isAuthorizedScheduledRequest } from './_scheduledAuth';

interface Env extends MailerEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

type EmailRequest = {
  to: string;
  subject: string;
  html: string;
};

interface SupabaseUser {
  id: string;
  email?: string;
}

/** Resolve the Supabase user behind the request's bearer token, if any. */
async function getRequestUser(request: Request, env: Env): Promise<SupabaseUser | null> {
  const header = request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ') || !env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    return null;
  }
  const response = await fetch(`${env.VITE_SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: header },
  });
  if (!response.ok) return null;
  const user = (await response.json()) as SupabaseUser;
  return user?.id ? user : null;
}

async function isAdmin(userId: string, env: Env): Promise<boolean> {
  if (!env.VITE_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return false;
  const response = await fetch(
    `${env.VITE_SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(userId)}&select=role`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  if (!response.ok) return false;
  const rows = (await response.json()) as Array<{ role?: string }>;
  return rows[0]?.role === 'admin' || rows[0]?.role === 'super_admin';
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const { data: body, error: parseError } = await parseAndValidateBody<EmailRequest>(
      request,
      ['to', 'subject', 'html']
    );

    if (parseError || !body) {
      return jsonError(parseError || 'Invalid request body', 400);
    }

    const { to, subject, html } = body;

    const contentValidation = validateEmailContent({ to, subject, html });
    if (!contentValidation.isValid) {
      return jsonError(contentValidation.error || 'Invalid email content', 400);
    }

    if (!isAuthorizedScheduledRequest(request, env.SUPABASE_SERVICE_ROLE_KEY)) {
      const user = await getRequestUser(request, env);
      if (!user) {
        return jsonError('Unauthorized', 401);
      }
      const ownAddress = user.email?.trim().toLowerCase() === to.trim().toLowerCase();
      if (!ownAddress && !(await isAdmin(user.id, env))) {
        return jsonError('Forbidden', 403);
      }
    }

    const result = await sendMail(env, { to, subject: sanitizeString(subject), html });
    if (!result.ok) {
      return jsonError(result.error, 502);
    }

    return jsonSuccess({ success: true }, 200);
  } catch (error) {
    console.error('Email send error:', error);
    return jsonError('Failed to send email', 500);
  }
}

// Handle OPTIONS for CORS preflight - uses secure origin validation
export async function onRequestOptions(context: { request: Request }) {
  return handleCorsPreflightRequest(context.request);
}
