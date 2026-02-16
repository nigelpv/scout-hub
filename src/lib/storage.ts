// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

import { ScoutingEntry, PicklistTeam } from './types';
import { toast } from 'sonner';

// ============ KEYS ============
const EVENT_KEY = 'scout_current_event';
const PENDING_ENTRIES_KEY = 'scout_pending_entries';
const ENTRIES_CACHE_KEY = 'scout_entries_cache';
const PICKLIST_CACHE_KEY = 'scout_picklist_cache';

// Custom event for sync status updates
export const SYNC_EVENT = 'scout_sync_update';
export const ENTRY_LIMIT = 500;

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
  // Return cached data immediately if available
  const cached = localStorage.getItem(ENTRIES_CACHE_KEY);
  let initialEntries: ScoutingEntry[] = cached ? JSON.parse(cached) : [];

  // Fetch from server in the background
  const fetchPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/entries`);
      if (!response.ok) throw new Error('Failed to fetch entries');
      const data = await response.json();
      localStorage.setItem(ENTRIES_CACHE_KEY, JSON.stringify(data));

      // Dispatch event so UI can refresh if it wants
      window.dispatchEvent(new CustomEvent('scout_entries_updated', { detail: data }));

      return data;
    } catch (error) {
      console.error('Error fetching entries:', error);
      return initialEntries;
    }
  })();

  // If we have cached data, return it. If not, wait for fetch.
  return initialEntries.length > 0 ? initialEntries : fetchPromise;
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

export async function saveEntry(entry: ScoutingEntry): Promise<{ success: boolean; offline?: boolean; limitReached?: boolean }> {
  try {
    // Check limit before saving
    const currentEntries = await getEntries();
    const pending = getPendingEntries();
    const totalCount = currentEntries.length + pending.length;

    if (totalCount >= ENTRY_LIMIT) {
      toast.error(`Entry limit reached (${ENTRY_LIMIT}). Please delete old entries first.`);
      return { success: false, limitReached: true };
    }

    // Try to save to server
    const response = await fetch(`${API_URL}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });

    if (response.ok) {
      // Update local cache immediately
      const current = await getEntries();
      const updated = [entry, ...current];
      localStorage.setItem(ENTRIES_CACHE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('scout_entries_updated', { detail: updated }));

      return { success: true };
    }

    // If server says limit reached (403), don't queue locally
    if (response.status === 403) {
      toast.error(`Entry limit reached on server. Please delete old entries.`);
      return { success: false, limitReached: true };
    }

    // If server error (500+), queue it locally
    if (response.status >= 500) {
      queueEntryLocally(entry);
      return { success: true, offline: true };
    }

    return { success: false };
  } catch (error) {
    // Network error (offline), check if we can queue locally
    const pending = getPendingEntries();
    // We don't know exact server count here, but we can guess from last fetch
    // For simplicity, we'll try to queue unless pending is huge
    if (pending.length >= ENTRY_LIMIT) {
      toast.error('Local buffer full. Sync and delete entries first.');
      return { success: false, limitReached: true };
    }

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
    if (response.ok) {
      const current = await getEntries();
      const updated = current.filter(e => e.id !== id);
      localStorage.setItem(ENTRIES_CACHE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('scout_entries_updated', { detail: updated }));
    }
    return response.ok;
  } catch (error) {
    console.error('Error deleting entry:', error);
    return false;
  }
}

export async function deleteEntries(ids: string[], password: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/entries/delete-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, password }),
    });
    if (response.ok) {
      const current = await getEntries();
      const updated = current.filter(e => !ids.includes(e.id));
      localStorage.setItem(ENTRIES_CACHE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('scout_entries_updated', { detail: updated }));
    }
    return response.ok;
  } catch (error) {
    console.error('Error deleting entries:', error);
    return false;
  }
}

export async function deleteTeamData(teamNumber: number, password: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/entries/team/${teamNumber}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (response.ok) {
      const current = await getEntries();
      const updated = current.filter(e => e.teamNumber !== teamNumber);
      localStorage.setItem(ENTRIES_CACHE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('scout_entries_updated', { detail: updated }));
    }
    return response.ok;
  } catch (error) {
    console.error('Error deleting team data:', error);
    return false;
  }
}

// ============ PICKLIST ============

export async function getPicklist(): Promise<PicklistTeam[]> {
  const cached = localStorage.getItem(PICKLIST_CACHE_KEY);
  let initialPicklist: PicklistTeam[] = cached ? JSON.parse(cached) : [];

  const fetchPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/picklist`);
      if (!response.ok) throw new Error('Failed to fetch picklist');
      const data = await response.json();
      localStorage.setItem(PICKLIST_CACHE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('scout_picklist_updated', { detail: data }));
      return data;
    } catch (error) {
      console.error('Error fetching picklist:', error);
      return initialPicklist;
    }
  })();

  return initialPicklist.length > 0 ? initialPicklist : fetchPromise;
}

export async function savePicklist(picklist: PicklistTeam[]): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/picklist`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(picklist),
    });
    if (response.ok) {
      localStorage.setItem(PICKLIST_CACHE_KEY, JSON.stringify(picklist));
      window.dispatchEvent(new CustomEvent('scout_picklist_updated', { detail: picklist }));
    }
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
  return localStorage.getItem(EVENT_KEY) || '2025camb';
}

export function setCurrentEvent(event: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EVENT_KEY, event);
}
