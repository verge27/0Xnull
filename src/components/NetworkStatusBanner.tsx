import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';

export const NetworkStatusBanner = () => {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-destructive text-destructive-foreground text-center py-2 z-50 flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4" />
      <span className="text-sm font-medium">You're offline. Some features may not work.</span>
    </div>
  );
};
