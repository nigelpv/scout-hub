import { ScoutingEntry, PitScoutingEntry } from './types';
import { getEntries, getPitEntries } from './storage';

/**
 * Converts an array of objects to a CSV string
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header];
            // Handle arrays (multi-select fields) — join with pipe separator
            if (Array.isArray(val)) {
                const joined = val.join('|');
                return `"${joined}"`;
            }
            // Handle strings with commas, quotes, or newlines
            if (typeof val === 'string') {
                const escaped = val.replace(/"/g, '""');
                return `"${escaped}"`;
            }
            // Handle null/undefined
            if (val === null || val === undefined) {
                return '';
            }
            return val;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

/**
 * Triggers a browser download for a CSV string
 */
function downloadCSV(csvString: string, fileName: string) {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

/**
 * Exports all match scouting entries to CSV
 */
export async function exportMatchEntriesToCSV() {
    try {
        const entries = await getEntries();
        if (entries.length === 0) {
            return { success: false, message: 'No match entries found' };
        }

        const csvString = convertToCSV(entries);
        const date = new Date().toISOString().split('T')[0];
        downloadCSV(csvString, `match_scouting_${date}.csv`);
        return { success: true };
    } catch (error) {
        console.error('Error exporting match entries:', error);
        return { success: false, message: 'Failed to export match entries' };
    }
}

/**
 * Exports all pit scouting entries to CSV
 */
export async function exportPitEntriesToCSV() {
    try {
        const entries = await getPitEntries();
        if (entries.length === 0) {
            return { success: false, message: 'No pit entries found' };
        }

        const csvString = convertToCSV(entries);
        const date = new Date().toISOString().split('T')[0];
        downloadCSV(csvString, `pit_scouting_${date}.csv`);
        return { success: true };
    } catch (error) {
        console.error('Error exporting pit entries:', error);
        return { success: false, message: 'Failed to export pit entries' };
    }
}

/**
 * Exports match and pit scouting entries locally averaged out so each team occupies only one row
 */
export async function exportTeamAveragesToCSV() {
    try {
        const entries = await getEntries();
        const pitEntries = await getPitEntries();

        if (entries.length === 0 && pitEntries.length === 0) {
            return { success: false, message: 'No data to export' };
        }

        const allTeamNumbers = [...new Set([
            ...entries.map(e => e.teamNumber),
            ...pitEntries.map(e => e.teamNumber)
        ])].sort((a, b) => a - b);

        const teamAverages = allTeamNumbers.map(teamNum => {
            const teamMatches = entries.filter(e => e.teamNumber === teamNum);
            const teamPitEntry = pitEntries.find(e => e.teamNumber === teamNum);
            const count = teamMatches.length;

            const avg = (key: keyof ScoutingEntry, filterZeros = false) => {
                if (count === 0) return '';
                const values = teamMatches
                    .map(e => Number(e[key]) || 0)
                    .filter(v => !filterZeros || v > 0);

                if (values.length === 0) return '0.00';
                const sum = values.reduce((acc, v) => acc + v, 0);
                return (sum / values.length).toFixed(2);
            };

            const mode = (key: keyof ScoutingEntry) => {
                if (count === 0) return '';
                const counts: Record<string, number> = {};
                let maxCount = 0;
                let maxVal = '';

                teamMatches.forEach(e => {
                    const val = String(e[key] || '');
                    if (val === 'none' || val === 'null' || !val) return;
                    counts[val] = (counts[val] || 0) + 1;
                    if (counts[val] > maxCount) {
                        maxCount = counts[val];
                        maxVal = val;
                    }
                });
                return maxVal || 'none';
            };

            return {
                TeamNumber: teamNum,
                MatchesPlayed: count,

                // Auto Averages
                AutoCycles_Avg: avg('autoCycles'),
                AutoClimb_Mode: mode('autoClimb'),
                AutoObstacle_Mode: mode('autoObstacle'),

                // Teleop Averages
                TeleopCycles_Avg: avg('teleopCycles'),
                PlayedDefense_Rate: avg('playedDefense'),
                DefenseEffectiveness_Avg: avg('defenseEffectiveness', true),
                DefenseLocation_Mode: mode('defenseLocation'),
                TeleopObstacle_Mode: mode('teleopObstacle'),
                HerdsThroughTrench_Rate: avg('herdsFuelThroughTrench'),

                // Endgame Averages
                ClimbResult_Mode: mode('climbResult'),
                ClimbPosition_Mode: mode('climbPosition'),
                DriverSkill_Avg: avg('driverSkill', true),
                Incapacitated_Rate: avg('incapacitated'),

                // Pit Data
                Pit_AutoClimb: teamPitEntry?.autoClimb?.join('|') ?? '',
                Pit_RobotClimb: teamPitEntry?.robotClimb?.join('|') ?? '',
                Pit_BallsPerSecond: teamPitEntry?.ballsPerSecond ?? '',
                Pit_HopperCapacity: teamPitEntry?.hopperCapacity ?? '',
                Pit_CanGoUnderTrench: teamPitEntry?.canGoUnderTrench ?? '',
                Pit_CanGoOverBump: teamPitEntry?.canGoOverBump ?? '',
                Pit_IntakeType: teamPitEntry?.intakeType ?? '',
                Pit_ShooterType: teamPitEntry?.shooterType ?? '',
                Pit_Notes: teamPitEntry?.notes ?? ''
            };
        });

        const csvString = convertToCSV(teamAverages);
        const date = new Date().toISOString().split('T')[0];
        downloadCSV(csvString, `team_averages_${date}.csv`);
        return { success: true };
    } catch (error) {
        console.error('Error exporting team averages:', error);
        return { success: false, message: 'Failed to export team averages' };
    }
}
