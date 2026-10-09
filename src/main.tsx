import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@/lib/firebase'
import App from './App.tsx'

import { SystemErrorBoundary } from '@/components/error/SystemErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SystemErrorBoundary level="global">
      <App />
    </SystemErrorBoundary>
  </StrictMode>,
)
