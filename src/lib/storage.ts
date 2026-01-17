// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

import { ScoutingEntry, PicklistTeam } from './types';

// ============ ENTRIES ============

export async function getEntries(): Promise<ScoutingEntry[]> {
  try {
    const response = await fetch(`${API_URL}/entries`);
    if (!response.ok) throw new Error('Failed to fetch entries');
    return await response.json();
  } catch (error) {
    console.error('Error fetching entries:', error);
    return [];
  }
}

export async function getEntriesForTeam(teamNumber: number): Promise<ScoutingEntry[]> {
  try {
    const response = await fetch(`${API_URL}/entries/team/${teamNumber}`);
    if (!response.ok) throw new Error('Failed to fetch team entries');
    return await response.json();
  } catch (error) {
    console.error('Error fetching team entries:', error);
    return [];
  }
}

export async function saveEntry(entry: ScoutingEntry): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    return response.ok;
  } catch (error) {
    console.error('Error saving entry:', error);
    return false;
  }
}

export async function deleteEntry(id: string, password: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/entries/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting entry:', error);
    return false;
  }
}

// ============ PICKLIST ============

export async function getPicklist(): Promise<PicklistTeam[]> {
  try {
    const response = await fetch(`${API_URL}/picklist`);
    if (!response.ok) throw new Error('Failed to fetch picklist');
    return await response.json();
  } catch (error) {
    console.error('Error fetching picklist:', error);
    return [];
  }
}

export async function savePicklist(picklist: PicklistTeam[]): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/picklist`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(picklist),
    });
    return response.ok;
  } catch (error) {
    console.error('Error saving picklist:', error);
    return false;
  }
}

export async function addToPicklist(teamNumber: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/picklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamNumber }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error adding to picklist:', error);
    return false;
  }
}

export async function removeFromPicklist(teamNumber: number, password: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/picklist/${teamNumber}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error removing from picklist:', error);
    return false;
  }
}

// ============ UTILITIES ============

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Event storage (still using localStorage for this simple preference)
const EVENT_KEY = 'scout_current_event';

export function getCurrentEvent(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(EVENT_KEY) || '';
}

export function setCurrentEvent(event: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EVENT_KEY, event);
}
