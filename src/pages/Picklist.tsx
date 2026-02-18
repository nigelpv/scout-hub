import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GripVertical, RotateCcw, Star, Lock, Unlock, Trash2, X, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { getAllTeamStatsFromEntries, getRatingColor } from '@/lib/stats';
import { getPicklist, savePicklist, removeFromPicklist, getEntries } from '@/lib/storage';
import { PicklistTeam, TeamStats } from '@/lib/types';
import { toast } from 'sonner';

const Picklist = () => {
  const [allStats, setAllStats] = useState<TeamStats[]>([]);
  const [picklist, setPicklist] = useState<PicklistTeam[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin Mode State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const processData = (entries: import('@/lib/types').ScoutingEntry[], savedPicklist: PicklistTeam[]) => {
    const stats = getAllTeamStatsFromEntries(entries);
    setAllStats(stats);

    if (savedPicklist.length > 0) {
      const savedTeamNumbers = new Set(savedPicklist.map(p => p.teamNumber));
      const newTeams = stats
        .filter(s => !savedTeamNumbers.has(s.teamNumber))
        .map((s, i) => ({
          teamNumber: s.teamNumber,
          rank: savedPicklist.length + i + 1,
          manualOverride: false,
        }));
      setPicklist([...savedPicklist, ...newTeams]);
    } else {
      setPicklist(
        stats.map((s, i) => ({
          teamNumber: s.teamNumber,
          rank: i + 1,
          manualOverride: false,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [entries, saved] = await Promise.all([getEntries(), getPicklist()]);
      processData(entries, saved);
    };
    loadData();

    const handleEntriesUpdate = (e: Event) => {
      processData((e as CustomEvent).detail, picklist);
    };

    const handlePicklistUpdate = (e: Event) => {
      processData(allStats.length > 0 ? [] : [], (e as CustomEvent).detail); // Simplified, we just need to re-run the merge logic
      // Actually simpler to just track what we have:
    };

    // More robust listeners
    const onEntriesUpdate = (e: Event) => {
      setAllStats(getAllTeamStatsFromEntries((e as CustomEvent).detail));
    };
    const onPicklistUpdate = (e: Event) => {
      setPicklist((e as CustomEvent).detail);
    };

    window.addEventListener('scout_entries_updated', onEntriesUpdate);
    window.addEventListener('scout_picklist_updated', onPicklistUpdate);

    return () => {
      window.removeEventListener('scout_entries_updated', onEntriesUpdate);
      window.removeEventListener('scout_picklist_updated', onPicklistUpdate);
    };
  }, []);

  const getStatsForTeam = (teamNumber: number): TeamStats | undefined => {
    return allStats.find(s => s.teamNumber === teamNumber);
  };

  const handleDragStart = (index: number) => {
    if (isAdmin) return; // Disable drag in admin mode to avoid conflicts
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newList = [...picklist];
    const [dragged] = newList.splice(draggedIndex, 1);
    dragged.manualOverride = true;
    newList.splice(index, 0, dragged);

    // Update ranks
    newList.forEach((item, i) => {
      item.rank = i + 1;
    });

    setPicklist(newList);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    await savePicklist(picklist);
  };

  const handleTouchMove = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= picklist.length) return;

    const newList = [...picklist];
    const [item] = newList.splice(index, 1);
    item.manualOverride = true;
    newList.splice(newIndex, 0, item);

    newList.forEach((item, i) => {
      item.rank = i + 1;
    });

    setPicklist(newList);
    await savePicklist(newList);
  };

  const resetToAuto = async () => {
    if (window.confirm('Reset order to default ranking?')) {
      const newList = allStats.map((s, i) => ({
        teamNumber: s.teamNumber,
        rank: i + 1,
        manualOverride: false,
      }));
      setPicklist(newList);
      await savePicklist(newList);
    }
  };

  // Admin Functions
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPassword(password);
    setIsAdmin(true);
    setShowAuth(false);
    setPassword('');
    toast.success('Admin mode enabled');
  };

  const handleDeleteTeam = async (index: number) => {
    if (window.confirm('Remove this team from picklist?')) {
      const teamNumber = picklist[index].teamNumber;
      const success = await removeFromPicklist(teamNumber, adminPassword);

      if (success) {
        const newList = [...picklist];
        newList.splice(index, 1);

        // Update ranks
        newList.forEach((item, i) => {
          item.rank = i + 1;
        });

        setPicklist(newList);
        toast.success('Team removed from picklist');
      } else {
        toast.error('Failed to remove team');
      }
    }
  };

  const exitAdmin = () => {
    setIsAdmin(false);
    toast.info('Exited admin mode');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Picklist" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8 relative">
      <PageHeader
        title={isAdmin ? "Picklist (Admin)" : "Picklist"}
        rightContent={
          <div className="flex gap-2">
            {!isAdmin && (
              <button
                onClick={resetToAuto}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                title="Reset to auto-ranking"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}
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

      <div className="p-4">
        {picklist.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">No teams to rank</p>
            <p className="text-sm text-muted-foreground">Scout some matches first</p>
          </div>
        ) : (
          <div className="space-y-2">
            {picklist.map((item, index) => {
              const stats = getStatsForTeam(item.teamNumber);
              if (!stats) return null;

              return (
                <div
                  key={item.teamNumber}
                  draggable={!isAdmin}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`stat-card flex items-center gap-3 transition-all ${!isAdmin ? 'cursor-grab active:cursor-grabbing' : ''
                    } ${draggedIndex === index ? 'opacity-50 scale-[0.98]' : ''
                    }`}
                >
                  {/* Drag Handle or Delete Button */}
                  <div className="touch-none flex-shrink-0">
                    {isAdmin ? (
                      <button
                        onClick={() => handleDeleteTeam(index)}
                        className="p-1 rounded text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    ) : (
                      <GripVertical className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-mono font-bold text-sm ${index < 3 ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                    }`}>
                    {item.rank}
                  </div>

                  {/* Team Info */}
                  <Link
                    to={`/team/${item.teamNumber}`}
                    className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
                    onClick={(e) => isAdmin && e.preventDefault()} // Disable navigation in admin mode
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold">
                        {item.teamNumber}
                      </span>
                      {item.manualOverride && (
                        <Star className="w-4 h-4 text-warning fill-warning" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm mt-1">
                      <span className="text-muted-foreground">
                        Matches: {stats.matchesPlayed}
                      </span>
                      <span className="text-muted-foreground font-medium">
                        Score: {stats.totalScore}
                      </span>
                    </div>
                  </Link>

                  {/* Touch Controls (Only when not Admin) */}
                  {!isAdmin && (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleTouchMove(index, 'up')}
                        disabled={index === 0}
                        className="w-8 h-8 rounded bg-secondary flex items-center justify-center disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleTouchMove(index, 'down')}
                        disabled={index === picklist.length - 1}
                        className="w-8 h-8 rounded bg-secondary flex items-center justify-center disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          {isAdmin ? 'Tap trash icon to remove teams' : 'Drag or use arrows to reorder • Lock icon for admin'}
        </p>
      </div>
    </div>
  );
};

export default Picklist;
