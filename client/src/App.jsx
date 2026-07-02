import { useEffect } from 'react';
import AppRouter from './router/AppRouter';
import { useAuthStore } from './store/authStore';
import { Toaster } from 'react-hot-toast';

function App() {
  useEffect(() => {
    useAuthStore.getState().initAuth();
  }, []);

  return (
    <>
      <AppRouter />
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          className: 'text-sm rounded-xl font-medium shadow-lg',
        }}
      />
    </>
  );
}

export default App;
