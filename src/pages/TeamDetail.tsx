import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatBar } from '@/components/scouting/StatBar';
import { calculateTeamStatsFromEntries, getRatingColor } from '@/lib/stats';
import { getEntriesForTeam, deleteEntry, deleteEntries } from '@/lib/storage';
import { Target, Zap, Trophy, Shield, User, Gauge, Lock, Unlock, Trash2, X, CircleDot, Loader2, CheckSquare, Square } from 'lucide-react';
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
    const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());

    const loadData = useCallback(async () => {
        setLoading(true);
        const teamEntries = await getEntriesForTeam(teamNum);
        setEntries(teamEntries);
        setStats(calculateTeamStatsFromEntries(teamEntries));
        setLoading(false);
        setSelectedEntries(new Set()); // Clear selection on reload
    }, [teamNum]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Admin Functions
    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault();
        setAdminPassword(password);
        setIsAdmin(true);
        setShowAuth(false);
        setPassword('');
        toast.success('Admin mode enabled');
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

    const toggleSelection = (id: string) => {
        const newSelection = new Set(selectedEntries);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedEntries(newSelection);
    };

    const handleBatchDelete = async () => {
        if (selectedEntries.size === 0) return;

        if (window.confirm(`Are you sure you want to delete ${selectedEntries.size} matches? This cannot be undone.`)) {
            const ids = Array.from(selectedEntries);
            const success = await deleteEntries(ids, adminPassword);

            if (success) {
                loadData();
                toast.success(`Deleted ${ids.length} matches`);
            } else {
                toast.error('Failed to delete matches');
            }
        }
    };

    const exitAdmin = () => {
        setIsAdmin(false);
        setSelectedEntries(new Set());
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
        'low': 'Low',
        'mid': 'Mid',
        'high': 'High',
    };

    const autoClimbLabels: Record<string, string> = {
        'middle': 'Middle',
    };

    const navLabels: Record<string, string> = {
        'none': 'None',
        'trench': 'Trench',
        'bump': 'Bump',
        'both': 'Trench & Bump',
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

            {/* Batch Action Bar */}
            {isAdmin && selectedEntries.size > 0 && (
                <div className="fixed bottom-4 left-4 right-4 z-40 animate-in slide-in-from-bottom-4 fade-in">
                    <div className="bg-destructive text-destructive-foreground rounded-xl shadow-lg p-4 flex items-center justify-between">
                        <span className="font-medium">{selectedEntries.size} selected</span>
                        <button
                            onClick={handleBatchDelete}
                            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Delete Selected
                        </button>
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
                                <span>StdDev: {stats.stdDevAutoCycles}</span>
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
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <h2 className="font-semibold">Match History</h2>
                        {isAdmin && (
                            <div className="flex gap-2 text-xs">
                                <button
                                    onClick={() => setSelectedEntries(new Set(entries.map(e => e.id)))}
                                    className="text-primary hover:underline font-medium"
                                >
                                    Select All
                                </button>
                                <span className="text-muted-foreground">|</span>
                                <button
                                    onClick={() => setSelectedEntries(new Set())}
                                    className="text-muted-foreground hover:text-foreground hover:underline font-medium"
                                >
                                    Deselect
                                </button>
                            </div>
                        )}
                    </div>
                    {isAdmin && (
                        <span className="text-xs text-muted-foreground">
                            {selectedEntries.size} select
                        </span>
                    )}
                </div>
                <div className="space-y-3">
                    {entries.slice().reverse().map((entry) => (
                        <div key={entry.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-3">
                                    {isAdmin ? (
                                        <button
                                            onClick={() => toggleSelection(entry.id)}
                                            className={`p-1 -ml-1 rounded transition-colors ${selectedEntries.has(entry.id) ? 'text-primary' : 'text-muted-foreground'}`}
                                        >
                                            {selectedEntries.has(entry.id) ? (
                                                <CheckSquare className="w-5 h-5" />
                                            ) : (
                                                <Square className="w-5 h-5" />
                                            )}
                                        </button>
                                    ) : null}
                                    <span className="font-mono font-bold text-base">Match {entry.matchNumber}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="bg-secondary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        {entry.shootingRange}
                                    </div>
                                    {isAdmin && !selectedEntries.has(entry.id) && (
                                        <button
                                            onClick={() => handleDeleteMatch(entry.id)}
                                            className="p-1 text-muted-foreground hover:text-destructive transition-colors ml-2"
                                            title="Delete Single Match"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className={`space-y-3 ${isAdmin ? 'pl-7' : ''}`}>
                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Auto Column */}
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">Autonomous</p>
                                        <div className="text-sm space-y-1">
                                            <div className="flex justify-between border-b border-border/50 pb-0.5">
                                                <span>Cycles</span>
                                                <span className="font-mono font-medium text-foreground">{entry.autoCycles}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-border/50 pb-0.5">
                                                <span>Preload</span>
                                                <span className="font-medium text-foreground">
                                                    {entry.autoPreload
                                                        ? (entry.autoPreloadScored ? 'Scored All' : `${entry.autoPreloadCount || 0} Scored`)
                                                        : 'None'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-b border-border/50 pb-0.5">
                                                <span>Climb</span>
                                                <span className="font-medium text-foreground">{autoClimbLabels[entry.autoClimb]}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Teleop Column */}
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">Teleop & Endgame</p>
                                        <div className="text-sm space-y-1">
                                            <div className="flex justify-between border-b border-border/50 pb-0.5">
                                                <span>Cycles</span>
                                                <span className="font-mono font-medium text-foreground">{entry.teleopCycles}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-border/50 pb-0.5">
                                                <span>Defense</span>
                                                <span className="font-medium text-foreground">
                                                    <span className="font-medium text-foreground">
                                                        {entry.defenseRating > 0 ? `Lvl ${entry.defenseRating}` : 'None'}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-b border-border/50 pb-0.5">
                                                <span>Climb</span>
                                                <span className="font-medium text-foreground">{climbLabels[entry.climbResult]} {entry.climbResult !== 'none' && `(${entry.climbStability}★)`}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-border/50 pb-0.5">
                                                <span>Travel</span>
                                                <span className="font-medium text-foreground">{navLabels[entry.obstacleNavigation || 'none']}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                {entry.notes && (
                                    <div className="text-sm text-muted-foreground bg-secondary/20 p-2 rounded border-l-2 border-primary/30">
                                        <span className="font-bold text-[10px] uppercase block mb-0.5 opacity-70">Notes</span>
                                        <p className="italic">"{entry.notes}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TeamDetail;
