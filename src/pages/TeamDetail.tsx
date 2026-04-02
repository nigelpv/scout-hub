import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatBar } from '@/components/scouting/StatBar';
import { calculateTeamStatsFromEntries, getRatingColor, createEmptyStats } from '@/lib/stats';
import { getEntriesForTeam, deleteEntry, deleteEntries, getPitEntryForTeam, EVENT_KEY } from '@/lib/storage';
import { fetchEventOPRs, getTeamOPR, TBAOprResult } from '@/lib/tba';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Target, Zap, Trophy, Shield, Box, HelpCircle, Lock, Unlock, Trash2, X, CircleDot, Loader2, CheckSquare, Square, TrendingUp, AlertTriangle, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { TeamStats, ScoutingEntry, PitScoutingEntry } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

const TeamDetail = () => {
    const { teamNumber } = useParams();
    const teamNum = parseInt(teamNumber || '0');

    const [stats, setStats] = useState<TeamStats | null>(null);
    const [entries, setEntries] = useState<ScoutingEntry[]>([]);
    const [pitData, setPitData] = useState<PitScoutingEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [opr, setOpr] = useState<number | null>(null);

    // Admin Mode State
    const [isAdmin, setIsAdmin] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [password, setPassword] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());

    const loadData = useCallback(async () => {
        setLoading(true);
        const [teamEntries, teamPitData] = await Promise.all([
            getEntriesForTeam(teamNum),
            getPitEntryForTeam(teamNum)
        ]);
        setEntries(teamEntries);
        setPitData(teamPitData);

        const calculatedStats = calculateTeamStatsFromEntries(teamEntries);
        const finalStats = calculatedStats || createEmptyStats(teamNum);
        setStats(finalStats);

        setLoading(false);
        setSelectedEntries(new Set()); // Clear selection on reload
    }, [teamNum]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        const loadOPR = async () => {
            const oprs = await fetchEventOPRs(EVENT_KEY());
            if (oprs) setOpr(getTeamOPR(oprs, teamNum));
        };
        loadOPR();
    }, [teamNum]);

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
            <div className="min-h-screen bg-background text-foreground">
                <PageHeader title={`Team ${teamNum}`} />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (!stats && !pitData) {
        return (
            <div className="min-h-screen bg-background">
                <PageHeader title={`Team ${teamNum}`} />
                <div className="p-4 text-center py-12 text-foreground">
                    <p className="text-muted-foreground">No data for this team</p>
                </div>
            </div>
        );
    }

    const beachingTypeLabels: Record<string, string> = {
        'beached_on_bump': 'On Bump',
        'beached_on_fuel_off_bump': 'On Fuel',
        'other': 'Other',
    };

    const climbPositionLabels: Record<string, string> = {
        'side': 'Side',
        'center': 'Center',
        'none': 'None',
    };

    // Helper component for segmented percentage bars
    const SegmentedBar = ({ data, labels, colors }: { data: Record<string, number>, labels: Record<string, string>, colors: string[] }) => {
        const formatLabel = (key: string) => {
            if (labels[key]) return labels[key];
            return key
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }

        // Separate 'none' from active categories for bar background logic, but include it in the legend if val > 0
        const activeEntries = Object.entries(data).filter(([key, val]) => val > 0 && key !== 'none' && key !== 'failed_attempt');
        const noneVal = data['none'] || 0;
        const failedVal = data['failed_attempt'] || 0;

        if (activeEntries.length === 0 && noneVal === 0 && failedVal === 0) 
            return <div className="h-2 bg-secondary rounded-full w-full" />;

        return (
            <div className="flex flex-col gap-2">
                <div className="flex h-2.5 rounded-full overflow-hidden bg-secondary shadow-inner border border-black/5">
                    {activeEntries.map(([key, value], idx) => (
                        <div
                            key={key}
                            style={{ width: `${value}%` }}
                            className={`${colors[idx % colors.length]} h-full border-r border-black/10 last:border-0`}
                            title={`${formatLabel(key)}: ${value}%`}
                        />
                    ))}
                    {/* Failed attempt segment in red if present */}
                    {failedVal > 0 && (
                        <div
                            style={{ width: `${failedVal}%` }}
                            className="bg-destructive h-full border-r border-black/10 last:border-0"
                            title={`Failed: ${failedVal}%`}
                        />
                    )}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {activeEntries.map(([key, value], idx) => (
                        <div key={key} className="flex items-center justify-between text-[8px] font-bold uppercase tracking-tighter">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors[idx % colors.length]}`} />
                                <span className="truncate text-muted-foreground">{formatLabel(key)}</span>
                            </div>
                            <span className="flex-shrink-0">{value}%</span>
                        </div>
                    ))}
                    {failedVal > 0 && (
                        <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-tighter">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-destructive" />
                                <span className="truncate text-muted-foreground">Failed</span>
                            </div>
                            <span className="flex-shrink-0">{failedVal}%</span>
                        </div>
                    )}
                    {noneVal > 0 && (
                        <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-tighter italic">
                            <div className="flex items-center gap-1.5 min-w-0 opacity-40">
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-muted-foreground" />
                                <span className="truncate">No Occurrence</span>
                            </div>
                            <span className="flex-shrink-0 opacity-40">{noneVal}%</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-8 relative">
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
                            <h3 className="font-bold text-lg text-foreground">Admin Access</h3>
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
                {/* Overview Header Card */}
                <div className="stat-card bg-primary/5 border-primary/20">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1 leading-none">Cycles Per Match</p>
                            <p className="font-mono text-5xl font-black italic text-primary leading-none tracking-tighter">
                                {((stats?.avgAutoCycles || 0) + (stats?.avgTeleopCycles || 0)).toFixed(1)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1 leading-none">OPR</p>
                            <p className="font-mono text-4xl font-black italic text-info leading-none tracking-tighter">
                                {opr !== null ? opr.toFixed(1) : 'N/A'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-4 gap-2 border-t border-primary/10 pt-4">
                        <div className="text-center">
                            <p className="text-[8px] text-muted-foreground uppercase font-bold">Matches</p>
                            <p className="font-mono text-xl font-black">{stats?.matchesPlayed ?? 0}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] text-muted-foreground uppercase font-bold">Climb %</p>
                            <p className={`font-mono text-xl font-black ${getRatingColor(stats?.climbSuccessRate || 0, 100)}`}>
                                {stats?.climbSuccessRate ?? 0}%
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] text-muted-foreground uppercase font-bold">Defense</p>
                            <p className={`font-mono text-xl font-black ${getRatingColor(stats?.avgDefenseEffectiveness || 0, 5)}`}>
                                {stats?.avgDefenseEffectiveness?.toFixed(1) ?? '0.0'}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] text-muted-foreground uppercase font-bold">Incap %</p>
                            <p className={`font-mono text-xl font-black ${stats?.incapRate && stats.incapRate > 15 ? 'text-destructive' : 'text-foreground'}`}>
                                {stats?.incapRate ?? 0}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Trend Graph */}
                {stats && stats.cycleHistory && stats.cycleHistory.length > 1 && (
                    <div className="stat-card">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <h2 className="font-bold uppercase tracking-wider text-sm">Cycle Trend</h2>
                        </div>
                        <div className="h-48 w-full mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.cycleHistory}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                    <XAxis dataKey="matchNumber" label={{ value: 'Match', position: 'insideBottom', offset: -5, fontSize: 10 }} tick={{ fontSize: 10 }} />
                                    <YAxis width={20} tick={{ fontSize: 10 }} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                    <Line type="monotone" dataKey="auto" stroke="#ff8c00" strokeWidth={3} dot={{ r: 4 }} name="Auto" />
                                    <Line type="monotone" dataKey="teleop" stroke="#00d4ff" strokeWidth={3} dot={{ r: 4 }} name="Teleop" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Match Stats */}
                {stats && stats.matchesPlayed > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Autonomous */}
                        <div className="stat-card">
                            <div className="flex items-center gap-2 mb-4">
                                <CircleDot className="w-5 h-5 text-primary" />
                                <h2 className="font-bold uppercase tracking-wider text-sm">Autonomous</h2>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <p className="text-[10px] text-muted-foreground uppercase font-black">Average Cycles</p>
                                        <p className="text-3xl font-mono font-black text-primary">{stats.avgAutoCycles}</p>
                                    </div>
                                    <StatBar value={stats.avgAutoCycles} max={15} label="" showValue={false} />
                                    <div className="grid grid-cols-3 gap-2 mt-4">
                                        <div className="bg-secondary/30 p-2 rounded text-center">
                                            <p className="text-[8px] text-muted-foreground uppercase font-bold">Mean</p>
                                            <p className="text-lg font-mono font-black">{stats.meanAutoCycles}</p>
                                        </div>
                                        <div className="bg-secondary/30 p-2 rounded text-center">
                                            <p className="text-[8px] text-muted-foreground uppercase font-bold">Median</p>
                                            <p className="text-lg font-mono font-black">{stats.medianAutoCycles}</p>
                                        </div>
                                        <div className="bg-secondary/30 p-2 rounded text-center">
                                            <p className="text-[8px] text-muted-foreground uppercase font-bold">StdDev</p>
                                            <p className="text-lg font-mono font-black">{stats.stdDevAutoCycles}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                                        <p className="text-[10px] text-muted-foreground uppercase font-black font-mono tracking-tighter">Auto Shooting + Intake Rate</p>
                                        <p className="text-lg font-mono font-black text-emerald-500">{stats.shootPlusIntakeAutoRate}%</p>
                                    </div>
                                    <div className="mt-4 p-3 bg-secondary/20 rounded-lg space-y-4">
                                        <div>
                                            <p className="text-[8px] text-muted-foreground uppercase font-black mb-2 tracking-widest">Starting Position</p>
                                            <SegmentedBar
                                                data={stats.startingPositionStats}
                                                labels={{ 'outpost_trench': 'Outpost T', 'outpost_bump': 'Outpost B', 'hub': 'Hub', 'depot_trench': 'Depot T', 'depot_bump': 'Depot B' }}
                                                colors={['bg-primary', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500']}
                                            />
                                        </div>
                                        <div className="pt-2 border-t border-border/50">
                                            <p className="text-[8px] text-muted-foreground uppercase font-black mb-2 tracking-widest">Auto Climb Result</p>
                                            <SegmentedBar
                                                data={stats.autoClimbStats}
                                                labels={{ 'side': 'Side', 'middle': 'Middle', 'failed_attempt': 'Failed' }}
                                                colors={['bg-emerald-500', 'bg-blue-500', 'bg-rose-500']}
                                            />
                                        </div>
                                        <div className="pt-2 border-t border-border/50 grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[8px] text-muted-foreground uppercase font-black mb-1">Avg Hoppers</p>
                                                <p className="font-mono font-black text-lg">{stats.avgHoppersPassedAuto}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] text-muted-foreground uppercase font-black mb-1">Obstacles (%)</p>
                                                <div className="flex gap-1 flex-wrap">
                                                    {Object.entries(stats.autoObstacleStats).map(([key, val]) => 
                                                        val > 0 && key !== 'none' && (
                                                        <span key={key} className="text-[7px] bg-secondary px-1 py-0.5 rounded font-black text-foreground">
                                                            {key.replace('_', ' ').toUpperCase()} {val}%
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Teleop */}
                        <div className="stat-card">
                            <div className="flex items-center gap-2 mb-4">
                                <Target className="w-5 h-5 text-info" />
                                <h2 className="font-bold uppercase tracking-wider text-sm">Teleop</h2>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <p className="text-[10px] text-muted-foreground uppercase font-black">Average Cycles</p>
                                        <p className="text-3xl font-mono font-black text-info">{stats.avgTeleopCycles}</p>
                                    </div>
                                    <StatBar value={stats.avgTeleopCycles} max={30} className="bg-info" label="" showValue={false} />
                                    <div className="grid grid-cols-3 gap-2 mt-4">
                                        <div className="bg-secondary/30 p-2 rounded text-center">
                                            <p className="text-[8px] text-muted-foreground uppercase font-bold">Mean</p>
                                            <p className="text-lg font-mono font-black">{stats.meanTeleopCycles}</p>
                                        </div>
                                        <div className="bg-secondary/30 p-2 rounded text-center">
                                            <p className="text-[8px] text-muted-foreground uppercase font-bold">Median</p>
                                            <p className="text-lg font-mono font-black">{stats.medianTeleopCycles}</p>
                                        </div>
                                        <div className="bg-secondary/30 p-2 rounded text-center">
                                            <p className="text-[8px] text-muted-foreground uppercase font-bold">StdDev</p>
                                            <p className="text-lg font-mono font-black">{stats.stdDevTeleopCycles}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between bg-emerald-500/10 p-2 rounded border border-emerald-500/20 shadow-sm">
                                        <div className="flex flex-col">
                                            <p className="text-[10px] text-muted-foreground uppercase font-black font-mono tracking-tighter">Teleop Shooting + Intake Rate</p>
                                            <p className="text-[8px] text-muted-foreground/60 uppercase font-black">Success over {stats.matchesPlayed} matches</p>
                                        </div>
                                        <p className="text-lg font-mono font-black text-emerald-500">{stats.shootPlusIntakeTeleopRate}%</p>
                                    </div>
                                    <div className="mt-4 p-3 bg-secondary/20 rounded-lg space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[8px] text-muted-foreground uppercase font-black mb-1">Avg Hoppers</p>
                                                <p className="font-mono font-black text-lg text-info">{stats.avgHoppersPassed}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] text-muted-foreground uppercase font-black mb-1">Herd Fuel (%)</p>
                                                <p className="font-mono font-black text-lg text-info">{stats.herdsFuelRate}%</p>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-border/50">
                                            <p className="text-[8px] text-muted-foreground uppercase font-black mb-2 tracking-widest">Obstacle Preference (%)</p>
                                            <SegmentedBar
                                                data={stats.teleopObstacleStats}
                                                labels={{ 'trench': 'Trench', 'bump': 'Bump', 'both': 'Both' }}
                                                colors={['bg-info', 'bg-purple-500', 'bg-amber-500']}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Climbing */}
                        <div className="stat-card overflow-hidden">
                            <div className="flex items-center gap-2 mb-4">
                                <Trophy className="w-5 h-5 text-warning" />
                                <h2 className="font-bold uppercase tracking-wider text-sm">Climbing Breakdown</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1 text-[10px] font-bold uppercase">
                                        <span>Overall Success</span>
                                        <span className={getRatingColor(stats.climbSuccessRate, 100)}>{stats.climbSuccessRate}%</span>
                                    </div>
                                    <StatBar value={stats.climbSuccessRate} max={100} className="bg-warning" label="" showValue={false} />
                                </div>

                                <div className="mt-6 flex h-4 rounded-full overflow-hidden bg-secondary">
                                    <div style={{ width: `${stats.l3ClimbRate}%` }} className="bg-warning h-full" />
                                    <div style={{ width: `${stats.l2ClimbRate}%` }} className="bg-orange-500 h-full border-l border-black/20" />
                                    <div style={{ width: `${stats.l1ClimbRate}%` }} className="bg-amber-500 h-full border-l border-black/20" />
                                </div>
                                <div className="grid grid-cols-3 gap-1 mt-2">
                                    <div className="text-center">
                                        <p className="text-[8px] text-muted-foreground uppercase font-bold">Level 3</p>
                                        <p className="text-xs font-black">{stats.l3ClimbRate}%</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[8px] text-muted-foreground uppercase font-bold">Level 2</p>
                                        <p className="text-xs font-black">{stats.l2ClimbRate}%</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[8px] text-muted-foreground uppercase font-bold">Level 1</p>
                                        <p className="text-xs font-black">{stats.l1ClimbRate}%</p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-border/50">
                                    <p className="text-[8px] text-muted-foreground uppercase font-black mb-2 tracking-widest">Preference: Bar Position</p>
                                    <SegmentedBar
                                        data={stats.climbPositionStats}
                                        labels={{ 'side': 'Side Only', 'center': 'Center Only' }}
                                        colors={['bg-warning', 'bg-indigo-500']}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Defense Breakdown */}
                        <div className="stat-card">
                            <div className="flex items-center gap-2 mb-4">
                                <Shield className="w-5 h-5 text-destructive" />
                                <h2 className="font-bold uppercase tracking-wider text-sm">Defense Strategy</h2>
                            </div>
                            <div className="flex flex-col gap-6">
                                <div className="p-3 bg-secondary/10 rounded-lg">
                                    <p className="text-[8px] text-muted-foreground uppercase font-black mb-2 tracking-widest">Zone Breakdown (%)</p>
                                    <SegmentedBar 
                                        data={stats.defenseLocationStats}
                                        labels={{'neutral': 'Neutral', 'our_alliance': 'Our Side', 'their_alliance': 'Their Side'}}
                                        colors={['bg-destructive', 'bg-indigo-500', 'bg-emerald-500']}
                                    />
                                </div>
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex-1">
                                        <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">Play Frequency</p>
                                        <p className="font-mono text-2xl font-black text-destructive">{stats.defensePlayRate}%</p>
                                    </div>
                                    <div className="text-right border-l border-border pl-6">
                                        <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">Effectiveness</p>
                                        <p className={`text-4xl font-mono font-black italic leading-none ${getRatingColor(stats.avgDefenseEffectiveness, 5)}`}>
                                            {stats.avgDefenseEffectiveness.toFixed(1)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="stat-card text-center py-12 border-dashed">
                        <AlertTriangle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No Match Data Found</p>
                        <Link to="/scout" className="text-xs text-primary hover:underline mt-2 inline-block">Record first match →</Link>
                    </div>
                )}

                {/* Stability and Travel */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="stat-card border-destructive/20 bg-destructive/5">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                            <h2 className="font-bold uppercase tracking-wider text-[10px]">Stability Issues</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1 font-bold">
                                    <span>Incapacitation</span>
                                    <span className={stats?.incapRate && stats.incapRate > 0 ? 'text-destructive' : 'text-emerald-500'}>{stats?.incapRate}%</span>
                                </div>
                                <StatBar value={stats?.incapRate || 0} max={100} className="bg-destructive" label="" showValue={false} />
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1 font-bold">
                                    <span>Beaching Rate</span>
                                    <span className={stats.beachingRate > 0 ? 'text-destructive' : 'text-emerald-500'}>{stats.beachingRate}%</span>
                                </div>
                                <StatBar value={stats.beachingRate} max={100} className="bg-destructive/60" label="" showValue={false} />
                            </div>
                            {stats.beachingRate > 0 && (
                                <div className="pt-2 border-t border-destructive/10">
                                    <p className="text-[8px] text-muted-foreground uppercase font-black mb-2 tracking-widest">Cause Breakdown</p>
                                    <SegmentedBar
                                        data={stats.beachingTypeStats}
                                        labels={{ 'beached_on_bump': 'On Bump', 'beached_on_fuel_off_bump': 'On Fuel', 'other': 'Other' }}
                                        colors={['bg-destructive', 'bg-orange-500', 'bg-amber-500']}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="stat-card border-emerald-500/20 bg-emerald-500/5">
                        <div className="flex items-center gap-2 mb-3">
                            <Navigation className="w-4 h-4 text-emerald-500" />
                            <h2 className="font-bold uppercase tracking-wider text-[10px]">Travel Perf.</h2>
                        </div>
                        <div className="flex flex-col justify-center h-[calc(100%-24px)] text-center">
                            <div className="py-2">
                                <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">Driver Skill</p>
                                <p className={`text-4xl font-mono font-black italic leading-none ${getRatingColor(stats?.avgDriverSkill || 0, 5)}`}>
                                    {stats?.avgDriverSkill?.toFixed(1) || '—'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pit Scouting */}
                <div className="stat-card">
                    <div className="flex items-center gap-2 mb-4">
                        <Box className="w-5 h-5 text-primary" />
                        <h2 className="font-bold uppercase tracking-wider text-sm">Pit Recap</h2>
                    </div>
                    {pitData ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter">Capabilities</p>
                                    <div className="text-xs space-y-1.5 mt-1">
                                        <div className="flex justify-between border-b border-border shadow-sm pb-1">
                                            <span className="text-muted-foreground">Auto Climb</span>
                                            <span className="font-bold">{Array.isArray(pitData.autoClimb) ? (pitData.autoClimb.length > 0 ? pitData.autoClimb.join(', ') : 'None') : (pitData.autoClimb || 'None')}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-border shadow-sm pb-1">
                                            <span className="text-muted-foreground">Endgame</span>
                                            <span className="font-bold uppercase">{Array.isArray(pitData.robotClimb) ? (pitData.robotClimb.length > 0 ? pitData.robotClimb.filter(v => v !== 'none').join(', ') || 'None' : 'None') : (pitData.robotClimb === 'none' ? 'None' : pitData.robotClimb)}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-border shadow-sm pb-1">
                                            <span className="text-muted-foreground">Intake</span>
                                            <span className="font-bold">{pitData.intakeType}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter">Hoppers</p>
                                    <div className="text-xs space-y-1.5 mt-1">
                                        <div className="flex justify-between border-b border-border shadow-sm pb-1">
                                            <span className="text-muted-foreground">Capacity</span>
                                            <span className="font-mono font-black">{pitData.hopperCapacity ?? 0}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-border shadow-sm pb-1">
                                            <span className="text-muted-foreground">Rate</span>
                                            <span className="font-mono font-black">{pitData.ballsPerSecond} B/s</span>
                                        </div>
                                        <div className="flex justify-between border-b border-border shadow-sm pb-1">
                                            <span className="text-muted-foreground">Under Trench</span>
                                            <span className={`font-bold ${pitData.canGoUnderTrench ? 'text-emerald-500' : 'text-destructive'}`}>{pitData.canGoUnderTrench ? 'Yes' : 'No'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 bg-secondary/10 rounded-lg">
                            <p className="text-xs text-muted-foreground">Missing Pit Data</p>
                        </div>
                    )}
                </div>

                {/* Match List */}
                <div className="stat-card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold uppercase tracking-wider text-sm">Match History</h2>
                        {isAdmin && (
                            <div className="flex gap-2 text-xs">
                                <button onClick={() => setSelectedEntries(new Set(entries.map(e => e.id)))} className="text-primary hover:underline">All</button>
                                <button onClick={() => setSelectedEntries(new Set())} className="text-muted-foreground hover:text-foreground">None</button>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        {entries.slice().reverse().map((entry) => (
                            <div key={entry.id} className="bg-secondary/20 p-3 rounded-lg border border-border/50">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2">
                                        {isAdmin && (
                                            <button onClick={() => toggleSelection(entry.id)} className={selectedEntries.has(entry.id) ? 'text-primary' : 'text-muted-foreground'}>
                                                {selectedEntries.has(entry.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                            </button>
                                        )}
                                        <span className="font-mono font-black">M{entry.matchNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-primary italic uppercase leading-none border border-primary/30 px-1.5 py-0.5 rounded">
                                            {entry.autoCycles + entry.teleopCycles} Cyc
                                        </span>
                                        {isAdmin && !selectedEntries.has(entry.id) && (
                                            <button onClick={() => handleDeleteMatch(entry.id)} className="text-muted-foreground hover:text-destructive">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="text-[10px] text-muted-foreground font-medium flex gap-2">
                                    <span>Climb: {entry.climbResult}</span>
                                    <span>•</span>
                                    <span>{entry.playedDefense ? `Def (${entry.defenseEffectiveness})` : 'No Def'}</span>
                                    {entry.incapacitated && <span className="text-destructive font-black uppercase ml-auto">INCAP</span>}
                                </div>
                                {entry.notes && <p className="text-[10px] leading-tight italic text-muted-foreground mt-2 border-l border-primary/20 pl-2">"{entry.notes}"</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamDetail;
