import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, TrendingUp, Loader2, Lock, Unlock, Trash2, X, CheckSquare, Square, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { getAllTeamStatsFromEntries, getRatingColor } from '@/lib/stats';
import { getEntries, deleteTeamData, deleteTeamsBatch, getPitEntries, EVENT_KEY, updateEventKey, getPicklist } from '@/lib/storage';
import { fetchEventOPRs, getTeamOPR, TBAOprResult } from '@/lib/tba';
import { exportMatchEntriesToCSV, exportPitEntriesToCSV, exportTeamAveragesToCSV } from '@/lib/csv';
import { TeamStats, PicklistTeam } from '@/lib/types';
import { toast } from 'sonner';

type SortKey = 'rank' | 'climbSuccessRate' | 'avgCycles' | 'avgDefenseEffectiveness' | 'opr';

const Teams = () => {
  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [picklist, setPicklist] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Admin Mode State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<Set<number>>(new Set());
  const [oprData, setOprData] = useState<TBAOprResult | null>(null);
  const [newEventKey, setNewEventKey] = useState(EVENT_KEY());
  const [isUpdatingKey, setIsUpdatingKey] = useState(false);
  const isFetching = useRef(false);

  const loadTeams = useCallback(async (isBackground = false) => {
    if (isFetching.current) return;
    isFetching.current = true;

    if (!isBackground) setLoading(true);
    try {
      const [entries, pitEntries, newOprData, savedPicklist] = await Promise.all([
        getEntries(),
        getPitEntries(),
        fetchEventOPRs(EVENT_KEY()),
        getPicklist()
      ]);

      if (newOprData) setOprData(newOprData);

      // Map picklist for quick lookup
      const picklistMap: Record<number, number> = {};
      savedPicklist.forEach(p => {
        picklistMap[p.teamNumber] = p.rank;
      });
      setPicklist(picklistMap);

      const effectiveOprData = newOprData || oprData;
      const pitTeamNumbers = pitEntries.map(e => e.teamNumber);
      const stats = getAllTeamStatsFromEntries(entries, pitTeamNumbers);

      // Merge OPR if available
      if (effectiveOprData) {
        stats.forEach(s => {
          const teamOpr = getTeamOPR(effectiveOprData, s.teamNumber);
          if (teamOpr !== null) s.opr = teamOpr;
        });
      }

      setTeams(stats);
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
      if (!isBackground) {
        setSelectedTeams(new Set());
      }
      isFetching.current = false;
    }
  }, [oprData]);

  useEffect(() => {
    loadTeams();

    const handleUpdate = () => {
      if (!isFetching.current) {
        loadTeams(true);
      }
    };

    window.addEventListener('scout_entries_updated', handleUpdate);
    window.addEventListener('scout_pit_updated', handleUpdate);
    window.addEventListener('scout_event_key_changed', handleUpdate);

    return () => {
      window.removeEventListener('scout_entries_updated', handleUpdate);
      window.removeEventListener('scout_pit_updated', handleUpdate);
      window.removeEventListener('scout_event_key_changed', handleUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      let valA: number;
      let valB: number;

      switch (sortKey) {
        case 'rank':
          valA = picklist[a.teamNumber] || 999;
          valB = picklist[b.teamNumber] || 999;
          break;
        case 'climbSuccessRate':
          valA = a.climbSuccessRate;
          valB = b.climbSuccessRate;
          break;
        case 'avgCycles':
          valA = a.avgAutoCycles + a.avgTeleopCycles;
          valB = b.avgAutoCycles + b.avgTeleopCycles;
          break;
        case 'avgDefenseEffectiveness':
          valA = a.avgDefenseEffectiveness;
          valB = b.avgDefenseEffectiveness;
          break;
        case 'opr':
          valA = a.opr || 0;
          valB = b.opr || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') return valA - valB;
      return valB - valA;
    });
  }, [teams, sortKey, sortOrder, picklist]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder(key === 'rank' ? 'asc' : 'desc');
    }
  };

  // Admin Functions
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '16782473') {
      setAdminPassword(password);
      setIsAdmin(true);
      setShowAuth(false);
      setPassword('');
      toast.success('Admin mode enabled');
    } else {
      toast.error('Incorrect password');
    }
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
      setLoading(true);
      const teamNumbers = Array.from(selectedTeams);
      const success = await deleteTeamsBatch(teamNumbers, adminPassword);

      if (success) {
        toast.success(`Deleted data for ${teamNumbers.length} teams`);
        await loadTeams();
      } else {
        toast.error('Failed to delete teams');
        setLoading(false);
      }
    }
  };

  const handleExportMatchCSV = async () => {
    const result = await exportMatchEntriesToCSV();
    if (result.success) {
      toast.success('Match data exported successfully');
    } else {
      toast.error(result.message || 'Export failed');
    }
  };

  const handleExportPitCSV = async () => {
    const result = await exportPitEntriesToCSV();
    if (result.success) {
      toast.success('Pit data exported successfully');
    } else {
      toast.error(result.message || 'Export failed');
    }
  };

  const handleUpdateEventKey = async () => {
    if (!newEventKey.trim()) return;
    if (newEventKey.trim() === EVENT_KEY()) {
      toast.info('Event key is already set to ' + newEventKey);
      return;
    }

    setIsUpdatingKey(true);
    const success = await updateEventKey(newEventKey.trim(), adminPassword);
    if (success) {
      toast.success(`Switched to event: ${newEventKey}`);
    } else {
      toast.error('Failed to update event key');
    }
    setIsUpdatingKey(false);
  };

  const handleExportAveragesCSV = async () => {
    const result = await exportTeamAveragesToCSV();
    if (result.success) {
      toast.success('Team averages exported successfully');
    } else {
      toast.error(result.message || 'Export failed');
    }
  };

  const exitAdmin = () => {
    setIsAdmin(false);
    setSelectedTeams(new Set());
    toast.info('Exited admin mode');
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />;
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadTeams(false)}
              className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
              title="Refresh Data"
            >
              <TrendingUp className="w-5 h-5" />
            </button>
            <button
              onClick={() => isAdmin ? exitAdmin() : setShowAuth(true)}
              className={`p-2 rounded-lg transition-colors ${isAdmin ? 'bg-destructive/10 text-destructive' : 'hover:bg-secondary'}`}
              title={isAdmin ? "Lock" : "Unlock Admin"}
            >
              {isAdmin ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </button>
          </div>
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

      {/* Sorting Header */}
      {!isAdmin && (
        <div className="sticky top-[64px] z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-2 flex items-center justify-between overflow-x-auto no-scrollbar gap-4">
          <button onClick={() => toggleSort('rank')} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
            Rank <SortIcon k="rank" />
          </button>
          <div className="flex items-center gap-4">
            <button onClick={() => toggleSort('avgCycles')} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
              Cycles <SortIcon k="avgCycles" />
            </button>
            <button onClick={() => toggleSort('climbSuccessRate')} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
              Climb <SortIcon k="climbSuccessRate" />
            </button>
            <button onClick={() => toggleSort('avgDefenseEffectiveness')} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
              Defense <SortIcon k="avgDefenseEffectiveness" />
            </button>
            <button onClick={() => toggleSort('opr')} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
              OPR <SortIcon k="opr" />
            </button>
          </div>
        </div>
      )}

      {/* Admin Actions Bar */}
      {isAdmin && (
        <div className="flex flex-col bg-secondary/30 border-b border-border">
          <div className="px-4 py-2 flex items-center justify-between border-b border-border/50">
            <div className="flex gap-2">
              <button onClick={handleSelectAll} className="text-xs font-medium text-primary hover:underline">Select All</button>
              <span className="text-xs text-muted-foreground">|</span>
              <button onClick={handleDeselectAll} className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline">Deselect</button>
            </div>
            <div className="flex gap-2 text-xs font-medium text-emerald-600">
              <button onClick={handleExportMatchCSV} className="hover:underline">Match CSV</button>
              <span className="text-muted-foreground">|</span>
              <button onClick={handleExportPitCSV} className="hover:underline">Pit CSV</button>
              <span className="text-muted-foreground">|</span>
              <button onClick={handleExportAveragesCSV} className="hover:underline">Avgs CSV</button>
            </div>
          </div>
          <div className="px-4 py-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Event:</span>
              <span className="text-xs font-mono font-bold text-primary">{EVENT_KEY()}</span>
            </div>
            <div className="flex items-center gap-2 flex-1 max-w-[200px]">
              <input
                type="text"
                value={newEventKey}
                onChange={(e) => setNewEventKey(e.target.value)}
                placeholder="New Event Key"
                className="w-full h-8 px-2 text-xs rounded border border-border bg-background font-mono focus:border-primary outline-none"
              />
              <button
                onClick={handleUpdateEventKey}
                disabled={isUpdatingKey || !newEventKey.trim() || newEventKey === EVENT_KEY()}
                className="h-8 px-3 text-xs bg-primary text-primary-foreground rounded font-medium whitespace-nowrap disabled:opacity-50"
              >
                {isUpdatingKey ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Switch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team List */}
      <div className="p-4 space-y-3">
        {sortedTeams.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">No teams found</p>
            <Link to="/scout" className="text-primary font-medium">Start scouting →</Link>
          </div>
        ) : (
          sortedTeams.map((team) => (
            <Link
              key={team.teamNumber}
              to={`/team/${team.teamNumber}`}
              onClick={(e) => {
                if (isAdmin) {
                  e.preventDefault();
                  toggleSelection(team.teamNumber);
                }
              }}
              className={`stat-card block relative overflow-hidden transition-all ${!isAdmin ? 'active:scale-[0.98]' : 'cursor-pointer'
                }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <div className={selectedTeams.has(team.teamNumber) ? 'text-primary' : 'text-muted-foreground'}>
                      {selectedTeams.has(team.teamNumber) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </div>
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-sm ${(!isAdmin && (picklist[team.teamNumber] || 99) <= 3) ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                    }`}>
                    {picklist[team.teamNumber] || '—'}
                  </div>
                  <div>
                    <span className="font-mono text-2xl font-black">{team.teamNumber}</span>
                    <span className="ml-2 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                      {team.matchesPlayed} match{team.matchesPlayed !== 1 ? 'es' : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-black leading-none mb-0.5">OPR</p>
                    <p className="text-xl font-mono font-black text-info italic leading-none">
                      {team.opr !== undefined ? team.opr.toFixed(1) : 'N/A'}
                    </p>
                  </div>
                  {!isAdmin && <ChevronRight className="w-5 h-5 text-muted-foreground/30" />}
                  {isAdmin && !selectedTeams.has(team.teamNumber) && (
                    <button onClick={(e) => handleDeleteTeam(e, team.teamNumber)} className="p-2 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Primary Metrics Row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-secondary/20 p-2 rounded-lg border border-border/50">
                  <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">Cycles</p>
                  <p className="text-2xl font-mono font-black leading-none">
                    {(team.avgAutoCycles + team.avgTeleopCycles).toFixed(1)}
                  </p>
                </div>
                <div className="bg-secondary/20 p-2 rounded-lg border border-border/50">
                  <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">Climb</p>
                  <p className={`text-2xl font-mono font-black leading-none ${getRatingColor(team.climbSuccessRate, 100)}`}>
                    {team.climbSuccessRate}%
                  </p>
                </div>
                <div className="bg-secondary/20 p-2 rounded-lg border border-border/50">
                  <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">Defense</p>
                  <p className={`text-2xl font-mono font-black leading-none ${getRatingColor(team.avgDefenseEffectiveness, 5)}`}>
                    {team.avgDefenseEffectiveness.toFixed(1)}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Teams;
