import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0F172A',
            color: '#fff',
            border: '1px solid #1E293B',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
            letterSpacing: '0.025em',
          },
          success: {
            iconTheme: {
              primary: '#22C55E',
              secondary: '#0F172A',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#0F172A',
            },
          },
        }}
      />
    </>
  );
}

export default App;