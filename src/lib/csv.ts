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
