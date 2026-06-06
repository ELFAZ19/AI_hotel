import { useEffect } from 'react';
import AppRouter from './router/AppRouter';
import { useAuthStore } from './store/authStore';

function App() {
  useEffect(() => {
    useAuthStore.getState().initAuth();
  }, []);

  return <AppRouter />;
}

export default App;
