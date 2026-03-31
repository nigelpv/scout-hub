let currentEventKey = (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function')
    ? localStorage.getItem('scout_event_key') || '2026cahal'
    : '2026cahal';

export const getEventKey = () => currentEventKey;

export const setEventKey = (key: string) => {
    currentEventKey = key;
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
        localStorage.setItem('scout_event_key', key);
    }
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('scout_event_key_changed', { detail: key }));
    }
};

// For backward compatibility while migration is in progress
export const EVENT_KEY = getEventKey();
