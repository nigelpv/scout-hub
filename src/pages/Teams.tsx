import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, TrendingUp, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { getAllTeamStatsFromEntries, getRatingColor } from '@/lib/stats';
import { getEntries } from '@/lib/storage';
import { TeamStats } from '@/lib/types';

const Teams = () => {
  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeams = async () => {
      setLoading(true);
      const entries = await getEntries();
      const stats = getAllTeamStatsFromEntries(entries);
      setTeams(stats);
      setLoading(false);
    };
    loadTeams();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Teams" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <PageHeader title="Teams" />

      <div className="p-4">
        {teams.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">No teams scouted yet</p>
            <Link to="/scout" className="text-primary font-medium">
              Start scouting →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {teams.map((team, index) => (
              <Link
                key={team.teamNumber}
                to={`/team/${team.teamNumber}`}
                className="stat-card flex items-center gap-4 active:scale-[0.99] transition-transform"
              >
                {/* Rank */}
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-mono font-bold text-sm">
                  {index + 1}
                </div>

                {/* Team Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold">
                      {team.teamNumber}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {team.matchesPlayed} match{team.matchesPlayed !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm mt-1">
                    <span className="text-muted-foreground">
                      Climb: <span className={getRatingColor(team.climbSuccessRate, 100)}>{team.climbSuccessRate}%</span>
                    </span>
                    <span className="text-muted-foreground">
                      Cycles: <span className="text-foreground font-mono">{team.avgAutoCycles + team.avgTeleopCycles}</span>
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="flex items-center gap-1 text-primary">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-mono font-bold">{team.totalScore}</span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;
