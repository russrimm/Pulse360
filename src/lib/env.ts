import { z } from 'zod';

/**
 * Validated view of the environment variables Pulse 360 reads. Every variable
 * is optional because the app degrades gracefully without them; the schema
 * checks shape (UUIDs, URLs, minimum secret length) and treats blank values as
 * unset so `.env` placeholders do not count as configuration.
 *
 * Existing modules still read `process.env` directly; new features should use
 * `getEnv()`.
 */

const blankToUndefined = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalString = z.preprocess(blankToUndefined, z.string().trim().optional());
const optionalUuid = z.preprocess(blankToUndefined, z.guid().optional());
const optionalSecret = z.preprocess(blankToUndefined, z.string().min(16).optional());

// AZURE_API_URL may be a bare hostname; graph-token.ts adds the https:// prefix.
const optionalApiUrl = z.preprocess(
  blankToUndefined,
  z
    .string()
    .trim()
    .refine(
      value => {
        try {
          const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
          return url.protocol === 'https:' || url.protocol === 'http:';
        } catch {
          return false;
        }
      },
      { message: 'must be a http(s) URL or hostname' }
    )
    .optional()
);

const optionalHttpUrl = z.preprocess(blankToUndefined, z.string().trim().url().optional());

const optionalPostgresUrl = z.preprocess(
  blankToUndefined,
  z
    .string()
    .trim()
    .refine(value => /^postgres(ql)?:\/\//i.test(value), {
      message: 'must be a postgres:// or postgresql:// connection string',
    })
    .optional()
);

const envSchema = z.object({
  AZURE_API_URL: optionalApiUrl,
  AZURE_CLIENT_ID: optionalUuid,
  AZURE_TENANT_ID: optionalUuid,
  AZURE_CLIENT_SECRET: optionalString,
  DATABASE_URL: optionalPostgresUrl,
  NEXTAUTH_URL: optionalHttpUrl,
  NEXTAUTH_SECRET: optionalSecret,
  AUTH_AZURE_AD_CLIENT_ID: optionalUuid,
  AUTH_AZURE_AD_TENANT_ID: optionalUuid,
  AUTH_AZURE_AD_CLIENT_SECRET: optionalString,
  // Parsed leniently by parseTenantPublicMode; anything but true/false is "unset".
  MESSAGE_CENTER_PUBLIC: optionalString,
  CRON_SECRET: optionalSecret,
});

export type Env = z.infer<typeof envSchema>;

export class EnvValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid environment configuration:\n${issues.map(issue => `- ${issue}`).join('\n')}`);
    this.name = 'EnvValidationError';
    this.issues = issues;
  }
}

/** Validate an environment record. Messages name variables, never values. */
export function parseEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = envSchema.safeParse(source);
  if (result.success) return result.data;

  throw new EnvValidationError(
    result.error.issues.map(issue => `${issue.path.join('.') || 'env'}: ${issue.message}`)
  );
}

let cachedEnv: Env | undefined;

/** Validated `process.env`, parsed once per process. */
export function getEnv(): Env {
  cachedEnv ??= parseEnv();
  return cachedEnv;
}

/** Test hook: forget the cached parse. */
export function resetEnvCache(): void {
  cachedEnv = undefined;
}
