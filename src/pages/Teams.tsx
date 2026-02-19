import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, TrendingUp, Loader2, Lock, Unlock, Trash2, X, CheckSquare, Square } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { getAllTeamStatsFromEntries, getRatingColor } from '@/lib/stats';
import { getEntries, deleteTeamData } from '@/lib/storage';
import { TeamStats } from '@/lib/types';
import { toast } from 'sonner';

const Teams = () => {
  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin Mode State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<Set<number>>(new Set());

  const loadTeams = async () => {
    setLoading(true);
    const entries = await getEntries();
    const stats = getAllTeamStatsFromEntries(entries);
    setTeams(stats);
    setLoading(false);
    setSelectedTeams(new Set());
  };

  useEffect(() => {
    loadTeams();

    const handleUpdate = (e: Event) => {
      const updatedEntries = (e as CustomEvent).detail;
      const stats = getAllTeamStatsFromEntries(updatedEntries);
      setTeams(stats);
      setLoading(false);
    };

    window.addEventListener('scout_entries_updated', handleUpdate);
    return () => window.removeEventListener('scout_entries_updated', handleUpdate);
  }, []);

  // Admin Functions
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPassword(password);
    setIsAdmin(true);
    setShowAuth(false);
    setPassword('');
    toast.success('Admin mode enabled');
  };

  const toggleSelection = (teamNumber: number) => {
    const newSelection = new Set(selectedTeams);
    if (newSelection.has(teamNumber)) {
      newSelection.delete(teamNumber);
    } else {
      newSelection.add(teamNumber);
    }
    setSelectedTeams(newSelection);
  };

  const handleSelectAll = () => {
    const allTeamNumbers = teams.map(t => t.teamNumber);
    setSelectedTeams(new Set(allTeamNumbers));
  };

  const handleDeselectAll = () => {
    setSelectedTeams(new Set());
  };

  const handleDeleteTeam = async (e: React.MouseEvent, teamNumber: number) => {
    e.preventDefault(); // Prevent navigation
    if (window.confirm(`Are you sure you want to delete ALL data for Team ${teamNumber}? This cannot be undone.`)) {
      const success = await deleteTeamData(teamNumber, adminPassword);
      if (success) {
        toast.success(`Team ${teamNumber} data deleted`);
        loadTeams(); // Refresh list
      } else {
        toast.error('Failed to delete team data');
      }
    }
  };

  const handleBatchDelete = async () => {
    if (selectedTeams.size === 0) return;

    if (window.confirm(`Are you sure you want to delete ALL data for ${selectedTeams.size} teams? This cannot be undone.`)) {
      let successCount = 0;
      // Iterate and delete each team
      for (const teamNumber of selectedTeams) {
        const success = await deleteTeamData(teamNumber, adminPassword);
        if (success) successCount++;
      }

      if (successCount > 0) {
        toast.success(`Deleted data for ${successCount} teams`);
        loadTeams();
      } else {
        toast.error('Failed to delete teams');
      }
    }
  };

  const exitAdmin = () => {
    setIsAdmin(false);
    setSelectedTeams(new Set());
    toast.info('Exited admin mode');
  };

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
    <div className="min-h-screen bg-background pb-8 relative">
      <PageHeader
        title={isAdmin ? "Teams (Admin)" : "Teams"}
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
              <h3 className="font-bold text-lg">Admin Access</h3>
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

      {/* Select All / Actions Bar */}
      {isAdmin && (
        <div className="px-4 py-2 flex items-center justify-between bg-secondary/30 border-b border-border">
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="text-xs font-medium text-primary hover:underline"
            >
              Select All
            </button>
            <span className="text-xs text-muted-foreground">|</span>
            <button
              onClick={handleDeselectAll}
              className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
            >
              Deselect
            </button>
          </div>
          <span className="text-xs text-muted-foreground">
            {selectedTeams.size} selected
          </span>
        </div>
      )}

      {/* Batch Delete Floating Button */}
      {isAdmin && selectedTeams.size > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 animate-in slide-in-from-bottom-4 fade-in">
          <div className="bg-destructive text-destructive-foreground rounded-xl shadow-lg p-4 flex items-center justify-between">
            <span className="font-medium">{selectedTeams.size} teams selected</span>
            <button
              onClick={handleBatchDelete}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Delete All Data
            </button>
          </div>
        </div>
      )}

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
                onClick={(e) => {
                  if (isAdmin) {
                    e.preventDefault();
                    toggleSelection(team.teamNumber);
                  }
                }}
                className={`stat-card flex items-center gap-4 transition-transform ${!isAdmin ? 'active:scale-[0.99]' : 'cursor-pointer'}`}
              >
                {/* Checkbox for Admin */}
                {isAdmin && (
                  <div className={`p-1 -ml-1 rounded ${selectedTeams.has(team.teamNumber) ? 'text-primary' : 'text-muted-foreground'}`}>
                    {selectedTeams.has(team.teamNumber) ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </div>
                )}

                {/* Rank */}
                {!isAdmin && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-mono font-bold text-sm">
                    {index + 1}
                  </div>
                )}

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

                {!isAdmin && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                {isAdmin && !selectedTeams.has(team.teamNumber) && (
                  <button
                    onClick={(e) => handleDeleteTeam(e, team.teamNumber)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;
