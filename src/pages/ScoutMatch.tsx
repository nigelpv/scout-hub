import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
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

    // Match Info
    const [startingPosition, setStartingPosition] = useState<'outpost_trench' | 'outpost_bump' | 'hub' | 'depot_trench' | 'depot_bump'>('hub');

    // Autonomous
    const [autoCycles, setAutoCycles] = useState(0);
    const [hoppersPassedAuto, setHoppersPassedAuto] = useState(0);
    const [autoClimb, setAutoClimb] = useState<'none' | 'side' | 'middle' | 'failed_attempt'>('none');
    const [autoObstacle, setAutoObstacle] = useState<'none' | 'outpost_trench' | 'depot_trench' | 'outpost_bump' | 'depot_bump' | 'both'>('none');

    // Teleop
    const [teleopCycles, setTeleopCycles] = useState(0);
    const [hoppersPassed, setHoppersPassed] = useState(0);
    const [playedDefense, setPlayedDefense] = useState(true);
    const [defenseEffectiveness, setDefenseEffectiveness] = useState(0);
    const [defenseLocation, setDefenseLocation] = useState<string[]>([]);
    const [teleopObstacle, setTeleopObstacle] = useState<'none' | 'trench' | 'bump' | 'both'>('none');
    const [beachingType, setBeachingType] = useState<string[]>([]);
    const [herdsFuelThroughTrench, setHerdsFuelThroughTrench] = useState(false);

    // Endgame
    const [climbResult, setClimbResult] = useState<'none' | 'L1' | 'L2' | 'L3' | 'failed_attempt'>('none');
    const [climbPosition, setClimbPosition] = useState<'none' | 'side' | 'center'>('none');
    const [driverSkill, setDriverSkill] = useState(3);
    const [incapacitated, setIncapacitated] = useState(false);

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
            matchNumber: parsedMatch,
            teamNumber: parsedTeam,
            scoutName: scoutName.trim(),
            timestamp: Date.now(),
            startingPosition,
            autoCycles,
            hoppersPassedAuto,
            autoClimb,
            autoObstacle,
            teleopCycles,
            hoppersPassed,
            playedDefense,
            defenseLocation,
            defenseEffectiveness,
            teleopObstacle,
            beachingType,
            herdsFuelThroughTrench,
            climbResult,
            climbPosition,
            driverSkill,
            incapacitated,
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
            setStartingPosition('hub');
            setAutoCycles(0);
            setHoppersPassedAuto(0);
            setAutoClimb('none');
            setAutoObstacle('none');
            setTeleopCycles(0);
            setHoppersPassed(0);
            setPlayedDefense(true);
            setDefenseEffectiveness(0);
            setDefenseLocation([]);
            setTeleopObstacle('none');
            setBeachingType([]);
            setHerdsFuelThroughTrench(false);
            setClimbResult('none');
            setClimbPosition('none');
            setDriverSkill(3);
            setIncapacitated(false);
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
        <div className="min-h-screen bg-background pb-32">
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
                                        setMatchNumber(val === '' ? '' as unknown as number : parseInt(val));
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
                    <OptionSelector
                        value={startingPosition}
                        onChange={(v) => setStartingPosition(v as typeof startingPosition)}
                        label="Starting Position"
                        options={[
                            { value: 'outpost_trench' as const, label: 'Outpost Trench' },
                            { value: 'outpost_bump' as const, label: 'Outpost Bump' },
                            { value: 'hub' as const, label: 'Hub' },
                            { value: 'depot_trench' as const, label: 'Depot Trench' },
                            { value: 'depot_bump' as const, label: 'Depot Bump' },
                        ]}
                    />

                    <OptionSelector
                        value={autoClimb}
                        onChange={(v) => setAutoClimb(v as typeof autoClimb)}
                        label="Auto Climb"
                        options={[
                            { value: 'none' as const, label: 'None' },
                            { value: 'side' as const, label: 'Side' },
                            { value: 'middle' as const, label: 'Middle' },
                            { value: 'failed_attempt' as const, label: 'Failed Attempt' },
                        ]}
                    />
                    <OptionSelector
                        value={autoObstacle}
                        onChange={(v) => setAutoObstacle(v as typeof autoObstacle)}
                        label="Travel (Auto)"
                        options={[
                            { value: 'none' as const, label: 'None' },
                            { value: 'outpost_trench' as const, label: 'Outpost Trench' },
                            { value: 'depot_trench' as const, label: 'Depot Trench' },
                            { value: 'outpost_bump' as const, label: 'Outpost Bump' },
                            { value: 'depot_bump' as const, label: 'Depot Bump' },
                            { value: 'both' as const, label: 'Both' },
                        ]}
                    />
                </section>

                {/* Teleop */}
                <section className="stat-card">
                    <h2 className="section-header">Teleop</h2>
                    <OptionSelector
                        value={teleopObstacle}
                        onChange={(v) => setTeleopObstacle(v as typeof teleopObstacle)}
                        label="Travel Mode (Teleop)"
                        options={[
                            { value: 'none' as const, label: 'None' },
                            { value: 'trench' as const, label: 'Trench' },
                            { value: 'bump' as const, label: 'Bump' },
                            { value: 'both' as const, label: 'Both' },
                        ]}
                    />

                    <div className="space-y-4 pt-2">
                        <ToggleField
                            value={playedDefense}
                            onChange={setPlayedDefense}
                            label="Played Defense?"
                        />

                        {playedDefense && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <RatingField
                                    value={defenseEffectiveness}
                                    onChange={setDefenseEffectiveness}
                                    label="Defense Effectiveness"
                                />
                                <OptionSelector
                                    multiSelect={true}
                                    value={defenseLocation}
                                    onChange={(v) => {
                                        if (v.includes('none')) {
                                            const wasAlreadyNone = defenseLocation.includes('none');
                                            if (!wasAlreadyNone) {
                                                setDefenseLocation(['none']);
                                            } else if (v.length > 1) {
                                                setDefenseLocation(v.filter(x => x !== 'none'));
                                            } else {
                                                setDefenseLocation(v);
                                            }
                                        } else {
                                            setDefenseLocation(v);
                                        }
                                    }}
                                    label="Defense Location"
                                    options={[
                                        { value: 'none', label: 'N/A' },
                                        { value: 'neutral', label: 'Neutral' },
                                        { value: 'our_alliance', label: 'Our Alliance' },
                                        { value: 'their_alliance', label: 'Their Alliance' },
                                    ]}
                                />
                            </div>
                        )}
                    </div>

                    <OptionSelector
                        multiSelect={true}
                        value={beachingType}
                        onChange={setBeachingType}
                        label="Beaching Type"
                        options={[
                            { value: 'beached_on_bump', label: 'Beached on Bump' },
                            { value: 'beached_on_fuel_off_bump', label: 'Beached on Fuel (off bump)' },
                            { value: 'other', label: 'Other' },
                        ]}
                    />
                    <ToggleField
                        value={herdsFuelThroughTrench}
                        onChange={setHerdsFuelThroughTrench}
                        label="Pushes Fuel Through Trench?"
                    />
                </section>

                {/* Endgame Climb */}
                <section className="stat-card">
                    <h2 className="section-header">Endgame Climb</h2>
                    <OptionSelector
                        value={climbResult}
                        onChange={(v) => setClimbResult(v as typeof climbResult)}
                        label="Climb Height"
                        options={[
                            { value: 'none' as const, label: 'No Climb' },
                            { value: 'L1' as const, label: 'L1' },
                            { value: 'L2' as const, label: 'L2' },
                            { value: 'L3' as const, label: 'L3' },
                            { value: 'failed_attempt' as const, label: 'Failed Attempt' },
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
                        value={driverSkill}
                        onChange={setDriverSkill}
                        label="Driver Skill"
                    />
                    <ToggleField
                        value={incapacitated}
                        onChange={setIncapacitated}
                        label="Incapacitated?"
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
                <div className="h-[280px]"></div> {/* Space for sticky scoring bar */}
            </div>

            {/* Sticky Scoring Bar */}
            <div className="fixed bottom-[80px] left-0 right-0 px-3 py-2 bg-background/95 backdrop-blur-md border-t border-primary/10 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.3)] z-40 transition-all">
                <div className="max-w-xl mx-auto space-y-2">
                    {/* Auto Row */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center justify-between gap-2 bg-secondary/10 p-1.5 rounded-xl border border-primary/5">
                            <button onClick={() => setAutoCycles(prev => Math.max(0, prev - 1))} className="flex-1 h-10 rounded-lg bg-secondary flex items-center justify-center text-2xl font-bold active:scale-95 transition-transform shadow-sm">-</button>
                            <div className="flex flex-col items-center min-w-[50px]">
                                <span className="text-[8px] uppercase font-black text-muted-foreground tracking-tighter">Auto Hub</span>
                                <span className="text-xl font-mono font-black text-primary">{autoCycles}</span>
                            </div>
                            <button onClick={() => setAutoCycles(prev => prev + 1)} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold active:scale-95 transition-transform shadow-md shadow-primary/10">+</button>
                        </div>
                        <div className="flex items-center justify-between gap-2 bg-secondary/10 p-1.5 rounded-xl border border-primary/5">
                            <button onClick={() => setHoppersPassedAuto(prev => Math.max(0, prev - 1))} className="flex-1 h-10 rounded-lg bg-secondary flex items-center justify-center text-2xl font-bold active:scale-95 transition-transform shadow-sm">-</button>
                            <div className="flex flex-col items-center min-w-[50px]">
                                <span className="text-[8px] uppercase font-black text-muted-foreground tracking-tighter">Auto Pass</span>
                                <span className="text-xl font-mono font-black text-primary">{hoppersPassedAuto}</span>
                            </div>
                            <button onClick={() => setHoppersPassedAuto(prev => prev + 1)} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold active:scale-95 transition-transform shadow-md shadow-primary/10">+</button>
                        </div>
                    </div>

                    {/* Teleop Row */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center justify-between gap-3 bg-secondary/10 p-1.5 rounded-xl border border-primary/10">
                            <button onClick={() => setTeleopCycles(prev => Math.max(0, prev - 1))} className="flex-1 h-10 rounded-lg bg-secondary flex items-center justify-center text-2xl font-bold active:scale-95 transition-transform shadow-sm">-</button>
                            <div className="flex flex-col items-center min-w-[55px]">
                                <span className="text-[9px] uppercase font-black text-primary/60 tracking-wider">Tele Hub</span>
                                <span className="text-xl font-mono font-black text-primary">{teleopCycles}</span>
                            </div>
                            <button onClick={() => setTeleopCycles(prev => prev + 1)} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold active:scale-95 transition-transform shadow-md shadow-primary/10">+</button>
                        </div>
                        <div className="flex items-center justify-between gap-3 bg-secondary/10 p-1.5 rounded-xl border border-primary/10">
                            <button onClick={() => setHoppersPassed(prev => Math.max(0, prev - 1))} className="flex-1 h-10 rounded-lg bg-secondary flex items-center justify-center text-2xl font-bold active:scale-95 transition-transform shadow-sm">-</button>
                            <div className="flex flex-col items-center min-w-[55px]">
                                <span className="text-[9px] uppercase font-black text-primary/60 tracking-wider">Tele Pass</span>
                                <span className="text-xl font-mono font-black text-primary">{hoppersPassed}</span>
                            </div>
                            <button onClick={() => setHoppersPassed(prev => prev + 1)} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold active:scale-95 transition-transform shadow-md shadow-primary/10">+</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border z-40">
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
