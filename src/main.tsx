import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Initialize error logging (Sentry)
import { initializeErrorLogging } from './services/errorLogging'
import { AppErrorBoundary } from './components/ErrorBoundary'

// Initialize Sentry error tracking
initializeErrorLogging()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
