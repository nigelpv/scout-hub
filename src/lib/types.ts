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

    // Match Info
    startingPosition: 'left_trench' | 'left_bump' | 'hub' | 'right_trench' | 'right_bump';

    // Autonomous
    autoCycles: number;
    hoppersPassedAuto: number;
    autoClimb: 'none' | 'side' | 'middle';
    autoObstacle: 'none' | 'trench' | 'bump' | 'both';

    // Teleop
    teleopCycles: number;
    hoppersPassed: number;
    defenseType: string[]; // multi-select: 'pushing', 'blocking', 'poaching'
    defenseLocation: string[]; // multi-select: 'none', 'neutral', 'our_alliance', 'their_alliance'
    shootingRange: string[]; // multi-select: 'alliance', 'close_neutral', 'far_neutral', 'opponent'
    teleopObstacle: 'none' | 'trench' | 'bump' | 'both';
    beachingType: string[]; // multi-select: 'off_bump', 'random'
    defenseRating: number; // 0-5 (0 = none)
    herdsFuelThroughTrench: boolean;

    // Endgame
    climbResult: 'none' | 'L1' | 'L2' | 'L3';
    climbPosition: 'none' | 'side' | 'center';
    driverSkill: number; // 1-5
    disabledOrShutDown: boolean;

    notes: string;
}

export interface TeamStats {
    teamNumber: number;
    matchesPlayed: number;
    avgAutoCycles: number;
    meanAutoCycles: number;
    medianAutoCycles: number;
    stdDevAutoCycles: number;
    avgHoppersPassedAuto: number;
    avgTeleopCycles: number;
    meanTeleopCycles: number;
    medianTeleopCycles: number;
    stdDevTeleopCycles: number;
    avgHoppersPassed: number;
    climbSuccessRate: number;
    l3ClimbRate: number;
    defensePlayRate: number; // % of matches where defense was played
    avgDriverSkill: number;
    totalScore: number; // Computed ranking score
    opr?: number;
}

export interface PicklistTeam {
    teamNumber: number;
    rank: number;
    manualOverride: boolean;
}

export interface PitScoutingEntry {
    event: string;
    teamNumber: number;
    scoutName: string;
    autoClimb: string[]; // multi-select: 'none', 'side', 'middle'
    robotClimb: string[]; // multi-select: 'none', 'L1', 'L2', 'L3'
    ballsPerSecond: number;
    canGoUnderTrench: boolean;
    canGoOverBump: boolean;
    canPassFuel: string[]; // multi-select: 'middle', 'opponent_zone'
    canBulldozeFuel: boolean;
    intakeType: string;
    shooterType: string;
    frontPhoto: boolean;
    backPhoto: boolean;
    notes: string;
    timestamp: number;
}

