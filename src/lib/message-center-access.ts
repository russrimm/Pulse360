import {
  parseTenantPublicMode,
  resolveTenantAccess,
  type TenantAccess,
  type TenantAccessContext,
  type TenantPublicMode,
} from './tenant-access';

export type MessageCenterAccess = TenantAccess;
export type MessageCenterPublicMode = TenantPublicMode;

/** Message Center specific names for the shared tenant-access decision. */
export const parseMessageCenterPublicMode: (value: string | undefined) => MessageCenterPublicMode =
  parseTenantPublicMode;
export const resolveMessageCenterAccess: (context: TenantAccessContext) => MessageCenterAccess =
  resolveTenantAccess;
