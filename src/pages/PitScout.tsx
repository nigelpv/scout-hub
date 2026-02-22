import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, CheckCircle, Box, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ToggleField } from '@/components/scouting/ToggleField';
import { OptionSelector } from '@/components/scouting/OptionSelector';
import { Counter } from '@/components/scouting/Counter';
import { toast } from 'sonner';

type Step = 'select-team' | 'form';

import { savePitEntry } from '@/lib/storage';

const PitScout = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('select-team');
    const [teamNumber, setTeamNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Form State
    const [autoClimb, setAutoClimb] = useState<boolean>(false);
    const [autoClimbPosition, setAutoClimbPosition] = useState<'side' | 'middle'>('side');

    const [robotClimb, setRobotClimb] = useState<boolean>(false);
    const [climbLevel, setClimbLevel] = useState<'low' | 'mid' | 'high'>('low');

    const [estimatedPoints, setEstimatedPoints] = useState(0);

    const [avgBalls, setAvgBalls] = useState(0);
    const [maxBalls, setMaxBalls] = useState(0);

    const [canGoUnderTrench, setCanGoUnderTrench] = useState(false);
    const [canGoOverBump, setCanGoOverBump] = useState(false);

    const handleNext = () => {
        if (!teamNumber || isNaN(parseInt(teamNumber))) {
            toast.error('Please enter a valid team number');
            return;
        }
        setStep('form');
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        const formData = {
            teamNumber: parseInt(teamNumber),
            estimatedPoints,
            autoClimb: autoClimb ? autoClimbPosition : 'none' as const,
            robotClimb: robotClimb ? climbLevel : 'none' as const,
            avgBalls,
            maxBalls,
            canGoUnderTrench,
            canGoOverBump,
            timestamp: Date.now()
        };

        const result = await savePitEntry(formData);

        if (result.success) {
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
                            <ToggleField
                                value={autoClimb}
                                onChange={setAutoClimb}
                                label="Can you climb in auto?"
                            />
                            {autoClimb && (
                                <div className="pt-2">
                                    <OptionSelector
                                        value={autoClimbPosition}
                                        onChange={(v) => setAutoClimbPosition(v as any)}
                                        label="Climb Position"
                                        options={[
                                            { value: 'side', label: 'Side' },
                                            { value: 'middle', label: 'Middle' },
                                        ]}
                                    />
                                </div>
                            )}
                        </section>

                        {/* Climbing */}
                        <section className="stat-card">
                            <h2 className="section-header">Robot Climbing</h2>
                            <ToggleField
                                value={robotClimb}
                                onChange={setRobotClimb}
                                label="Can your robot climb?"
                            />
                            {robotClimb && (
                                <div className="pt-2">
                                    <OptionSelector
                                        value={climbLevel}
                                        onChange={(v) => setClimbLevel(v as any)}
                                        label="Highest Level"
                                        options={[
                                            { value: 'low', label: 'L1' },
                                            { value: 'mid', label: 'L2' },
                                            { value: 'high', label: 'L3' },
                                        ]}
                                    />
                                </div>
                            )}
                        </section>

                        {/* Scoring */}
                        <section className="stat-card">
                            <h2 className="section-header">Capacity & Scoring</h2>
                            <Counter
                                value={estimatedPoints}
                                onChange={setEstimatedPoints}
                                max={999}
                                label="Estimated Point Total"
                            />
                            <Counter
                                value={avgBalls}
                                onChange={setAvgBalls}
                                max={999}
                                label="Avg. Balls Scored"
                            />
                            <Counter
                                value={maxBalls}
                                onChange={setMaxBalls}
                                label="Robot Ball Capacity"
                            />
                        </section>

                        {/* Navigation */}
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

                        {/* Submit Bar */}
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default PitScout;
