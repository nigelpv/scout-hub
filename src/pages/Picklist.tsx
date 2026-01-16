import { useState, useEffect } from 'react';
import { GripVertical, RotateCcw, Star } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { getAllTeamStats, getRatingColor } from '@/lib/stats';
import { getPicklist, savePicklist } from '@/lib/storage';
import { PicklistTeam, TeamStats } from '@/lib/types';

const Picklist = () => {
  const allStats = getAllTeamStats();
  const [picklist, setPicklist] = useState<PicklistTeam[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    const saved = getPicklist();
    if (saved.length > 0) {
      // Merge saved order with current teams
      const savedTeamNumbers = new Set(saved.map(p => p.teamNumber));
      const newTeams = allStats
        .filter(s => !savedTeamNumbers.has(s.teamNumber))
        .map((s, i) => ({
          teamNumber: s.teamNumber,
          rank: saved.length + i + 1,
          manualOverride: false,
        }));
      
      setPicklist([...saved, ...newTeams]);
    } else {
      // Initialize from stats
      setPicklist(
        allStats.map((s, i) => ({
          teamNumber: s.teamNumber,
          rank: i + 1,
          manualOverride: false,
        }))
      );
    }
  }, []);

  const getStatsForTeam = (teamNumber: number): TeamStats | undefined => {
    return allStats.find(s => s.teamNumber === teamNumber);
  };

  const handleDragStart = (index: number) => {
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

  const handleDragEnd = () => {
    setDraggedIndex(null);
    savePicklist(picklist);
  };

  const handleTouchMove = (index: number, direction: 'up' | 'down') => {
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
    savePicklist(newList);
  };

  const resetToAuto = () => {
    const newList = allStats.map((s, i) => ({
      teamNumber: s.teamNumber,
      rank: i + 1,
      manualOverride: false,
    }));
    setPicklist(newList);
    savePicklist(newList);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <PageHeader 
        title="Picklist" 
        rightContent={
          <button
            onClick={resetToAuto}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            title="Reset to auto-ranking"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        }
      />

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
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`stat-card flex items-center gap-3 cursor-grab active:cursor-grabbing transition-all ${
                    draggedIndex === index ? 'opacity-50 scale-[0.98]' : ''
                  }`}
                >
                  {/* Drag Handle */}
                  <div className="touch-none">
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                  </div>

                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-sm ${
                    index < 3 ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                  }`}>
                    {item.rank}
                  </div>

                  {/* Team Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold">
                        {item.teamNumber}
                      </span>
                      {item.manualOverride && (
                        <Star className="w-4 h-4 text-warning fill-warning" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm mt-1">
                      <span className={getRatingColor(stats.avgReliability)}>
                        Rel: {stats.avgReliability}
                      </span>
                      <span className="text-muted-foreground">
                        Score: {stats.totalScore}
                      </span>
                    </div>
                  </div>

                  {/* Touch Controls */}
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
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          Drag or use arrows to reorder • <Star className="w-3 h-3 inline text-warning fill-warning" /> = manual override
        </p>
      </div>
    </div>
  );
};

export default Picklist;
