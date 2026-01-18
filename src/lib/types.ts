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
    autoPreloadScored: boolean;
    autoEstCycleSize: number;
    autoClimb: 'none' | 'side' | 'middle';

    // Teleop
    teleopCycles: number;
    estimatedCycleSize: number;
    defensePlayed: boolean;
    defenseEffectiveness: number; // 1-5

    // Endgame
    climbResult: 'none' | 'attempted' | 'low' | 'mid' | 'high';
    climbStability: number; // 1-5

    // Overall
    driverSkill: number; // 1-5
    robotSpeed: number; // 1-5
    reliability: number; // 1-5
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
    avgRobotSpeed: number;
    avgReliability: number;
    totalScore: number; // Computed ranking score
}

export interface PicklistTeam {
    teamNumber: number;
    rank: number;
    manualOverride: boolean;
}
