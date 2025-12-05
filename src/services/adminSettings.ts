/**
 * Admin Settings Service
 * Handles admin settings operations including AI model configuration
 */

import { supabase } from '../lib/supabase';
import type { Json } from '../types/database';
import type {
  AdminSetting,
  AIModelSettings,
} from '../types/admin-database';
import { DEFAULT_AI_SETTINGS } from '../types/admin-database';
import { logAdminAction } from './admin';

const AI_SETTINGS_KEY = 'ai_model_config';
const AI_SETTINGS_CATEGORY = 'ai';

/**
 * Get AI model settings
 */
export async function getAIModelSettings(): Promise<{
  settings: AIModelSettings;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('admin_settings')
    .select('*')
    .eq('key', AI_SETTINGS_KEY)
    .single();

  if (error) {
    // If not found, return default settings
    if (error.code === 'PGRST116') {
      return { settings: DEFAULT_AI_SETTINGS, error: null };
    }
    console.error('Error fetching AI settings:', error);
    return { settings: DEFAULT_AI_SETTINGS, error: error.message };
  }

  return {
    settings: {
      ...DEFAULT_AI_SETTINGS,
      ...(data?.value as unknown as AIModelSettings),
    },
    error: null,
  };
}

/**
 * Update AI model settings
 */
export async function updateAIModelSettings(
  settings: Partial<AIModelSettings>,
  adminId: string
): Promise<{ success: boolean; error: string | null }> {
  // First get existing settings
  const { settings: existingSettings } = await getAIModelSettings();

  const updatedSettings: AIModelSettings = {
    ...existingSettings,
    ...settings,
  };

  // Check if settings exist
  const { data: existing } = await supabase
    .from('admin_settings')
    .select('id')
    .eq('key', AI_SETTINGS_KEY)
    .single();

  let error;

  // Convert settings to JSON-compatible format
  const settingsJson = JSON.parse(JSON.stringify(updatedSettings)) as Json;

  if (existing) {
    // Update existing
    const result = await supabase
      .from('admin_settings')
      .update({
        value: settingsJson,
        updated_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('key', AI_SETTINGS_KEY);
    error = result.error;
  } else {
    // Insert new
    const result = await supabase.from('admin_settings').insert({
      key: AI_SETTINGS_KEY,
      value: settingsJson,
      category: AI_SETTINGS_CATEGORY,
      description: 'AI model configuration for Claude API integration',
      updated_by: adminId,
    });
    error = result.error;
  }

  if (error) {
    console.error('Error updating AI settings:', error);
    return { success: false, error: error.message };
  }

  // Log the action
  await logAdminAction({
    admin_id: adminId,
    action: 'settings.ai_update',
    target_type: 'settings',
    target_id: AI_SETTINGS_KEY,
    details: {
      defaultModel: updatedSettings.defaultModel,
      lightweightModel: updatedSettings.lightweightModel,
    },
  });

  return { success: true, error: null };
}

/**
 * Test Claude API connection
 */
export async function testClaudeAPI(modelId: string): Promise<{
  success: boolean;
  response: string | null;
  error: string | null;
  latency: number;
}> {
  const startTime = Date.now();

  try {
    const response = await fetch('/api/test-claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ modelId }),
    });

    const latency = Date.now() - startTime;
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        response: null,
        error: data.error || 'API test failed',
        latency,
      };
    }

    return {
      success: true,
      response: data.response,
      error: null,
      latency,
    };
  } catch (error) {
    return {
      success: false,
      response: null,
      error: error instanceof Error ? error.message : 'Network error',
      latency: Date.now() - startTime,
    };
  }
}

/**
 * Mark settings as tested
 */
export async function markSettingsAsTested(
  adminId: string
): Promise<{ success: boolean; error: string | null }> {
  return updateAIModelSettings(
    {
      lastTested: new Date().toISOString(),
      lastTestedBy: adminId,
      isConfigured: true,
    },
    adminId
  );
}

/**
 * Get a specific admin setting by key
 */
export async function getAdminSetting(key: string): Promise<{
  setting: AdminSetting | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('admin_settings')
    .select('*')
    .eq('key', key)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { setting: null, error: null };
    }
    return { setting: null, error: error.message };
  }

  return { setting: data as AdminSetting, error: null };
}

/**
 * Get all admin settings by category
 */
export async function getSettingsByCategory(category: string): Promise<{
  settings: AdminSetting[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('admin_settings')
    .select('*')
    .eq('category', category)
    .order('key');

  if (error) {
    return { settings: [], error: error.message };
  }

  return { settings: data as AdminSetting[], error: null };
}

/**
 * Delete an admin setting
 */
export async function deleteAdminSetting(
  key: string,
  adminId: string
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from('admin_settings')
    .delete()
    .eq('key', key);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAdminAction({
    admin_id: adminId,
    action: 'settings.delete',
    target_type: 'settings',
    target_id: key,
  });

  return { success: true, error: null };
}
