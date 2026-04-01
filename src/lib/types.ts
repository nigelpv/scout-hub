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
    shootingRange?: string | string[];

    // Match Info
    startingPosition: 'outpost_trench' | 'outpost_bump' | 'hub' | 'depot_trench' | 'depot_bump';

    // Autonomous
    autoCycles: number;
    hoppersPassedAuto: number;
    autoClimb: 'none' | 'side' | 'middle' | 'failed_attempt';
    autoObstacle: 'none' | 'outpost_trench' | 'depot_trench' | 'outpost_bump' | 'depot_bump' | 'both';

    // Teleop
    teleopCycles: number;
    hoppersPassed: number;
    playedDefense: boolean;
    defenseEffectiveness: number; // 0-5 (0 = none/did not play)
    defenseLocation: string[]; // multi-select: 'none', 'neutral', 'our_alliance', 'their_alliance'
    teleopObstacle: 'none' | 'trench' | 'bump' | 'both';
    beachingType: string[]; // multi-select: 'beached_on_bump', 'beached_on_fuel_off_bump', 'other'
    herdsFuelThroughTrench: boolean;

    // Endgame
    climbResult: 'none' | 'L1' | 'L2' | 'L3' | 'failed_attempt';
    climbPosition: 'none' | 'side' | 'center';
    driverSkill: number; // 1-5
    incapacitated: boolean;

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
    l1ClimbRate: number;
    l2ClimbRate: number;
    l3ClimbRate: number;
    defensePlayRate: number; // % of matches where defense was played
    avgDefenseEffectiveness: number;
    defenseLocationStats: Record<string, number>; // Location -> % of defense matches
    beachingRate: number; // % of matches with any beaching
    incapRate: number; // % of matches incapacitated
    avgDriverSkill: number;
    totalScore: number; // Computed ranking score
    opr?: number;
    cycleHistory?: { matchNumber: number; auto: number; teleop: number; total: number }[];
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
    hopperCapacity: number;
    intakeType: string;
    shooterType: string;
    frontPhoto: boolean;
    backPhoto: boolean;
    notes: string;
    timestamp: number;
}

