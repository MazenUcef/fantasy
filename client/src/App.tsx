import AppRoutes from "./routes/AppRoutes"
import { Toaster } from "react-hot-toast"

const App = () => {
  return (
    <div>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  )
}

export default App