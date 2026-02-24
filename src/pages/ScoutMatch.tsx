import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Counter } from '@/components/scouting/Counter';
import { ToggleField } from '@/components/scouting/ToggleField';
import { OptionSelector } from '@/components/scouting/OptionSelector';
import { RatingField } from '@/components/scouting/RatingField';
import { ScoutingEntry } from '@/lib/types';
import { saveEntry, generateId, getCurrentEvent, setCurrentEvent } from '@/lib/storage';
import { toast } from 'sonner';
import { fetchTeamEvents, determineCurrentEvent, fetchMatchData, getTeamFromMatch } from '@/lib/tba';

const ScoutMatch = () => {
    const navigate = useNavigate();
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    // Match info
    const [event, setEvent] = useState(getCurrentEvent());
    const [scoutName, setScoutName] = useState(localStorage.getItem('scout_name') || '');
    const [matchNumber, setMatchNumber] = useState(1);
    const [teamNumber, setTeamNumber] = useState('');
    const [alliancePosition, setAlliancePosition] = useState('Red 1');
    const [loadingTBA, setLoadingTBA] = useState(false);

    // Event is configured in config.ts and storage.ts

    // Auto-fetch team number when match or position changes
    useEffect(() => {
        const updateTeam = async () => {
            if (!event || !matchNumber || !alliancePosition) return;

            setLoadingTBA(true);
            const matchData = await fetchMatchData(event, matchNumber);
            if (matchData) {
                const team = getTeamFromMatch(matchData, alliancePosition);
                if (team) {
                    setTeamNumber(team);
                }
            }
            setLoadingTBA(false);
        };

        const timer = setTimeout(updateTeam, 500); // Debounce
        return () => clearTimeout(timer);
    }, [event, matchNumber, alliancePosition]);

    // Autonomous
    const [autoCycles, setAutoCycles] = useState(0);
    const [autoPreload, setAutoPreload] = useState(false);
    const [autoPreloadScored, setAutoPreloadScored] = useState(false);
    const [autoPreloadCount, setAutoPreloadCount] = useState(0);
    const [autoClimb, setAutoClimb] = useState<'none' | 'side' | 'middle'>('none');

    // Teleop
    const [teleopCycles, setTeleopCycles] = useState(0);
    const [avgBallsScoredPerCycle, setAvgBallsScoredPerCycle] = useState(0);
    const [isPasserBot, setIsPasserBot] = useState(false);
    const [defenseRating, setDefenseRating] = useState(0);

    // Endgame
    const [climbResult, setClimbResult] = useState<'none' | 'low' | 'mid' | 'high'>('none');
    const [climbStability, setClimbStability] = useState(3);

    // Overall
    const [shootingRange, setShootingRange] = useState<'short' | 'medium' | 'long'>('short');
    const [obstacleNavigation, setObstacleNavigation] = useState<'none' | 'trench' | 'bump' | 'both'>('none');
    const [notes, setNotes] = useState('');

    const handleSubmit = async () => {
        const parsedMatch = typeof matchNumber === 'string' ? parseInt(matchNumber) : matchNumber;
        const parsedTeam = typeof teamNumber === 'string' ? parseInt(teamNumber) : teamNumber;

        if (!parsedMatch || isNaN(parsedMatch) || parsedMatch <= 0) {
            toast.error('Please enter a valid match number');
            return;
        }

        if (!scoutName.trim()) {
            toast.error('Please enter your name');
            return;
        }

        if (!parsedTeam || isNaN(parsedTeam) || parsedTeam <= 0) {
            toast.error('Please enter a valid team number');
            return;
        }

        setSaving(true);

        const entry: ScoutingEntry = {
            id: generateId(),
            event,
            matchNumber,
            teamNumber: parseInt(teamNumber),
            scoutName: scoutName.trim(),
            timestamp: Date.now(),
            autoCycles,
            autoPreload,
            autoPreloadScored: autoPreload ? autoPreloadScored : false,
            autoPreloadCount: autoPreload ? (autoPreloadScored ? 8 : autoPreloadCount) : 0,
            autoClimb,
            teleopCycles,
            avgBallsScoredPerCycle,
            isPasserBot,
            defenseRating,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            climbResult: climbResult as any,
            climbStability,
            shootingRange,
            obstacleNavigation,
            notes,
        };

        const { success, offline, limitReached } = await saveEntry(entry);
        setSaving(false);

        if (!success) {
            if (!limitReached) {
                toast.error('Failed to save entry. Please try again.');
            }
            return;
        }

        if (offline) {
            toast.info('Saved offline! Will sync automatically when service is restored.', {
                duration: 5000,
            });
        } else {
            toast.success('Entry saved to server!');
        }

        localStorage.setItem('scout_name', scoutName.trim());
        setCurrentEvent(event);
        setSaved(true);

        setTimeout(() => {
            // Reset form for next entry
            setMatchNumber(prev => prev + 1);
            setTeamNumber('');
            setAutoCycles(0);
            setAutoPreload(false);
            setAutoPreloadScored(false);
            setAutoPreloadCount(0);
            setAutoClimb('none');
            setTeleopCycles(0);
            setAvgBallsScoredPerCycle(0);
            setIsPasserBot(false);
            setDefenseRating(0);
            setClimbResult('none');
            setClimbStability(3);
            setShootingRange('short');
            setObstacleNavigation('none');
            setNotes('');
            setSaved(false);
        }, 1500);
    };

    if (saved) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="text-center">
                    <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Entry Saved!</h2>
                    <p className="text-muted-foreground">Ready for next match...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            <PageHeader title="Scout Match" />

            <div className="p-4 space-y-6">
                {/* Match Info */}
                <section className="stat-card">
                    <h2 className="section-header">Match Info</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-muted-foreground block mb-2">Event</label>
                            <input
                                type="text"
                                value={event}
                                readOnly
                                className="w-full h-12 px-4 rounded-lg bg-secondary/50 text-muted-foreground border-0 cursor-not-allowed font-mono"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground ml-1">Scouter Name</label>
                            <input
                                type="text"
                                value={scoutName}
                                onChange={(e) => setScoutName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full h-12 px-4 rounded-xl bg-secondary border-2 border-transparent focus:border-primary focus:bg-background outline-none transition-all font-medium"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-muted-foreground block mb-2">Match #</label>
                                <input
                                    type="number"
                                    value={matchNumber}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setMatchNumber(val === '' ? '' as any : parseInt(val));
                                    }}
                                    min={1}
                                    className="w-full h-12 px-4 rounded-lg bg-secondary text-foreground font-mono text-lg font-bold text-center border-0 focus:ring-2 ring-primary"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground block mb-2">Team #</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={teamNumber}
                                        onChange={(e) => setTeamNumber(e.target.value)}
                                        placeholder="0000"
                                        className="w-full h-12 px-4 rounded-lg bg-secondary text-foreground font-mono text-lg font-bold text-center border-0 focus:ring-2 ring-primary"
                                    />
                                    {loadingTBA && (
                                        <div className="absolute right-2 top-3">
                                            <Loader2 className="w-6 h-6 animate-spin text-primary opacity-50" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-muted-foreground block mb-2">Alliance Position</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Red 1', 'Red 2', 'Red 3', 'Blue 1', 'Blue 2', 'Blue 3'].map((pos) => (
                                    <button
                                        key={pos}
                                        onClick={() => setAlliancePosition(pos)}
                                        className={`h-12 rounded-lg font-bold text-sm transition-all ${alliancePosition === pos
                                            ? pos.startsWith('Red')
                                                ? 'bg-alliance-red text-white ring-2 ring-alliance-red ring-offset-2 ring-offset-background'
                                                : 'bg-alliance-blue text-white ring-2 ring-alliance-blue ring-offset-2 ring-offset-background'
                                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                                            }`}
                                    >
                                        {pos}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Autonomous */}
                <section className="stat-card">
                    <h2 className="section-header">Autonomous</h2>
                    <ToggleField
                        value={autoPreload}
                        onChange={setAutoPreload}
                        label="Preload?"
                    />
                    {autoPreload && (
                        <>
                            <ToggleField
                                value={autoPreloadScored}
                                onChange={(checked) => {
                                    setAutoPreloadScored(checked);
                                    if (checked) {
                                        // If they scored ALL, we don't need a specific count (it implies 8)
                                        // But we'll handle the logic in stats/saving
                                    }
                                }}
                                label="Scored ALL of Preload?"
                            />
                            {!autoPreloadScored && (
                                <Counter
                                    value={autoPreloadCount}
                                    onChange={setAutoPreloadCount}
                                    min={0}
                                    max={8}
                                    label="How many scored? (0-8)"
                                />
                            )}
                        </>
                    )}
                    <Counter
                        value={autoCycles}
                        onChange={setAutoCycles}
                        label="Auto Cycles"
                    />
                    <OptionSelector
                        value={autoClimb}
                        onChange={(v) => setAutoClimb(v as typeof autoClimb)}
                        label="Auto Climb"
                        options={[
                            { value: 'none' as const, label: 'None' },
                            { value: 'side' as const, label: 'Side' },
                            { value: 'middle' as const, label: 'Middle' },
                        ] as const}
                    />
                </section>

                {/* Teleop */}
                <section className="stat-card">
                    <h2 className="section-header">Teleop</h2>
                    <Counter
                        value={teleopCycles}
                        onChange={setTeleopCycles}
                        label="Teleop Cycles"
                    />
                    <Counter
                        value={avgBallsScoredPerCycle}
                        onChange={setAvgBallsScoredPerCycle}
                        label="Avg Balls Scored Per Cycle"
                    />
                    <ToggleField
                        value={isPasserBot}
                        onChange={setIsPasserBot}
                        label="Passer Bot"
                    />
                    <RatingField
                        value={defenseRating}
                        onChange={setDefenseRating}
                        label="Defense Rating"
                    />
                    <OptionSelector
                        value={shootingRange}
                        onChange={(v) => setShootingRange(v as typeof shootingRange)}
                        label="Shooting Range"
                        options={[
                            { value: 'short' as const, label: 'Short' },
                            { value: 'medium' as const, label: 'Medium' },
                            { value: 'long' as const, label: 'Long' },
                        ] as const}
                    />
                </section>

                {/* Endgame */}
                <section className="stat-card">
                    <h2 className="section-header">Endgame</h2>
                    <OptionSelector
                        value={climbResult}
                        onChange={(v) => setClimbResult(v as typeof climbResult)}
                        label="Climb Result"
                        options={[
                            { value: 'none' as const, label: 'None' },
                            { value: 'low' as const, label: 'Low' },
                            { value: 'mid' as const, label: 'Mid' },
                            { value: 'high' as const, label: 'High' },
                        ] as const}
                    />
                    {climbResult !== 'none' && (
                        <RatingField
                            value={climbStability}
                            onChange={setClimbStability}
                            label="Climb Stability"
                        />
                    )}
                </section>

                {/* Overall */}
                <section className="stat-card">
                    <h2 className="section-header">Overall Impressions</h2>
                    <OptionSelector
                        value={obstacleNavigation}
                        onChange={(v) => setObstacleNavigation(v as typeof obstacleNavigation)}
                        label="Travel"
                        options={[
                            { value: 'none' as const, label: 'None' },
                            { value: 'trench' as const, label: 'Go in trench' },
                            { value: 'bump' as const, label: 'Go over bump' },
                            { value: 'both' as const, label: 'Both' },
                        ] as const}
                    />
                    <div className="py-3">
                        <label className="text-foreground font-medium block mb-3">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Quick observations..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-lg bg-secondary text-foreground border-0 focus:ring-2 ring-primary resize-none"
                        />
                    </div>
                </section>
            </div>

            {/* Submit Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
                <button
                    onClick={handleSubmit}
                    disabled={saving || !matchNumber || !teamNumber || Number(matchNumber) <= 0 || Number(teamNumber) <= 0}
                    className="touch-button w-full bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    {saving ? 'Saving...' : 'Save Entry'}
                </button>
            </div>
        </div>
    );
};

export default ScoutMatch;
