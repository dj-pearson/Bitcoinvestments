/**
 * Scheduled Weekly Newsletter Sender
 *
 * This is a Cloudflare Worker that runs on a schedule to send the weekly newsletter.
 * It calls the send-newsletter API function.
 *
 * Schedule: Every Monday at 9:00 AM UTC (configurable in wrangler-newsletter.toml)
 */

interface Env {
  SUPABASE_SERVICE_ROLE_KEY: string;
  PAGES_URL: string; // Your Cloudflare Pages URL
}

export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('Running scheduled weekly newsletter send...');
    console.log('Trigger time:', new Date(event.scheduledTime).toISOString());

    try {
      const response = await fetch(`${env.PAGES_URL}/api/send-newsletter`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'X-Cloudflare-Cron': 'true',
        },
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Weekly newsletter sent successfully:', result);
      } else {
        console.error('Weekly newsletter sending failed:', result);
      }
    } catch (error) {
      console.error('Error sending weekly newsletter:', error);
    }
  },

  // Optional: Allow manual trigger via HTTP
  async fetch(request: Request, env: Env): Promise<Response> {
    // Verify auth
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Manually trigger the newsletter send
    try {
      const response = await fetch(`${env.PAGES_URL}/api/send-newsletter`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      return new Response(JSON.stringify(result), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Failed to send newsletter',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
