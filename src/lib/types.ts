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
    autoPreloadCount: number;
    autoClimb: 'none' | 'side' | 'middle';
    autoObstacle: 'none' | 'trench' | 'bump' | 'both';

    // Teleop
    teleopCycles: number;
    defenseType: 'none' | 'pushing' | 'blocking' | 'poaching';
    defenseLocation: 'none' | 'neutral' | 'our_alliance' | 'their_alliance';
    shootingRange: 'alliance' | 'close_neutral' | 'far_neutral' | 'opponent' | null;
    teleopObstacle: 'none' | 'trench' | 'bump' | 'both';
    fuelBeaching: boolean;
    fuelBeachingType: 'none' | 'off_bump' | 'random';

    // Endgame
    climbResult: 'none' | 'low' | 'mid' | 'high';
    climbPosition: 'none' | 'side' | 'center';
    climbStability: number; // 0-5

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
    avgTeleopCycles: number;
    meanTeleopCycles: number;
    medianTeleopCycles: number;
    stdDevTeleopCycles: number;
    climbSuccessRate: number;
    highMidClimbRate: number;
    defensePlayRate: number; // % of matches where defense was played
    totalScore: number; // Computed ranking score
    opr?: number;
}

export interface PicklistTeam {
    teamNumber: number;
    rank: number;
    manualOverride: boolean;
}

export interface PitScoutingEntry {
    teamNumber: number;
    scoutName: string;
    autoClimb: 'none' | 'side' | 'middle';
    robotClimb: 'none' | 'low' | 'mid' | 'high';
    avgBalls: number;
    maxBalls: number;
    canGoUnderTrench: boolean;
    canGoOverBump: boolean;
    intakeType: string;
    shooterType: 'turret' | 'variable_angle' | 'fixed' | 'other' | 'none';
    timestamp: number;
}

