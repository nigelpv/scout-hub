export interface Team {
    number: number;
    name?: string;
}

export interface ScoutingEntry {
    id: string;
    event: string;
    matchNumber: number;
    teamNumber: number;
    scoutName?: string;
    timestamp: number;

    // Autonomous
    autoCycles: number;
    autoPreload: boolean;
    autoPreloadScored: boolean; // "Scored ALL of Preload?"
    autoPreloadCount?: number; // 0-8 if not Scored ALL
    autoEstCycleSize: number;
    autoClimb: 'none' | 'side' | 'middle';

    // Teleop
    teleopCycles: number;
    estimatedCycleSize: number;
    defenseRating: number; // 0-5 (0 = none)

    // Endgame
    climbResult: 'none' | 'low' | 'mid' | 'high';
    climbStability: number; // 1-5

    // Overall
    driverSkill: number; // 1-5
    shootingRange: 'short' | 'medium' | 'long';
    obstacleNavigation: 'none' | 'trench' | 'bump' | 'both';
    notes: string;
}

export interface TeamStats {
    teamNumber: number;
    matchesPlayed: number;
    avgAutoCycles: number;
    meanAutoCycles: number;
    medianAutoCycles: number;
    stdDevAutoCycles: number;
    autoPreloadSuccessRate: number;
    avgAutoCycleSize: number;
    avgTeleopCycles: number;
    meanTeleopCycles: number;
    medianTeleopCycles: number;
    stdDevTeleopCycles: number;
    avgCycleSize: number;
    climbSuccessRate: number;
    highMidClimbRate: number;
    avgDefenseRating: number;
    avgDriverSkill: number;
    totalScore: number; // Computed ranking score
}

export interface PicklistTeam {
    teamNumber: number;
    rank: number;
    manualOverride: boolean;
}
