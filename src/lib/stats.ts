import { ScoutingEntry, TeamStats } from './types';
import { getEntries } from './storage';

export function calculateTeamStats(teamNumber: number): TeamStats | null {
  const entries = getEntries().filter(e => e.teamNumber === teamNumber);
  
  if (entries.length === 0) return null;

  const matchesPlayed = entries.length;
  
  const avgAutoFuel = entries.reduce((sum, e) => sum + e.autoFuelScored, 0) / matchesPlayed;
  const avgTeleopFuel = entries.reduce((sum, e) => sum + e.teleopFuelActive, 0) / matchesPlayed;
  
  const successfulClimbs = entries.filter(e => 
    e.climbResult === 'low' || e.climbResult === 'mid' || e.climbResult === 'high'
  ).length;
  const climbSuccessRate = (successfulClimbs / matchesPlayed) * 100;
  
  const highMidClimbs = entries.filter(e => 
    e.climbResult === 'mid' || e.climbResult === 'high'
  ).length;
  const highMidClimbRate = (highMidClimbs / matchesPlayed) * 100;
  
  const defenseEntries = entries.filter(e => e.defensePlayed);
  const avgDefenseRating = defenseEntries.length > 0
    ? defenseEntries.reduce((sum, e) => sum + e.defenseEffectiveness, 0) / defenseEntries.length
    : 0;
  
  const avgDriverSkill = entries.reduce((sum, e) => sum + e.driverSkill, 0) / matchesPlayed;
  const avgRobotSpeed = entries.reduce((sum, e) => sum + e.robotSpeed, 0) / matchesPlayed;
  const avgReliability = entries.reduce((sum, e) => sum + e.reliability, 0) / matchesPlayed;

  // Calculate composite score for ranking
  const climbPoints = {
    'none': 0,
    'attempted': 1,
    'low': 3,
    'mid': 6,
    'high': 10
  };
  
  const avgClimbPoints = entries.reduce((sum, e) => sum + climbPoints[e.climbResult], 0) / matchesPlayed;
  
  const totalScore = (
    avgAutoFuel * 2 +
    avgTeleopFuel * 1.5 +
    avgClimbPoints * 3 +
    avgReliability * 5 +
    avgDriverSkill * 3 +
    avgRobotSpeed * 2
  );

  return {
    teamNumber,
    matchesPlayed,
    avgAutoFuel: Math.round(avgAutoFuel * 10) / 10,
    avgTeleopFuel: Math.round(avgTeleopFuel * 10) / 10,
    climbSuccessRate: Math.round(climbSuccessRate),
    highMidClimbRate: Math.round(highMidClimbRate),
    avgDefenseRating: Math.round(avgDefenseRating * 10) / 10,
    avgDriverSkill: Math.round(avgDriverSkill * 10) / 10,
    avgRobotSpeed: Math.round(avgRobotSpeed * 10) / 10,
    avgReliability: Math.round(avgReliability * 10) / 10,
    totalScore: Math.round(totalScore * 10) / 10,
  };
}

export function getAllTeamStats(): TeamStats[] {
  const entries = getEntries();
  const teamNumbers = [...new Set(entries.map(e => e.teamNumber))];
  
  return teamNumbers
    .map(num => calculateTeamStats(num))
    .filter((stats): stats is TeamStats => stats !== null)
    .sort((a, b) => b.totalScore - a.totalScore);
}

export function getUniqueTeams(): number[] {
  const entries = getEntries();
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
