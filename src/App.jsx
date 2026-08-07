import AppRoutes from './routes/AppRoutes.jsx'
import ToastProvider from './components/teacher/Toast.jsx'

/**
 * Root application component.
 * Kept intentionally thin — all routing logic lives in `routes/AppRoutes.jsx`
 * so this file stays stable as the app grows (auth providers, context, etc.
 * can wrap <AppRoutes /> here later without touching routing logic).
 */
function App() {
  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  )
}

export default App
