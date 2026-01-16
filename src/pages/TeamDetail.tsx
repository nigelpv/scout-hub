import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatBar } from '@/components/scouting/StatBar';
import { calculateTeamStats, getRatingColor } from '@/lib/stats';
import { getEntriesForTeam } from '@/lib/storage';
import { Target, Zap, Trophy, Shield, User, Gauge, Wrench } from 'lucide-react';

const TeamDetail = () => {
  const { teamNumber } = useParams();
  const teamNum = parseInt(teamNumber || '0');
  const stats = calculateTeamStats(teamNum);
  const entries = getEntriesForTeam(teamNum);

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

  return (
    <div className="min-h-screen bg-background pb-8">
      <PageHeader title={`Team ${teamNum}`} />

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

        {/* Scoring */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Scoring</h2>
          </div>
          <div className="space-y-4">
            <StatBar value={stats.avgAutoFuel} max={15} label="Avg Auto Fuel" />
            <StatBar value={stats.avgTeleopFuel} max={30} label="Avg Teleop Fuel" />
          </div>
        </div>

        {/* Climbing */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-warning" />
            <h2 className="font-semibold">Climbing</h2>
          </div>
          <div className="space-y-4">
            <StatBar value={stats.climbSuccessRate} max={100} label="Climb Success" suffix="%" />
            <StatBar value={stats.highMidClimbRate} max={100} label="High/Mid Climb" suffix="%" />
          </div>
        </div>

        {/* Performance */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-info" />
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
          <h2 className="font-semibold mb-4">Recent Matches</h2>
          <div className="space-y-3">
            {entries.slice(-5).reverse().map((entry) => (
              <div key={entry.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-medium">Match {entry.matchNumber}</span>
                  <span className="text-sm text-muted-foreground">
                    {climbLabels[entry.climbResult]}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Auto: {entry.autoFuelScored}</span>
                  <span>Teleop: {entry.teleopFuelActive}</span>
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
