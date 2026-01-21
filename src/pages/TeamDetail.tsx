import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatBar } from '@/components/scouting/StatBar';
import { calculateTeamStatsFromEntries, getRatingColor } from '@/lib/stats';
import { getEntriesForTeam, deleteEntry } from '@/lib/storage';
import { Target, Zap, Trophy, Shield, User, Gauge, Wrench, Lock, Unlock, Trash2, X, CircleDot, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TeamStats, ScoutingEntry } from '@/lib/types';

const TeamDetail = () => {
    const { teamNumber } = useParams();
    const teamNum = parseInt(teamNumber || '0');

    const [stats, setStats] = useState<TeamStats | null>(null);
    const [entries, setEntries] = useState<ScoutingEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // Admin Mode State
    const [isAdmin, setIsAdmin] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [password, setPassword] = useState('');
    const [adminPassword, setAdminPassword] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        const teamEntries = await getEntriesForTeam(teamNum);
        setEntries(teamEntries);
        setStats(calculateTeamStatsFromEntries(teamEntries));
        setLoading(false);
    }, [teamNum]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Admin Functions
    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '16782473') {
            setAdminPassword(password);
            setIsAdmin(true);
            setShowAuth(false);
            setPassword('');
            toast.success('Admin mode enabled');
        } else {
            toast.error('Incorrect password');
            setPassword('');
        }
    };

    const handleDeleteMatch = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this match? This cannot be undone.')) {
            const success = await deleteEntry(id, adminPassword);
            if (success) {
                loadData(); // Refresh stats and list
                toast.success('Match deleted');
            } else {
                toast.error('Failed to delete match');
            }
        }
    };

    const exitAdmin = () => {
        setIsAdmin(false);
        toast.info('Exited admin mode');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <PageHeader title={`Team ${teamNum}`} />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen bg-background">
                <PageHeader title={`Team ${teamNum}`} />
                <div className="p-4 text-center py-12">
                    <p className="text-muted-foreground">No data for this team</p>
                </div>
            </div>
        );
    }

    const climbLabels: Record<string, string> = {
        'none': 'None',
        'attempted': 'Attempted',
        'low': 'Low',
        'mid': 'Mid',
        'high': 'High',
    };

    const autoClimbLabels: Record<string, string> = {
        'none': 'None',
        'side': 'Side',
        'middle': 'Middle',
    };

    return (
        <div className="min-h-screen bg-background pb-8 relative">
            <PageHeader
                title={`Team ${teamNum}`}
                rightContent={
                    <button
                        onClick={() => isAdmin ? exitAdmin() : setShowAuth(true)}
                        className={`p-2 rounded-lg transition-colors ${isAdmin ? 'bg-destructive/10 text-destructive' : 'hover:bg-secondary'}`}
                        title={isAdmin ? "Lock" : "Unlock Admin"}
                    >
                        {isAdmin ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </button>
                }
            />

            {/* Auth Modal */}
            {showAuth && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-xl shadow-lg p-6 max-w-xs w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Admin Access</h3>
                            <button onClick={() => setShowAuth(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAuth} className="space-y-4">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                autoFocus
                                className="w-full h-10 px-3 rounded-md bg-secondary border border-transparent focus:border-primary outline-none"
                            />
                            <button type="submit" className="w-full h-10 bg-primary text-primary-foreground rounded-md font-medium">
                                Unlock
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="p-4 space-y-4">
                {/* Overview */}
                <div className="stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Composite Score</p>
                            <p className="font-mono text-3xl font-bold text-primary">{stats.totalScore}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Matches</p>
                            <p className="font-mono text-2xl font-bold">{stats.matchesPlayed}</p>
                        </div>
                    </div>
                </div>

                {/* Autonomous */}
                <div className="stat-card">
                    <div className="flex items-center gap-2 mb-4">
                        <CircleDot className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold">Autonomous</h2>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <strong className="block text-sm mb-1">Preload Success</strong>
                            <StatBar value={stats.autoPreloadSuccessRate} max={100} label="Success Rate" suffix="%" />
                        </div>
                        <div>
                            <StatBar value={stats.avgAutoCycles} max={15} label="Avg Auto Cycles" />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
                                <span>Mean: {stats.meanAutoCycles}</span>
                                <span>Median: {stats.medianAutoCycles}</span>
                                <span>StdDev: {stats.stdDevAutoCycles}</span>
                                <span>Size: {stats.avgAutoCycleSize}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Teleop */}
                <div className="stat-card">
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5 text-info" />
                        <h2 className="font-semibold">Teleop</h2>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <StatBar value={stats.avgTeleopCycles} max={30} label="Avg Teleop Cycles" />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
                                <span>Mean: {stats.meanTeleopCycles}</span>
                                <span>Median: {stats.medianTeleopCycles}</span>
                                <span>StdDev: {stats.stdDevTeleopCycles}</span>
                            </div>
                        </div>

                        <div>
                            <StatBar value={stats.avgCycleSize} max={5} label="Avg Cycle Size" />
                        </div>
                    </div>
                </div>

                {/* Climbing */}
                <div className="stat-card">
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy className="w-5 h-5 text-warning" />
                        <h2 className="font-semibold">Climbing</h2>
                    </div>
                    <div className="space-y-4">
                        <StatBar value={stats.climbSuccessRate} max={100} label="Endgame Success" suffix="%" />
                        <StatBar value={stats.highMidClimbRate} max={100} label="High/Mid Rate" suffix="%" />
                    </div>
                </div>

                {/* Performance */}
                <div className="stat-card">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-5 h-5 text-purple-500" />
                        <h2 className="font-semibold">Performance</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <User className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                            <p className={`font-mono text-2xl font-bold ${getRatingColor(stats.avgDriverSkill)}`}>
                                {stats.avgDriverSkill}
                            </p>
                            <p className="text-xs text-muted-foreground">Driver</p>
                        </div>
                        <div>
                            <Gauge className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                            <p className={`font-mono text-2xl font-bold ${getRatingColor(stats.avgRobotSpeed)}`}>
                                {stats.avgRobotSpeed}
                            </p>
                            <p className="text-xs text-muted-foreground">Speed</p>
                        </div>
                        <div>
                            <Wrench className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                            <p className={`font-mono text-2xl font-bold ${getRatingColor(stats.avgReliability)}`}>
                                {stats.avgReliability}
                            </p>
                            <p className="text-xs text-muted-foreground">Reliable</p>
                        </div>
                    </div>
                </div>

                {/* Defense */}
                {stats.avgDefenseRating > 0 && (
                    <div className="stat-card">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-5 h-5 text-destructive" />
                            <h2 className="font-semibold">Defense</h2>
                        </div>
                        <StatBar value={stats.avgDefenseRating} max={5} label="Avg Defense Rating" />
                    </div>
                )}

                {/* Recent Matches */}
                <div className="stat-card">
                    <h2 className="font-semibold mb-4">Match History</h2>
                    <div className="space-y-3">
                        {entries.slice().reverse().map((entry) => (
                            <div key={entry.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-3">
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleDeleteMatch(entry.id)}
                                                className="p-1 -ml-1 text-destructive hover:bg-destructive/10 rounded"
                                                title="Delete Match"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        <span className="font-mono font-medium">Match {entry.matchNumber}</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {climbLabels[entry.climbResult]}
                                    </span>
                                </div>
                                {/* Auto Details using new schema */}
                                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-1">
                                    <div>Auto: {entry.autoCycles} ({entry.autoEstCycleSize || 0}sz)</div>
                                    <div>Preload: {entry.autoPreload ? (entry.autoPreloadScored ? '✅' : '❌') : '-'}</div>
                                    <div>Range: {entry.shootingRange || 'short'}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                    <div>Teleop: {entry.teleopCycles} ({entry.estimatedCycleSize || 0}sz)</div>
                                    {entry.autoClimb && entry.autoClimb !== 'none' && (
                                        <div>AutoClimb: {autoClimbLabels[entry.autoClimb]}</div>
                                    )}
                                </div>

                                {entry.notes && (
                                    <p className="text-sm text-muted-foreground mt-2 italic">
                                        "{entry.notes}"
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamDetail;
