/**
 * Cache em memória do último refresh por usuário (header/footer)
 */

const lastRefreshByUser = new Map<number, string>();

export function getLastRefresh(userId: number): string {
  return lastRefreshByUser.get(userId) ?? new Date().toISOString().slice(0, 19);
}

export function setLastRefresh(userId: number): void {
  lastRefreshByUser.set(userId, new Date().toISOString().slice(0, 19));
}
