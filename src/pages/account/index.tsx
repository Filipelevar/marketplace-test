import { Outlet } from '@tanstack/react-router'
import { AccountNav } from '@/components/account-sidebar'

export function AccountLayout() {
  return (
    <div className="page-container flex flex-col gap-6 pt-6 lg:flex-row lg:gap-7 lg:pt-8">
      <AccountNav />
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
