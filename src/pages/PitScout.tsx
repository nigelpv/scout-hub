import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Box } from 'lucide-react';

const PitScout = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background p-4 pb-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/')}
                    className="rounded-full"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Box className="w-6 h-6 text-primary" />
                    Pit Scouting
                </h1>
            </div>

            <div className="glass-card p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Box className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">Coming Soon</h2>
                <p className="text-muted-foreground mb-6">
                    The Pit Scouting interface is currently under construction.
                </p>
                <Button onClick={() => navigate('/')} className="w-full">
                    Back to Home
                </Button>
            </div>
        </div>
    );
};

export default PitScout;
