import { AuthSession } from '@/database/entities/auth-session.entity';

export function toAuthSessionResponse(
  session: AuthSession,
  currentSessionId: number,
) {
  return {
    id: session.id,
    createdAt: session.createdAt,
    lastUsedAt: session.lastUsedAt,
    expiresAt: session.expiresAt,
    isCurrent: session.id === currentSessionId,
  };
}
