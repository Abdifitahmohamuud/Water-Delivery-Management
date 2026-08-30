import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './App.css'
import './styles/main.css'
import './index.css'
const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1a1a35',
              color: '#f0ecff',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontFamily: "'Outfit', sans-serif",
              fontSize: '14px',
              padding: '14px 18px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#0a0812' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#0a0812' },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)

