import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Initialize error logging (Sentry)
import { initializeErrorLogging } from './services/errorLogging'
import { AppErrorBoundary } from './components/ErrorBoundary'

// Initialize Sentry error tracking
initializeErrorLogging()

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
)

// Prerendered pages (scripts/prerender.mjs) ship their HTML inside #root with
// data-ssr="static" and are hydrated in place. Anything else - the SPA shell
// served for client-only routes - is rendered from scratch.
if (root.dataset.ssr === 'static') {
  ReactDOM.hydrateRoot(root, app, {
    // A mismatch (live prices, the current date) is recovered by React
    // re-rendering that part on the client; it is not a crash.
    onRecoverableError(error) {
      console.warn('Hydration recovered:', error)
    },
  })
} else {
  ReactDOM.createRoot(root).render(app)
}
