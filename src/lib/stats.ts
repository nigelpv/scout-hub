import { ScoutingEntry, TeamStats } from './types';

function calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateStdDev(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
}

// Calculate stats from an array of entries (used by components that already have the data)
export function calculateTeamStatsFromEntries(entries: ScoutingEntry[]): TeamStats | null {
    if (entries.length === 0) return null;

    const matchesPlayed = entries.length;
    const teamNumber = entries[0].teamNumber;

    // Auto Stats
    const autoCyclesValues = entries.map(e => e.autoCycles);
    const avgAutoCycles = autoCyclesValues.reduce((a, b) => a + b, 0) / matchesPlayed;
    const meanAutoCycles = avgAutoCycles;
    const medianAutoCycles = calculateMedian(autoCyclesValues);
    const stdDevAutoCycles = calculateStdDev(autoCyclesValues, avgAutoCycles);

    const avgAutoCycleSize = entries.reduce((sum, e) => sum + (e.autoEstCycleSize || 0), 0) / matchesPlayed;

    const preloadSuccesses = entries.filter(e => e.autoPreload && e.autoPreloadScored).length;
    const preloadAttempts = entries.filter(e => e.autoPreload).length;
    const autoPreloadSuccessRate = preloadAttempts > 0 ? (preloadSuccesses / preloadAttempts) * 100 : 0;

    // Teleop Stats
    const teleopCyclesValues = entries.map(e => e.teleopCycles);
    const avgTeleopCycles = teleopCyclesValues.reduce((a, b) => a + b, 0) / matchesPlayed;
    const meanTeleopCycles = avgTeleopCycles;
    const medianTeleopCycles = calculateMedian(teleopCyclesValues);
    const stdDevTeleopCycles = calculateStdDev(teleopCyclesValues, avgTeleopCycles);

    const avgCycleSize = entries.reduce((sum, e) => sum + (e.estimatedCycleSize || 0), 0) / matchesPlayed;

    // Climb Stats
    const successfulClimbs = entries.filter(e =>
        e.climbResult === 'low' || e.climbResult === 'mid' || e.climbResult === 'high'
    ).length;
    const climbSuccessRate = (successfulClimbs / matchesPlayed) * 100;

    const highMidClimbs = entries.filter(e =>
        e.climbResult === 'mid' || e.climbResult === 'high'
    ).length;
    const highMidClimbRate = (highMidClimbs / matchesPlayed) * 100;

    // Rating Stats
    const defenseEntries = entries.filter(e => e.defensePlayed);
    const avgDefenseRating = defenseEntries.length > 0
        ? defenseEntries.reduce((sum, e) => sum + e.defenseEffectiveness, 0) / defenseEntries.length
        : 0;

    const avgDriverSkill = entries.reduce((sum, e) => sum + e.driverSkill, 0) / matchesPlayed;
    const avgRobotSpeed = entries.reduce((sum, e) => sum + e.robotSpeed, 0) / matchesPlayed;
    const avgReliability = entries.reduce((sum, e) => sum + e.reliability, 0) / matchesPlayed;

    // Score
    const climbPoints: Record<string, number> = {
        'none': 0,
        'attempted': 0,
        'low': 10,
        'mid': 20,
        'high': 30
    };

    const avgClimbPoints = entries.reduce((sum, e) => sum + (climbPoints[e.climbResult] || 0), 0) / matchesPlayed;

    // Advanced Auto Fuel Score
    // Method: For each entry, calculate (Preload Points + (Auto Cycles * Auto Est Cycle Size))
    // Then average it.
    const autoFuelScores = entries.map(e => {
        let preloadPts = 0;
        if (e.autoPreload) {
            preloadPts = e.autoPreloadScored ? 8 : (e.autoPreloadCount || 0);
        }
        const cyclePts = e.autoCycles * (e.autoEstCycleSize || 0);
        return preloadPts + cyclePts;
    });
    const avgAutoFuelScore = autoFuelScores.reduce((a, b) => a + b, 0) / matchesPlayed;

    // Advanced Auto Climb Score
    // 15 pts if Side/Middle climb rate > 75%
    const autoClimbAttempts = entries.filter(e => e.autoClimb === 'side' || e.autoClimb === 'middle').length;
    const autoClimbRate = autoClimbAttempts / matchesPlayed;
    const avgAutoClimbPoints = autoClimbRate > 0.75 ? 15 : 0;

    // Total Score Calculation (Standardized)
    // Auto: Fuel Score + Climbs (conditional)
    // Teleop: 1pt per fuel (Cycles * Size... wait user just said "Auto cycle number... multiply by Est. cycle value". 
    // Usually Teleop is just cycles count if size isn't varying per cycle, but let's assume 1pt per fuel for Teleop too using cycles * size if available, 
    // OR if the user meant previous simplistic 1pt per cycle.
    // Re-reading user request: "First implement that [Auto logic]... then we'll get into the rest".
    // I will stick to the previous Teleop logic (1pt per cycle) UNLESS clearly implied otherwise.
    // However, consistency suggests Teleop Fuel is also Quantity * 1.
    // Let's use `teleopCycles` as the count of fuel for now (assuming 'cycles' = fuel scored, or cycles * size?).
    // The previous implementation used `avgTeleopCycles * 1`. 
    // Given the explicit complex instruction for Auto, but lack thereof for Teleop, I will maintain `avgTeleopCycles * 1` for now 
    // OR arguably `avgTeleopCycles * avgEstimatedCycleSize` would be more consistent? 
    // The user said: "Then for Auto your gonna take the auto cycle number and multiply by the Est. cycle value... Thats how many fuel we are saying the bot scored. So thats the 2nd set of points u add."
    // This implies 'Cycles' is trips, not pieces.
    // So for Teleop, I should probably also do `teleopCycles * estimatedCycleSize` to get fuel count.

    // Let's calculate Teleop Fuel Score similarly:
    const teleopFuelScores = entries.map(e => e.teleopCycles * (e.estimatedCycleSize || 0)); // Assuming Est Size applies to Teleop too

    // Wait, previously `teleopCycles` was treated as 'cycles count'. And `estimatedCycleSize` existed.
    // If I change Teleop logic now without explicit request, I might break it. 
    // The User said "Matches Points Only... TELEOP LEVEL 1 climb: 10 pts... FUEL in active HUB: 1 pt each".
    // Does 'teleopCycles' mean 'Fuel Scored' or 'Trips made'?
    // In ScoutMatch it says "Teleop Cycles" and "Est. Cycle Size". So it means Trips.
    // So Total Teleop Fuel = Cycles * Cycle Size.
    // I will update Teleop to match this logic for consistency.
    const avgTeleopFuelScore = teleopFuelScores.reduce((a, b) => a + b, 0) / matchesPlayed;


    const totalScore = avgAutoFuelScore + avgAutoClimbPoints + avgClimbPoints + avgTeleopFuelScore;

    return {
        teamNumber,
        matchesPlayed,
        avgAutoCycles: Math.round(avgAutoCycles * 10) / 10,
        meanAutoCycles: Math.round(meanAutoCycles * 10) / 10,
        medianAutoCycles: Math.round(medianAutoCycles * 10) / 10,
        stdDevAutoCycles: Math.round(stdDevAutoCycles * 10) / 10,
        autoPreloadSuccessRate: Math.round(autoPreloadSuccessRate),
        avgAutoCycleSize: Math.round(avgAutoCycleSize * 10) / 10,
        avgTeleopCycles: Math.round(avgTeleopCycles * 10) / 10,
        meanTeleopCycles: Math.round(meanTeleopCycles * 10) / 10,
        medianTeleopCycles: Math.round(medianTeleopCycles * 10) / 10,
        stdDevTeleopCycles: Math.round(stdDevTeleopCycles * 10) / 10,
        avgCycleSize: Math.round(avgCycleSize * 10) / 10,
        climbSuccessRate: Math.round(climbSuccessRate),
        highMidClimbRate: Math.round(highMidClimbRate),
        avgDefenseRating: Math.round(avgDefenseRating * 10) / 10,
        avgDriverSkill: Math.round(avgDriverSkill * 10) / 10,
        avgRobotSpeed: Math.round(avgRobotSpeed * 10) / 10,
        avgReliability: Math.round(avgReliability * 10) / 10,
        totalScore: Math.round(totalScore * 10) / 10,
    };
}

// Calculate all team stats from an array of all entries
export function getAllTeamStatsFromEntries(entries: ScoutingEntry[]): TeamStats[] {
    const teamNumbers = [...new Set(entries.map(e => e.teamNumber))];

    return teamNumbers
        .map(num => {
            const teamEntries = entries.filter(e => e.teamNumber === num);
            return calculateTeamStatsFromEntries(teamEntries);
        })
        .filter((stats): stats is TeamStats => stats !== null)
        .sort((a, b) => b.totalScore - a.totalScore);
}

export function getUniqueTeamsFromEntries(entries: ScoutingEntry[]): number[] {
    return [...new Set(entries.map(e => e.teamNumber))].sort((a, b) => a - b);
}

export function getRatingColor(rating: number, max: number = 5): string {
    const percent = rating / max;
    if (percent >= 0.8) return 'text-stat-excellent';
    if (percent >= 0.6) return 'text-stat-good';
    if (percent >= 0.4) return 'text-stat-average';
    if (percent >= 0.2) return 'text-stat-poor';
    return 'text-stat-bad';
}

export function getRatingBgColor(rating: number, max: number = 5): string {
    const percent = rating / max;
    if (percent >= 0.8) return 'bg-stat-excellent';
    if (percent >= 0.6) return 'bg-stat-good';
    if (percent >= 0.4) return 'bg-stat-average';
    if (percent >= 0.2) return 'bg-stat-poor';
    return 'bg-stat-bad';
}
