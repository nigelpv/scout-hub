// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

import { ScoutingEntry, PicklistTeam } from './types';
import { toast } from 'sonner';

// ============ KEYS ============
const EVENT_KEY = 'scout_current_event';
const PENDING_ENTRIES_KEY = 'scout_pending_entries';

// Custom event for sync status updates
export const SYNC_EVENT = 'scout_sync_update';

export interface SyncStatus {
  pendingCount: number;
  isSyncing: boolean;
}

export function subscribeToSync(callback: (status: SyncStatus) => void): () => void {
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<SyncStatus>;
    callback(customEvent.detail);
  };

  window.addEventListener(SYNC_EVENT, handler);
  return () => window.removeEventListener(SYNC_EVENT, handler);
}

function dispatchSyncUpdate(isSyncing: boolean) {
  const status: SyncStatus = {
    pendingCount: getPendingCount(),
    isSyncing
  };
  window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: status }));
}

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

export async function saveEntry(entry: ScoutingEntry): Promise<{ success: boolean; offline?: boolean }> {
  try {
    // Try to save to server
    const response = await fetch(`${API_URL}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });

    if (response.ok) {
      return { success: true };
    }

    // If server error (500+), queue it locally
    if (response.status >= 500) {
      queueEntryLocally(entry);
      return { success: true, offline: true };
    }

    return { success: false };
  } catch (error) {
    // Network error (offline), queue it locally
    console.warn('Network error, saving entry locally:', error);
    queueEntryLocally(entry);
    return { success: true, offline: true };
  }
}

function queueEntryLocally(entry: ScoutingEntry) {
  const pending = getPendingEntries();
  pending.push(entry);
  localStorage.setItem(PENDING_ENTRIES_KEY, JSON.stringify(pending));
  dispatchSyncUpdate(false);
}

function getPendingEntries(): ScoutingEntry[] {
  const stored = localStorage.getItem(PENDING_ENTRIES_KEY);
  return stored ? JSON.parse(stored) : [];
}

let isSyncing = false;

export async function syncPendingEntries(): Promise<void> {
  if (isSyncing) return;

  const pending = getPendingEntries();
  if (pending.length === 0) {
    dispatchSyncUpdate(false);
    return;
  }

  // Double check we are actually online before trying to sync
  if (!navigator.onLine) {
    console.log('Sync triggered but navigator is offline');
    return;
  }

  isSyncing = true;
  dispatchSyncUpdate(true);

  console.log(`Attempting to sync ${pending.length} pending entries...`);
  const remaining: ScoutingEntry[] = [];
  let successCount = 0;

  for (const entry of pending) {
    try {
      const response = await fetch(`${API_URL}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });

      if (response.ok) {
        successCount++;
      } else {
        const errorText = await response.text();
        console.error(`Sync failed for entry ${entry.id}: ${response.status} ${response.statusText} - ${errorText}`);
        remaining.push(entry);
      }
    } catch (error) {
      console.error(`Sync network error for entry ${entry.id}:`, error);
      remaining.push(entry);
    }
  }

  localStorage.setItem(PENDING_ENTRIES_KEY, JSON.stringify(remaining));

  isSyncing = false;
  dispatchSyncUpdate(false);

  if (successCount > 0) {
    toast.success(`Synced ${successCount} entries!`);
  }
}

export function initializeSync(): () => void {
  if (typeof window === 'undefined') return () => { };

  // Initial sync attempt
  syncPendingEntries();

  const handleOnline = () => {
    console.log('App is online, triggering sync in 3s...');
    // Add delay to let connection stabilize
    setTimeout(() => {
      syncPendingEntries();
    }, 3000);
  };

  window.addEventListener('online', handleOnline);
  return () => window.removeEventListener('online', handleOnline);
}

export function getPendingCount(): number {
  return getPendingEntries().length;
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

export function getCurrentEvent(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(EVENT_KEY) || '';
}

export function setCurrentEvent(event: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EVENT_KEY, event);
}
