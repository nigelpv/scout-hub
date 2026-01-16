import { ScoutingEntry, PicklistTeam } from './types';

const ENTRIES_KEY = 'frc_scouting_entries';
const PICKLIST_KEY = 'frc_picklist';
const EVENT_KEY = 'frc_current_event';

export function getEntries(): ScoutingEntry[] {
  const data = localStorage.getItem(ENTRIES_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveEntry(entry: ScoutingEntry): void {
  const entries = getEntries();
  const existingIndex = entries.findIndex(e => e.id === entry.id);
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function deleteEntry(id: string): void {
  const entries = getEntries().filter(e => e.id !== id);
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function getEntriesForTeam(teamNumber: number): ScoutingEntry[] {
  return getEntries().filter(e => e.teamNumber === teamNumber);
}

export function getEntriesForMatch(matchNumber: number): ScoutingEntry[] {
  return getEntries().filter(e => e.matchNumber === matchNumber);
}

export function getPicklist(): PicklistTeam[] {
  const data = localStorage.getItem(PICKLIST_KEY);
  return data ? JSON.parse(data) : [];
}

export function savePicklist(picklist: PicklistTeam[]): void {
  localStorage.setItem(PICKLIST_KEY, JSON.stringify(picklist));
}

export function getCurrentEvent(): string {
  return localStorage.getItem(EVENT_KEY) || '';
}

export function setCurrentEvent(event: string): void {
  localStorage.setItem(EVENT_KEY, event);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
