import { createRootRoute, Outlet } from '@tanstack/react-router'

const RootLayout = () => (
  <div className="min-h-svh bg-background text-foreground">
    <Outlet />
  </div>
)

export const Route = createRootRoute({ component: RootLayout })
