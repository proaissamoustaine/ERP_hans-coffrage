import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './auth/AuthProvider.tsx';
import { ErrorBoundary } from './components/layout/ErrorBoundary.tsx';
import { queryClient, persister } from './lib/queryClient';
import { registerOfflineMutationDefaults } from './lib/offlineMutations';

registerOfflineMutationDefaults(queryClient);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
        onSuccess={() => {
          // Rejoue les mutations mises en file pendant une coupure (après réhydratation).
          queryClient.resumePausedMutations();
        }}
      >
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
