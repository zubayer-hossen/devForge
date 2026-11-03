import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import App from './App';
import ThemedToaster from './components/common/ThemedToaster';
import { store } from './app/store';
import { setupInterceptors } from './api/client';
import { clearAuth } from './features/auth/authSlice';
import './index.css';

// সেশন নবায়ন ব্যর্থ হলে ক্লায়েন্টের লগইন অবস্থা মুছে ফেলা হয়
setupInterceptors({ onAuthFailure: () => store.dispatch(clearAuth()) });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <MotionConfig reducedMotion="user">
          <App />
          <ThemedToaster />
        </MotionConfig>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
