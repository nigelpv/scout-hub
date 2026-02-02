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
    const avgDefenseRating = entries.reduce((sum, e) => sum + (e.defenseRating || 0), 0) / matchesPlayed;

    const avgDriverSkill = entries.reduce((sum, e) => sum + e.driverSkill, 0) / matchesPlayed;

    // Score calculation (Match-by-Match)
    const teleopClimbPoints: Record<string, number> = {
        'none': 0,
        'low': 10,
        'mid': 20,
        'high': 30
    };

    const matchScores = entries.map(e => {
        // Auto Fuel: Preload + (Cycles * Size)
        let preloadPts = 0;
        if (e.autoPreload) {
            preloadPts = e.autoPreloadScored ? 8 : (e.autoPreloadCount || 0);
        }
        const autoFuelPts = (e.autoCycles * (e.autoEstCycleSize || 0)) + preloadPts;

        // Auto Climb: 15 points if not 'none'
        const autoClimbPts = (e.autoClimb !== 'none') ? 15 : 0;

        // Teleop Fuel: Cycles * Size
        const teleopFuelPts = e.teleopCycles * (e.estimatedCycleSize || 0);

        // Teleop Climb: Based on Level
        const teleopClimbPts = teleopClimbPoints[e.climbResult] || 0;

        return autoFuelPts + autoClimbPts + teleopFuelPts + teleopClimbPts;
    });

    const totalScore = matchScores.reduce((a, b) => a + b, 0) / matchesPlayed;

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
