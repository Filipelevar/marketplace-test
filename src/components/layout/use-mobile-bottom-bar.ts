import { useMatches } from '@tanstack/react-router'

export type MobileBottomBar = 'navigation' | 'purchase'

export function useMobileBottomBar(): MobileBottomBar {
  return useMatches({
    select: (matches) => (matches.some((match) => match.staticData.mobileBottomBar === 'purchase') ? 'purchase' : 'navigation'),
  })
}
