/**
 * Static Mode Configuration
 *
 * When true, the platform runs as a static content site:
 * - No authentication (login/signup disabled)
 * - No database-dependent features
 * - Protected routes redirect to "Coming Soon" page
 * - Header shows newsletter signup instead of auth buttons
 *
 * To restore full functionality:
 * 1. Set up Supabase (see rebuild/REBUILD_GUIDE.md)
 * 2. Set STATIC_MODE = false
 * 3. Rebuild and deploy
 */
export const STATIC_MODE = true;
