import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Counter } from '@/components/scouting/Counter';
import { ToggleField } from '@/components/scouting/ToggleField';
import { OptionSelector } from '@/components/scouting/OptionSelector';
import { RatingField } from '@/components/scouting/RatingField';
import { ScoutingEntry } from '@/lib/types';
import { saveEntry, generateId, getCurrentEvent, setCurrentEvent } from '@/lib/storage';

const ScoutMatch = () => {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  // Match info
  const [event, setEvent] = useState(getCurrentEvent());
  const [matchNumber, setMatchNumber] = useState(1);
  const [teamNumber, setTeamNumber] = useState('');

  // Autonomous
  const [autoFuelScored, setAutoFuelScored] = useState(0);
  const [autoHubScore, setAutoHubScore] = useState(false);
  const [autoClimb, setAutoClimb] = useState<'none' | 'low' | 'mid' | 'high'>('none');

  // Teleop
  const [teleopFuelActive, setTeleopFuelActive] = useState(0);
  const [teleopFuelCycles, setTeleopFuelCycles] = useState<'low' | 'medium' | 'high'>('low');
  const [defensePlayed, setDefensePlayed] = useState(false);
  const [defenseEffectiveness, setDefenseEffectiveness] = useState(3);

  // Endgame
  const [climbResult, setClimbResult] = useState<'none' | 'attempted' | 'low' | 'mid' | 'high'>('none');
  const [climbStability, setClimbStability] = useState(3);

  // Overall
  const [driverSkill, setDriverSkill] = useState(3);
  const [robotSpeed, setRobotSpeed] = useState(3);
  const [reliability, setReliability] = useState(3);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!teamNumber) {
      alert('Please enter a team number');
      return;
    }

    const entry: ScoutingEntry = {
      id: generateId(),
      event,
      matchNumber,
      teamNumber: parseInt(teamNumber),
      timestamp: Date.now(),
      autoFuelScored,
      autoHubScore,
      autoClimb,
      teleopFuelActive,
      teleopFuelCycles,
      defensePlayed,
      defenseEffectiveness: defensePlayed ? defenseEffectiveness : 0,
      climbResult,
      climbStability,
      driverSkill,
      robotSpeed,
      reliability,
      notes,
    };

    saveEntry(entry);
    setCurrentEvent(event);
    setSaved(true);
    
    setTimeout(() => {
      // Reset form for next entry
      setMatchNumber(prev => prev + 1);
      setTeamNumber('');
      setAutoFuelScored(0);
      setAutoHubScore(false);
      setAutoClimb('none');
      setTeleopFuelActive(0);
      setTeleopFuelCycles('low');
      setDefensePlayed(false);
      setDefenseEffectiveness(3);
      setClimbResult('none');
      setClimbStability(3);
      setDriverSkill(3);
      setRobotSpeed(3);
      setReliability(3);
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
                onChange={(e) => setEvent(e.target.value)}
                placeholder="Event name or code"
                className="w-full h-12 px-4 rounded-lg bg-secondary text-foreground border-0 focus:ring-2 ring-primary"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Match #</label>
                <input
                  type="number"
                  value={matchNumber}
                  onChange={(e) => setMatchNumber(parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-full h-12 px-4 rounded-lg bg-secondary text-foreground font-mono text-lg font-bold text-center border-0 focus:ring-2 ring-primary"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Team #</label>
                <input
                  type="number"
                  value={teamNumber}
                  onChange={(e) => setTeamNumber(e.target.value)}
                  placeholder="0000"
                  className="w-full h-12 px-4 rounded-lg bg-secondary text-foreground font-mono text-lg font-bold text-center border-0 focus:ring-2 ring-primary"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Autonomous */}
        <section className="stat-card">
          <h2 className="section-header">Autonomous</h2>
          <Counter 
            value={autoFuelScored} 
            onChange={setAutoFuelScored} 
            label="Fuel Scored" 
          />
          <ToggleField 
            value={autoHubScore} 
            onChange={setAutoHubScore} 
            label="Hub Score?" 
          />
          <OptionSelector
            value={autoClimb}
            onChange={(v) => setAutoClimb(v as typeof autoClimb)}
            label="Auto Climb"
            options={[
              { value: 'none' as const, label: 'None' },
              { value: 'low' as const, label: 'Low' },
              { value: 'mid' as const, label: 'Mid' },
              { value: 'high' as const, label: 'High' },
            ] as const}
          />
        </section>

        {/* Teleop */}
        <section className="stat-card">
          <h2 className="section-header">Teleop</h2>
          <Counter 
            value={teleopFuelActive} 
            onChange={setTeleopFuelActive} 
            label="Fuel (Hub Active)" 
          />
          <OptionSelector
            value={teleopFuelCycles}
            onChange={(v) => setTeleopFuelCycles(v as typeof teleopFuelCycles)}
            label="Fuel Cycles"
            options={[
              { value: 'low' as const, label: 'Low' },
              { value: 'medium' as const, label: 'Medium' },
              { value: 'high' as const, label: 'High' },
            ] as const}
          />
          <ToggleField 
            value={defensePlayed} 
            onChange={setDefensePlayed} 
            label="Played Defense?" 
          />
          {defensePlayed && (
            <RatingField
              value={defenseEffectiveness}
              onChange={setDefenseEffectiveness}
              label="Defense Effectiveness"
            />
          )}
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
              { value: 'attempted' as const, label: 'Attempted' },
              { value: 'low' as const, label: 'Low' },
              { value: 'mid' as const, label: 'Mid' },
              { value: 'high' as const, label: 'High' },
            ] as const}
          />
          {climbResult !== 'none' && climbResult !== 'attempted' && (
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
          <RatingField
            value={driverSkill}
            onChange={setDriverSkill}
            label="Driver Skill"
          />
          <RatingField
            value={robotSpeed}
            onChange={setRobotSpeed}
            label="Robot Speed"
          />
          <RatingField
            value={reliability}
            onChange={setReliability}
            label="Reliability"
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
          className="touch-button w-full bg-primary text-primary-foreground"
        >
          <Save className="w-5 h-5" />
          Save Entry
        </button>
      </div>
    </div>
  );
};

export default ScoutMatch;
