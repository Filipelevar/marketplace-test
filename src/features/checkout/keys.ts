export const orderKeys = {
  all: ['orders'] as const,
  user: (userId: string) => [...orderKeys.all, userId] as const,
  detail: (userId: string, orderId: string) => [...orderKeys.user(userId), orderId] as const,
}
