/**
 * Scheduled Price Alert Checker
 * 
 * This is a Cloudflare Worker that runs on a schedule to check price alerts.
 * It calls the check-price-alerts API function.
 * 
 * Schedule: Every 5 minutes (configurable in wrangler-cron.toml)
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
    console.log('Running scheduled price alert check...');

    try {
      const response = await fetch(`${env.PAGES_URL}/api/check-price-alerts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Price alert check completed:', result);
      } else {
        console.error('Price alert check failed:', result);
      }
    } catch (error) {
      console.error('Error running price alert check:', error);
    }
  },

  // Optional: Allow manual trigger via HTTP
  async fetch(request: Request, env: Env): Promise<Response> {
    // Verify auth
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Manually trigger the check
    try {
      const response = await fetch(`${env.PAGES_URL}/api/check-price-alerts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
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
          error: 'Failed to check price alerts',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

