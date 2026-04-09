/**
 * Typed environment exports with defensive parsing.
 * Keeps the rest of the codebase clean of process.env access.
 */

function optional(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

function withDefault(name: string, fallback: string): string {
  return optional(name) ?? fallback;
}

export const env = {
  NODE_ENV: withDefault('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  DATABASE_URL: optional('DATABASE_URL') ?? '',
  NEXTAUTH_URL: withDefault('NEXTAUTH_URL', 'http://localhost:3003'),
  NEXTAUTH_SECRET: optional('NEXTAUTH_SECRET') ?? optional('AUTH_SECRET') ?? '',
  AUTH_SECRET: optional('AUTH_SECRET') ?? optional('NEXTAUTH_SECRET') ?? '',
  AUTH_TRUST_HOST: withDefault('AUTH_TRUST_HOST', 'true') === 'true',
  APEX_DOMAIN: withDefault('APEX_DOMAIN', 'maybetomorrow.store'),
  PLATFORM_NAME: withDefault('PLATFORM_NAME', 'MaybeTomorrow.store'),
  PLATFORM_MARGIN_PCT: Number(withDefault('PLATFORM_MARGIN_PCT', '10')),
  CLAURICE_WHATSAPP_PHONE: optional('CLAURICE_WHATSAPP_PHONE') ?? '',
  ANTHROPIC_API_KEY: optional('ANTHROPIC_API_KEY') ?? '',
  PUBLIC_UPLOAD_URL: withDefault('PUBLIC_UPLOAD_URL', '/uploads'),
} as const;

export const isDev = env.NODE_ENV !== 'production';
export const isProd = env.NODE_ENV === 'production';
