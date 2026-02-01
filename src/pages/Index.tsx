import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Users, Trophy, Database, Loader2 } from 'lucide-react';
import { getEntries, ENTRY_LIMIT } from '@/lib/storage';
import { getUniqueTeamsFromEntries } from '@/lib/stats';

const Index = () => {
  const [entriesCount, setEntriesCount] = useState(0);
  const [teamsCount, setTeamsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      const entries = await getEntries();
      setEntriesCount(entries.length);
      setTeamsCount(getUniqueTeamsFromEntries(entries).length);
      setLoading(false);
    };
    loadStats();
  }, []);

  const getLimitColor = () => {
    if (entriesCount >= ENTRY_LIMIT) return 'text-destructive';
    if (entriesCount >= ENTRY_LIMIT * 0.8) return 'text-warning';
    return 'text-foreground';
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-8">
      {/* Header */}
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium mb-4">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse-subtle" />
          FRC 2026
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">REBUILT</h1>
        <p className="text-muted-foreground">Match Scouting System</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="stat-card text-center">
          <Database className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          ) : (
            <div className="flex flex-col items-center">
              <p className={`font-mono text-xl font-bold ${getLimitColor()}`}>
                {entriesCount} <span className="text-xs text-muted-foreground font-normal">/ {ENTRY_LIMIT}</span>
              </p>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Total Entries</p>
        </div>
        <div className="stat-card text-center">
          <Users className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          ) : (
            <p className="font-mono text-2xl font-bold">{teamsCount}</p>
          )}
          <p className="text-xs text-muted-foreground">Teams</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="space-y-3">
        <Link
          to="/scout"
          className="touch-button w-full bg-primary text-primary-foreground"
        >
          <ClipboardList className="w-5 h-5" />
          Scout a Match
        </Link>

        <Link
          to="/teams"
          className="touch-button w-full bg-secondary text-secondary-foreground"
        >
          <Users className="w-5 h-5" />
          View Teams
        </Link>

        <Link
          to="/picklist"
          className="touch-button w-full bg-secondary text-secondary-foreground"
        >
          <Trophy className="w-5 h-5" />
          Picklist
        </Link>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground mt-8">
        Data synced across all devices
      </p>
    </div>
  );
};

export default Index;
