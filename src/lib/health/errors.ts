/**
 * Failure modes for health providers, with user-facing copy that says what to
 * do next. Messages never echo upstream response bodies.
 */

export type HealthErrorKind =
  | 'not-configured'
  | 'forbidden'
  | 'throttled'
  | 'quota'
  | 'not-found'
  | 'unavailable';

export class HealthError extends Error {
  readonly kind: HealthErrorKind;
  readonly status?: number;

  constructor(kind: HealthErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'HealthError';
    this.kind = kind;
    this.status = status;
  }
}

export interface HealthErrorCopy {
  title: string;
  body: string;
  tone: 'warn' | 'neutral';
  showRetry: boolean;
}

export const GRAPH_HEALTH_PERMISSION = 'ServiceHealth.Read.All';

export function describeHealthError(kind: HealthErrorKind): HealthErrorCopy {
  switch (kind) {
    case 'not-configured':
      return {
        title: 'Microsoft 365 Service Health is not configured',
        body: 'Set AZURE_CLIENT_ID, AZURE_TENANT_ID and AZURE_CLIENT_SECRET, or point AZURE_API_URL at your API Management gateway, then restart. See .env.example.',
        tone: 'neutral',
        showRetry: false,
      };
    case 'forbidden':
      return {
        title: 'Microsoft Graph denied access to Service Health',
        body: `The Entra app registration needs the ${GRAPH_HEALTH_PERMISSION} Microsoft Graph application permission, and a tenant admin must grant admin consent for it. ServiceMessage.Read.All alone is not enough.`,
        tone: 'warn',
        showRetry: true,
      };
    case 'throttled':
      return {
        title: 'Microsoft Graph is throttling requests',
        body: 'Service Health requests are being rate limited. Wait a minute and try again.',
        tone: 'warn',
        showRetry: true,
      };
    case 'quota':
      return {
        title: 'The daily Service Health refresh limit was reached',
        body: 'To protect Microsoft Graph from throttling, live refreshes are capped per day. The limit resets at 00:00 UTC.',
        tone: 'warn',
        showRetry: false,
      };
    case 'not-found':
      return {
        title: 'This service health issue could not be found',
        body: 'It may be older than the history Microsoft Graph keeps for your tenant.',
        tone: 'neutral',
        showRetry: false,
      };
    case 'unavailable':
      return {
        title: 'Microsoft 365 Service Health is temporarily unavailable',
        body: 'We could not reach Microsoft Graph. Current status is unknown until it responds. Try again in a few moments.',
        tone: 'warn',
        showRetry: true,
      };
  }
}

export function toHealthError(error: unknown): HealthError {
  return error instanceof HealthError
    ? error
    : new HealthError('unavailable', error instanceof Error ? error.message : 'Unknown error');
}
