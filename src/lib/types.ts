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
  autoFuelScored: number;
  autoHubScore: boolean;
  autoClimb: 'none' | 'low' | 'mid' | 'high';

  // Teleop
  teleopFuelActive: number;
  teleopFuelCycles: 'low' | 'medium' | 'high';
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
  avgAutoFuel: number;
  avgTeleopFuel: number;
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
