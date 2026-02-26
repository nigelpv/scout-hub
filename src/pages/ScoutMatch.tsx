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
    const [autoObstacle, setAutoObstacle] = useState<'none' | 'trench' | 'bump' | 'both'>('none');

    // Teleop
    const [teleopCycles, setTeleopCycles] = useState(0);
    const [defenseType, setDefenseType] = useState<'none' | 'pushing' | 'blocking' | 'poaching'>('none');
    const [defenseLocation, setDefenseLocation] = useState<'none' | 'neutral' | 'our_alliance' | 'their_alliance'>('none');
    const [shootingRange, setShootingRange] = useState<'alliance' | 'close_neutral' | 'far_neutral' | 'opponent' | null>(null);
    const [teleopObstacle, setTeleopObstacle] = useState<'none' | 'trench' | 'bump' | 'both'>('none');
    const [fuelBeaching, setFuelBeaching] = useState(false);
    const [fuelBeachingType, setFuelBeachingType] = useState<'none' | 'off_bump' | 'random'>('none');

    // Endgame
    const [climbResult, setClimbResult] = useState<'none' | 'low' | 'mid' | 'high'>('none');
    const [climbPosition, setClimbPosition] = useState<'none' | 'side' | 'center'>('none');
    const [climbStability, setClimbStability] = useState(0);

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
            autoPreloadScored,
            autoPreloadCount,
            autoClimb,
            autoObstacle,
            teleopCycles,
            defenseType,
            defenseLocation,
            shootingRange,
            teleopObstacle,
            fuelBeaching,
            fuelBeachingType,
            climbResult,
            climbPosition,
            climbStability,
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
            setAutoObstacle('none');
            setTeleopCycles(0);
            setDefenseType('none');
            setDefenseLocation('none');
            setShootingRange(null);
            setTeleopObstacle('none');
            setFuelBeaching(false);
            setFuelBeachingType('none');
            setClimbResult('none');
            setClimbPosition('none');
            setClimbStability(0);
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
                    <ToggleField
                        value={autoPreloadScored}
                        onChange={setAutoPreloadScored}
                        label="Scored ALL of Preload?"
                    />
                    <Counter
                        value={autoPreloadCount}
                        onChange={setAutoPreloadCount}
                        min={0}
                        max={8}
                        label="How many preload scored? (0–8)"
                    />
                    <Counter
                        value={autoCycles}
                        onChange={setAutoCycles}
                        label="Hoppers Shot into Hub (Auto)"
                    />
                    <OptionSelector
                        value={autoClimb}
                        onChange={(v) => setAutoClimb(v as typeof autoClimb)}
                        label="Auto Climb"
                        options={[
                            { value: 'none' as const, label: 'None' },
                            { value: 'side' as const, label: 'Side' },
                            { value: 'middle' as const, label: 'Middle' },
                        ]}
                    />
                    <OptionSelector
                        value={autoObstacle}
                        onChange={(v) => setAutoObstacle(v as typeof autoObstacle)}
                        label="Travel (Auto)"
                        options={[
                            { value: 'none' as const, label: 'None' },
                            { value: 'trench' as const, label: 'Trench' },
                            { value: 'bump' as const, label: 'Bump' },
                            { value: 'both' as const, label: 'Both' },
                        ]}
                    />
                </section>

                {/* Teleop */}
                <section className="stat-card">
                    <h2 className="section-header">Teleop</h2>
                    <Counter
                        value={teleopCycles}
                        onChange={setTeleopCycles}
                        label="Hoppers Shot into Hub (Teleop)"
                    />
                    <OptionSelector
                        value={defenseType}
                        onChange={(v) => setDefenseType(v as typeof defenseType)}
                        label="Defense Type"
                        options={[
                            { value: 'none' as const, label: 'Did Not Play' },
                            { value: 'pushing' as const, label: 'Pushing' },
                            { value: 'blocking' as const, label: 'Blocking' },
                            { value: 'poaching' as const, label: 'Poaching' },
                        ]}
                    />
                    <OptionSelector
                        value={defenseLocation}
                        onChange={(v) => setDefenseLocation(v as typeof defenseLocation)}
                        label="Defense Location"
                        options={[
                            { value: 'none' as const, label: 'N/A' },
                            { value: 'neutral' as const, label: 'Neutral' },
                            { value: 'our_alliance' as const, label: 'Our Alliance' },
                            { value: 'their_alliance' as const, label: 'Their Alliance' },
                        ]}
                    />
                    <OptionSelector
                        value={shootingRange ?? 'alliance'}
                        onChange={(v) => setShootingRange(v as typeof shootingRange)}
                        label="Shooting Zone"
                        options={[
                            { value: 'alliance' as const, label: 'Alliance Zone' },
                            { value: 'close_neutral' as const, label: 'Close Neutral' },
                            { value: 'far_neutral' as const, label: 'Far Neutral' },
                            { value: 'opponent' as const, label: 'Opponent Zone' },
                        ]}
                    />
                    <OptionSelector
                        value={teleopObstacle}
                        onChange={(v) => setTeleopObstacle(v as typeof teleopObstacle)}
                        label="Travel (Teleop)"
                        options={[
                            { value: 'none' as const, label: 'None' },
                            { value: 'trench' as const, label: 'Trench' },
                            { value: 'bump' as const, label: 'Bump' },
                            { value: 'both' as const, label: 'Both' },
                        ]}
                    />
                    <ToggleField
                        value={fuelBeaching}
                        onChange={setFuelBeaching}
                        label="Fuel Beaching?"
                    />
                    <OptionSelector
                        value={fuelBeachingType}
                        onChange={(v) => setFuelBeachingType(v as typeof fuelBeachingType)}
                        label="Beaching Type"
                        options={[
                            { value: 'none' as const, label: 'N/A' },
                            { value: 'off_bump' as const, label: 'Off Bump' },
                            { value: 'random' as const, label: 'Random' },
                        ]}
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
                        ]}
                    />
                    <OptionSelector
                        value={climbPosition}
                        onChange={(v) => setClimbPosition(v as typeof climbPosition)}
                        label="Climb Position"
                        options={[
                            { value: 'none' as const, label: 'N/A' },
                            { value: 'side' as const, label: 'Side' },
                            { value: 'center' as const, label: 'Center' },
                        ]}
                    />
                    <RatingField
                        value={climbStability}
                        onChange={setClimbStability}
                        label="Climb Stability"
                    />
                </section>

                {/* Notes */}
                <section className="stat-card">
                    <h2 className="section-header">Notes</h2>
                    <div className="py-3">
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
                    disabled={saving || !matchNumber || !teamNumber || parseInt(matchNumber as any) <= 0 || parseInt(teamNumber as any) <= 0}
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
