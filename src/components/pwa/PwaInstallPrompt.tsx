import { usePwaInstall } from '@/hooks/usePwaInstall';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PwaInstallPrompt() {
    const { isInstallable, install } = usePwaInstall();

    if (!isInstallable) return null;

    return (
        <div className="fixed bottom-4 left-4 z-50 animate-in fade-in slide-in-from-bottom-4">
            <Button onClick={install} variant="outline" className="shadow-lg rounded-full gap-2 bg-background border-primary/20 hover:bg-secondary">
                <Download className="w-4 h-4 text-primary" />
                <span className="text-primary font-medium">Install App</span>
            </Button>
        </div>
    );
}
