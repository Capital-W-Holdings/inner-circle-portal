/**
 * Providers Wrapper
 * Combines all client-side providers (PostHog, ErrorBoundary, etc.)
 */

'use client';

import React from 'react';
import { PostHogProvider } from './PostHogProvider';
import { ErrorBoundary } from './ErrorBoundary';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps): React.ReactElement {
  return (
    <ErrorBoundary>
      <PostHogProvider>
        {children}
      </PostHogProvider>
    </ErrorBoundary>
  );
}

export default Providers;
