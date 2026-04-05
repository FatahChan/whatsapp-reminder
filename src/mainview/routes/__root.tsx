import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
// Default export is a no-op when Vite builds with NODE_ENV=production (e.g. Electrobun loads dist/).
import { TanStackRouterDevtoolsInProd as TanStackRouterDevtools } from '@tanstack/react-router-devtools'

const RootLayout = () => (
  <>
    <div className="p-2 flex gap-2">
      <Link to="/" className="[&.active]:font-bold">
        Home
      </Link>{' '}
      <Link to="/about" className="[&.active]:font-bold">
        About
      </Link>
    </div>
    <hr />
    <Outlet />
    <TanStackRouterDevtools initialIsOpen/>
  </>
)

export const Route = createRootRoute({ component: RootLayout })