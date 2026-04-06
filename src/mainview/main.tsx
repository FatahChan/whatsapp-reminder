import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './lib/rpc'
import { createHashHistory } from '@tanstack/history'
import { RouterProvider, createRouter } from '@tanstack/react-router'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Hash routing avoids document pathname issues in desktop shells (e.g. …/index.html vs "/").
// See TanStack history guide and community notes: https://github.com/TanStack/router/discussions/835
const history = createHashHistory()

const router = createRouter({ routeTree, history })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}