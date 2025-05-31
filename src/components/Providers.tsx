'use client';

import { ReactNode } from 'react';
import { PermissionProvider } from '@/contexts/PermissionContext';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <PermissionProvider>
      {children}
    </PermissionProvider>
  );
} 