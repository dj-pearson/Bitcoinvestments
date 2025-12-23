/**
 * Developer API: Portfolio Management
 *
 * GET /api/v1/portfolio - Get user's portfolios
 * POST /api/v1/portfolio - Create a new portfolio
 */

import { createClient } from '@supabase/supabase-js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  const apiKey = (context as any).apiKey;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check permissions
  if (!apiKey.permissions.includes('portfolio:read')) {
    return new Response(
      JSON.stringify({
        error: 'Permission denied',
        message: 'This API key does not have portfolio:read permission',
        code: 'PERMISSION_DENIED'
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Get user's portfolios
    const { data: portfolios, error } = await supabase
      .from('portfolios')
      .select(`
        id,
        name,
        is_default,
        created_at,
        updated_at,
        holdings (
          id,
          cryptocurrency_id,
          symbol,
          name,
          amount,
          average_buy_price
        )
      `)
      .eq('user_id', apiKey.user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate total values (would need price data in production)
    const portfoliosWithValues = (portfolios || []).map(portfolio => ({
      ...portfolio,
      holdingsCount: portfolio.holdings?.length || 0,
      holdings: portfolio.holdings?.map((holding: any) => ({
        id: holding.id,
        symbol: holding.symbol,
        name: holding.name,
        amount: holding.amount,
        averageBuyPrice: holding.average_buy_price,
      })) || [],
    }));

    return new Response(
      JSON.stringify({
        portfolios: portfoliosWithValues,
        count: portfoliosWithValues.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Portfolio fetch error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch portfolios',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'FETCH_ERROR'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const apiKey = (context as any).apiKey;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check permissions
  if (!apiKey.permissions.includes('portfolio:write')) {
    return new Response(
      JSON.stringify({
        error: 'Permission denied',
        message: 'This API key does not have portfolio:write permission',
        code: 'PERMISSION_DENIED'
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json() as { name: string; isDefault?: boolean };

    if (!body.name || typeof body.name !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          message: 'Portfolio name is required',
          code: 'INVALID_REQUEST'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Create portfolio
    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .insert({
        user_id: apiKey.user_id,
        name: body.name.trim(),
        is_default: body.isDefault || false,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        portfolio: {
          id: portfolio.id,
          name: portfolio.name,
          isDefault: portfolio.is_default,
          createdAt: portfolio.created_at,
        },
        message: 'Portfolio created successfully',
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Portfolio create error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to create portfolio',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'CREATE_ERROR'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
