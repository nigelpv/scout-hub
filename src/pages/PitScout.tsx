import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, CheckCircle, Box, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ToggleField } from '@/components/scouting/ToggleField';
import { OptionSelector } from '@/components/scouting/OptionSelector';
import { toast } from 'sonner';

type Step = 'select-team' | 'form';

import { savePitEntry } from '@/lib/storage';

const PitScout = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('select-team');
    const [teamNumber, setTeamNumber] = useState('');
    const [scoutName, setScoutName] = useState(localStorage.getItem('scout_name') || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Form State
    const [autoClimbPosition, setAutoClimbPosition] = useState<'none' | 'side' | 'middle'>('none');
    const [climbLevel, setClimbLevel] = useState<'none' | 'low' | 'mid' | 'high'>('none');

    const [estimatedPoints, setEstimatedPoints] = useState(0);
    const [isPasserBot, setIsPasserBot] = useState(false);
    const [avgBalls, setAvgBalls] = useState<string>('');
    const [maxBalls, setMaxBalls] = useState<string>('');

    const [canGoUnderTrench, setCanGoUnderTrench] = useState(false);
    const [canGoOverBump, setCanGoOverBump] = useState(false);

    const [intakeType, setIntakeType] = useState('');
    const [shooterType, setShooterType] = useState<'none' | 'turret' | 'variable_angle' | 'fixed' | 'other'>('none');

    const handleNext = () => {
        if (!teamNumber || isNaN(parseInt(teamNumber))) {
            toast.error('Please enter a valid team number');
            return;
        }

        if (!scoutName.trim()) {
            toast.error('Please enter your name');
            return;
        }

        setStep('form');
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        const formData = {
            teamNumber: parseInt(teamNumber),
            scoutName: scoutName.trim(),
            estimatedPoints,
            isPasserBot,
            autoClimb: autoClimbPosition,
            robotClimb: climbLevel,
            avgBalls: parseFloat(avgBalls) || 0,
            maxBalls: parseFloat(maxBalls) || 0,
            canGoUnderTrench,
            canGoOverBump,
            intakeType,
            shooterType,
            timestamp: Date.now()
        };

        const result = await savePitEntry(formData);

        if (result.success) {
            localStorage.setItem('scout_name', scoutName.trim());
            setSubmitted(true);
            if (result.offline) {
                toast.success('Offline! Pit data saved locally and will sync when online.');
            } else {
                toast.success('Pit scouting form saved!');
            }

            setTimeout(() => {
                navigate('/');
            }, 2000);
        } else {
            toast.error('Failed to save pit data. Please try again.');
        }

        setIsSubmitting(false);
    };


    if (submitted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="text-center animate-in zoom-in duration-300">
                    <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Form Submitted!</h2>
                    <p className="text-muted-foreground">Team {teamNumber} pit data recorded.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            <PageHeader
                title={step === 'select-team' ? 'Select Team' : `Pit Scout: ${teamNumber}`}
                showBack={true}
            />

            <div className="p-4 space-y-6 max-w-lg mx-auto">
                {step === 'select-team' ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <section className="stat-card">
                            <h2 className="section-header">Target Team</h2>
                            <div className="py-4">
                                <label className="text-sm text-muted-foreground block mb-2">Team Number</label>
                                <input
                                    type="number"
                                    value={teamNumber}
                                    onChange={(e) => setTeamNumber(e.target.value)}
                                    placeholder="Enter team number..."
                                    autoFocus
                                    className="w-full h-16 px-6 rounded-xl bg-secondary text-foreground font-mono text-3xl font-bold text-center border-0 focus:ring-2 ring-primary transition-all shadow-inner"
                                />
                            </div>
                        </section>

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

                        <button
                            onClick={handleNext}
                            className="touch-button w-full bg-primary text-primary-foreground group"
                        >
                            Start Scouting
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <div className="glass-card p-6 text-center">
                            <Box className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">
                                Enter the team number found on the robot's bumper to begin the pit questionnaire.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                        {/* Auto Capabilities */}
                        <section className="stat-card">
                            <h2 className="section-header">Autonomous</h2>
                            <OptionSelector
                                value={autoClimbPosition}
                                onChange={(v) => setAutoClimbPosition(v as typeof autoClimbPosition)}
                                label="Auto Climb Position"
                                options={[
                                    { value: 'none', label: 'Cannot Climb' },
                                    { value: 'side', label: 'Side' },
                                    { value: 'middle', label: 'Middle' },
                                ]}
                            />
                        </section>

                        {/* Climbing */}
                        <section className="stat-card">
                            <h2 className="section-header">Robot Climbing</h2>
                            <OptionSelector
                                value={climbLevel}
                                onChange={(v) => setClimbLevel(v as typeof climbLevel)}
                                label="Highest Climb Level"
                                options={[
                                    { value: 'none', label: 'Cannot Climb' },
                                    { value: 'low', label: 'L1 (Low)' },
                                    { value: 'mid', label: 'L2 (Mid)' },
                                    { value: 'high', label: 'L3 (High)' },
                                ]}
                            />
                        </section>


                        {/* Scoring */}
                        <section className="stat-card">
                            <h2 className="section-header">Capacity & Scoring</h2>
                            <div className="py-3 space-y-4">
                                <div>
                                    <label className="text-foreground font-medium block mb-2">Estimated Point Total</label>
                                    <input
                                        type="number"
                                        value={estimatedPoints}
                                        onChange={(e) => setEstimatedPoints(parseInt(e.target.value) || 0)}
                                        placeholder="e.g. 50"
                                        min={0}
                                        className="w-full h-11 px-4 rounded-lg bg-secondary text-foreground border-0 focus:ring-2 ring-primary font-mono"
                                    />
                                </div>
                                <ToggleField
                                    value={isPasserBot}
                                    onChange={setIsPasserBot}
                                    label="Passer Bot?"
                                />
                                <div>
                                    <label className="text-foreground font-medium block mb-2">Avg. Balls Scored per Match</label>
                                    <input
                                        type="number"
                                        value={avgBalls}
                                        onChange={(e) => setAvgBalls(e.target.value)}
                                        placeholder="e.g. 12"
                                        min={0}
                                        className="w-full h-11 px-4 rounded-lg bg-secondary text-foreground border-0 focus:ring-2 ring-primary font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="text-foreground font-medium block mb-2">Hopper / Ball Capacity</label>
                                    <input
                                        type="number"
                                        value={maxBalls}
                                        onChange={(e) => setMaxBalls(e.target.value)}
                                        placeholder="e.g. 6"
                                        min={0}
                                        className="w-full h-11 px-4 rounded-lg bg-secondary text-foreground border-0 focus:ring-2 ring-primary font-mono"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Robot Hardware */}
                        <section className="stat-card">
                            <h2 className="section-header">Robot Hardware</h2>
                            <OptionSelector
                                value={shooterType}
                                onChange={(v) => setShooterType(v as typeof shooterType)}
                                label="Shooter Type"
                                options={[
                                    { value: 'none', label: 'None / Unknown' },
                                    { value: 'turret', label: 'Turret' },
                                    { value: 'variable_angle', label: 'Variable Angle' },
                                    { value: 'fixed', label: 'Fixed' },
                                    { value: 'other', label: 'Other' },
                                ]}
                            />
                            <div className="py-3">
                                <label className="text-foreground font-medium block mb-2">Intake Type</label>
                                <input
                                    type="text"
                                    value={intakeType}
                                    onChange={(e) => setIntakeType(e.target.value)}
                                    placeholder="e.g. wide ground intake, over-bumper..."
                                    className="w-full h-11 px-4 rounded-lg bg-secondary text-foreground border-0 focus:ring-2 ring-primary"
                                />
                            </div>
                        </section>

                        <section className="stat-card">
                            <h2 className="section-header">Obstacles</h2>
                            <ToggleField
                                value={canGoUnderTrench}
                                onChange={setCanGoUnderTrench}
                                label="Can go under the trench?"
                            />
                            <ToggleField
                                value={canGoOverBump}
                                onChange={setCanGoOverBump}
                                label="Can go over the bump?"
                            />
                        </section>

                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border z-10">
                            <div className="max-w-lg mx-auto">
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="touch-button w-full bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        'Saving...'
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Save Pit Data
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div >
                )}
            </div >
        </div >
    );
};

export default PitScout;
