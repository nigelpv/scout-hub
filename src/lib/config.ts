let currentEventKey = localStorage.getItem('scout_event_key') || '2026cahal';

export const getEventKey = () => currentEventKey;

export const setEventKey = (key: string) => {
    currentEventKey = key;
    localStorage.setItem('scout_event_key', key);
    window.dispatchEvent(new CustomEvent('scout_event_key_changed', { detail: key }));
};

// For backward compatibility while migration is in progress
export const EVENT_KEY = getEventKey();
