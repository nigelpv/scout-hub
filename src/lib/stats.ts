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
    const autoCyclesValues = entries.map(e => e.autoCycles || 0);
    const avgAutoCycles = autoCyclesValues.reduce((a, b) => a + b, 0) / matchesPlayed;
    const meanAutoCycles = avgAutoCycles;
    const medianAutoCycles = calculateMedian(autoCyclesValues);
    const stdDevAutoCycles = calculateStdDev(autoCyclesValues, avgAutoCycles);

    const hoppersPassedAutoValues = entries.map(e => e.hoppersPassedAuto || 0);
    const avgHoppersPassedAuto = hoppersPassedAutoValues.reduce((a, b) => a + b, 0) / matchesPlayed;

    // Teleop Stats
    const teleopCyclesValues = entries.map(e => e.teleopCycles || 0);
    const avgTeleopCycles = teleopCyclesValues.reduce((a, b) => a + b, 0) / matchesPlayed;
    const meanTeleopCycles = avgTeleopCycles;
    const medianTeleopCycles = calculateMedian(teleopCyclesValues);
    const stdDevTeleopCycles = calculateStdDev(teleopCyclesValues, avgTeleopCycles);

    const hoppersPassedValues = entries.map(e => e.hoppersPassed || 0);
    const avgHoppersPassed = hoppersPassedValues.reduce((a, b) => a + b, 0) / matchesPlayed;

    // Climb Stats
    const successfulClimbs = entries.filter(e =>
        e.climbResult === 'L1' || e.climbResult === 'L2' || e.climbResult === 'L3'
    ).length;
    const climbSuccessRate = (successfulClimbs / matchesPlayed) * 100;

    const l1Climbs = entries.filter(e => e.climbResult === 'L1').length;
    const l2Climbs = entries.filter(e => e.climbResult === 'L2').length;
    const l3Climbs = entries.filter(e => e.climbResult === 'L3').length;

    const l1ClimbRate = (l1Climbs / matchesPlayed) * 100;
    const l2ClimbRate = (l2Climbs / matchesPlayed) * 100;
    const l3ClimbRate = (l3Climbs / matchesPlayed) * 100;

    // Defense Stats
    const defenseEntries = entries.filter(e => e.playedDefense);
    const defenseMatches = defenseEntries.length;
    const defensePlayRate = (defenseMatches / matchesPlayed) * 100;

    const defenseEffectivenessValues = entries.map(e => e.defenseEffectiveness || 0).filter(v => v > 0);
    const avgDefenseEffectiveness = defenseEffectivenessValues.length > 0
        ? defenseEffectivenessValues.reduce((a, b) => a + b, 0) / defenseEffectivenessValues.length
        : 0;

    // Defense Location Stats
    const defenseLocationStats: Record<string, number> = {
        'neutral': 0,
        'our_alliance': 0,
        'their_alliance': 0
    };

    if (matchesPlayed > 0) {
        defenseEntries.forEach(e => {
            if (Array.isArray(e.defenseLocation)) {
                e.defenseLocation.forEach(loc => {
                    if (defenseLocationStats[loc] !== undefined) {
                        defenseLocationStats[loc]++;
                    }
                });
            }
        });

        // Convert to percentages of TOTAL matches (per match stat)
        Object.keys(defenseLocationStats).forEach(key => {
            defenseLocationStats[key] = Math.round((defenseLocationStats[key] / matchesPlayed) * 100);
        });
    }

    // Issues & Stability
    const beachedMatches = entries.filter(e => e.beachingType && e.beachingType.length > 0 && !e.beachingType.includes('none')).length;
    const beachingRate = (beachedMatches / matchesPlayed) * 100;

    const incapMatches = entries.filter(e => e.incapacitated).length;
    const incapRate = (incapMatches / matchesPlayed) * 100;

    // Driver Skill
    const driverSkillValues = entries.map(e => e.driverSkill || 0).filter(v => v > 0);
    const avgDriverSkill = driverSkillValues.length > 0
        ? driverSkillValues.reduce((a, b) => a + b, 0) / driverSkillValues.length
        : 0;
    
    // Shooting while intaking stats
    const shootPlusIntakeAutoCount = entries.filter(e => e.shootPlusIntakeAuto).length;
    const shootPlusIntakeAutoRate = (shootPlusIntakeAutoCount / matchesPlayed) * 100;
    
    const shootPlusIntakeTeleopCount = entries.filter(e => e.shootPlusIntakeTeleop).length;
    const shootPlusIntakeTeleopRate = (shootPlusIntakeTeleopCount / matchesPlayed) * 100;

    // Detailed Stats (Expanding)
    const herdsFuelCount = entries.filter(e => e.herdsFuelThroughTrench).length;
    const herdsFuelRate = (herdsFuelCount / matchesPlayed) * 100;

    const startingPositionStats: Record<string, number> = { 'hub': 0, 'outpost_trench': 0, 'depot_trench': 0, 'outpost_bump': 0, 'depot_bump': 0 };
    const autoClimbStats: Record<string, number> = { 'none': 0, 'side': 0, 'middle': 0, 'failed_attempt': 0 };
    const autoObstacleStats: Record<string, number> = { 'none': 0, 'outpost_trench': 0, 'depot_trench': 0, 'outpost_bump': 0, 'depot_bump': 0, 'trench': 0, 'bump': 0, 'both': 0 };
    const teleopObstacleStats: Record<string, number> = { 'none': 0, 'trench': 0, 'bump': 0, 'both': 0 };
    const beachingTypeStats: Record<string, number> = { 'beached_on_bump': 0, 'beached_on_fuel_off_bump': 0, 'other': 0 };
    const climbPositionStats: Record<string, number> = { 'none': 0, 'side': 0, 'center': 0 };

    entries.forEach(e => {
        // Dynamic stats collection to handle legacy values (e.g., left_trench, right_trench)
        if (e.startingPosition) {
            startingPositionStats[e.startingPosition] = (startingPositionStats[e.startingPosition] || 0) + 1;
        }
        if (e.autoClimb) {
            autoClimbStats[e.autoClimb] = (autoClimbStats[e.autoClimb] || 0) + 1;
        }
        if (e.autoObstacle) {
            autoObstacleStats[e.autoObstacle] = (autoObstacleStats[e.autoObstacle] || 0) + 1;
        }
        if (e.teleopObstacle) {
            teleopObstacleStats[e.teleopObstacle] = (teleopObstacleStats[e.teleopObstacle] || 0) + 1;
        }
        if (e.climbPosition) {
            climbPositionStats[e.climbPosition] = (climbPositionStats[e.climbPosition] || 0) + 1;
        }
        
        if (Array.isArray(e.beachingType)) {
            e.beachingType.forEach(t => {
                if (t && t !== 'none') {
                    beachingTypeStats[t] = (beachingTypeStats[t] || 0) + 1;
                }
            });
        }
    });

    // Convert counts to percentages
    [startingPositionStats, autoClimbStats, autoObstacleStats, teleopObstacleStats, beachingTypeStats, climbPositionStats].forEach(statObj => {
        Object.keys(statObj).forEach(key => {
            statObj[key] = Math.round((statObj[key] / matchesPlayed) * 100);
        });
    });

    // Cycle History (for Trend Graph)
    const cycleHistory = entries
        .sort((a, b) => a.matchNumber - b.matchNumber)
        .map(e => ({
            matchNumber: e.matchNumber,
            auto: e.autoCycles || 0,
            teleop: e.teleopCycles || 0,
            total: (e.autoCycles || 0) + (e.teleopCycles || 0)
        }));

    // Score calculation (Match-by-Match)
    const climbPoints: Record<string, number> = {
        'none': 0,
        'L1': 10,
        'L2': 20,
        'L3': 30,
        'failed_attempt': 0,
    };

    const matchScores = entries.map(e => {
        // Auto: hoppers into hub + hoppers passed
        const autoHubPts = (e.autoCycles || 0);
        const autoHopperPts = (e.hoppersPassedAuto || 0);

        // Auto Climb: 15 points if not 'none' or 'failed_attempt'
        const autoClimbPts = (e.autoClimb !== 'none' && e.autoClimb !== 'failed_attempt') ? 15 : 0;

        // Teleop: hoppers into hub + hoppers passed
        const teleopFuelPts = (e.teleopCycles || 0);
        const teleopHopperPts = (e.hoppersPassed || 0);

        // Endgame Climb
        const climbPts = climbPoints[e.climbResult] || 0;

        return autoHubPts + autoHopperPts + autoClimbPts + teleopFuelPts + teleopHopperPts + climbPts;
    });

    const totalScore = matchScores.reduce((a, b) => a + b, 0) / matchesPlayed;

    return {
        teamNumber,
        matchesPlayed,
        avgAutoCycles: Math.round(avgAutoCycles * 10) / 10,
        meanAutoCycles: Math.round(meanAutoCycles * 10) / 10,
        medianAutoCycles: Math.round(medianAutoCycles * 10) / 10,
        stdDevAutoCycles: Math.round(stdDevAutoCycles * 10) / 10,
        avgHoppersPassedAuto: Math.round(avgHoppersPassedAuto * 10) / 10,
        avgTeleopCycles: Math.round(avgTeleopCycles * 10) / 10,
        meanTeleopCycles: Math.round(meanTeleopCycles * 10) / 10,
        medianTeleopCycles: Math.round(medianTeleopCycles * 10) / 10,
        stdDevTeleopCycles: Math.round(stdDevTeleopCycles * 10) / 10,
        avgHoppersPassed: Math.round(avgHoppersPassed * 10) / 10,
        climbSuccessRate: Math.round(climbSuccessRate),
        l1ClimbRate: Math.round(l1ClimbRate),
        l2ClimbRate: Math.round(l2ClimbRate),
        l3ClimbRate: Math.round(l3ClimbRate),
        defensePlayRate: Math.round(defensePlayRate),
        avgDefenseEffectiveness: Math.round(avgDefenseEffectiveness * 10) / 10,
        defenseLocationStats,
        beachingRate: Math.round(beachingRate),
        incapRate: Math.round(incapRate),
        shootPlusIntakeAutoRate: Math.round(shootPlusIntakeAutoRate),
        shootPlusIntakeTeleopRate: Math.round(shootPlusIntakeTeleopRate),
        avgDriverSkill: Math.round(avgDriverSkill * 10) / 10,
        startingPositionStats,
        autoClimbStats,
        autoObstacleStats,
        teleopObstacleStats,
        beachingTypeStats,
        herdsFuelRate: Math.round(herdsFuelRate),
        climbPositionStats,
        totalScore: Math.round(totalScore * 10) / 10,
        cycleHistory
    };
}

export function createEmptyStats(teamNumber: number): TeamStats {
    return {
        teamNumber: teamNumber,
        matchesPlayed: 0,
        avgAutoCycles: 0,
        meanAutoCycles: 0,
        medianAutoCycles: 0,
        stdDevAutoCycles: 0,
        avgHoppersPassedAuto: 0,
        avgTeleopCycles: 0,
        meanTeleopCycles: 0,
        medianTeleopCycles: 0,
        stdDevTeleopCycles: 0,
        avgHoppersPassed: 0,
        climbSuccessRate: 0,
        l1ClimbRate: 0,
        l2ClimbRate: 0,
        l3ClimbRate: 0,
        defensePlayRate: 0,
        avgDefenseEffectiveness: 0,
        defenseLocationStats: {
            'neutral': 0,
            'our_alliance': 0,
            'their_alliance': 0
        },
        beachingRate: 0,
        incapRate: 0,
        shootPlusIntakeAutoRate: 0,
        shootPlusIntakeTeleopRate: 0,
        avgDriverSkill: 0,
        startingPositionStats: { 'hub': 0, 'outpost_trench': 0, 'depot_trench': 0, 'outpost_bump': 0, 'depot_bump': 0 },
        autoClimbStats: { 'none': 0, 'side': 0, 'middle': 0, 'failed_attempt': 0 },
        autoObstacleStats: { 'none': 0, 'outpost_trench': 0, 'depot_trench': 0, 'outpost_bump': 0, 'depot_bump': 0, 'trench': 0, 'bump': 0, 'both': 0 },
        teleopObstacleStats: { 'none': 0, 'trench': 0, 'bump': 0, 'both': 0 },
        beachingTypeStats: { 'beached_on_bump': 0, 'beached_on_fuel_off_bump': 0, 'other': 0 },
        herdsFuelRate: 0,
        climbPositionStats: { 'none': 0, 'side': 0, 'center': 0 },
        totalScore: 0,
    };
}

// Calculate all team stats from an array of all entries
export function getAllTeamStatsFromEntries(entries: ScoutingEntry[], allTeamNumbers?: number[]): TeamStats[] {
    const identifiedTeamNumbers = [...new Set(entries.map(e => e.teamNumber))];
    const teamNumbers = allTeamNumbers
        ? [...new Set([...identifiedTeamNumbers, ...allTeamNumbers])]
        : identifiedTeamNumbers;

    return teamNumbers
        .map(num => {
            const teamEntries = entries.filter(e => e.teamNumber === num);
            if (teamEntries.length === 0) {
                return createEmptyStats(num);
            }
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
