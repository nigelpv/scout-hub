import { useEffect, useState } from 'react';
import { subscribeToSync, SyncStatus, getPendingCount } from '@/lib/storage';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';

export const SyncIndicator = () => {
    const [status, setStatus] = useState<SyncStatus>({
        pendingCount: getPendingCount(),
        isSyncing: false
    });
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const cleanup = subscribeToSync(setStatus);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            cleanup();
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Don't show anything if no pending items and online
    if (status.pendingCount === 0 && isOnline) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-background border border-border shadow-lg rounded-full px-4 py-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-4">
            {!isOnline ? (
                <>
                    <CloudOff className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Offline ({status.pendingCount})</span>
                </>
            ) : status.isSyncing ? (
                <>
                    <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-primary">Syncing...</span>
                </>
            ) : (
                <>
                    <Cloud className="w-4 h-4 text-warning" />
                    <span className="text-warning">Pending: {status.pendingCount}</span>
                </>
            )}
        </div>
    );
};
