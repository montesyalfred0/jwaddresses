import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { registerSW } from 'virtual:pwa-register'
import 'leaflet/dist/leaflet.css'
import './index.css'

// Service worker: instala la PWA y mantiene la app siempre actualizada
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
