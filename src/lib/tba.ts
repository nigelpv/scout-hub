const TBA_API_KEY = import.meta.env.VITE_TBA_API_KEY;
const BASE_URL = 'https://www.thebluealliance.com/api/v3';

export interface TBAEvent {
  key: string;
  name: string;
  start_date: string;
  end_date: string;
  event_code: string;
  year: number;
}

export interface TBAMatch {
  key: string;
  match_number: number;
  alliances: {
    red: {
      team_keys: string[];
    };
    blue: {
      team_keys: string[];
    };
  };
}

const fetchTBA = async (endpoint: string) => {
  if (!TBA_API_KEY) {
    console.warn('VITE_TBA_API_KEY is not set');
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'X-TBA-Auth-Key': TBA_API_KEY,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error('Invalid TBA API Key');
      }
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('TBA API Error:', error);
    return null;
  }
};

// Simple cache for match data to avoid redundant requests
const matchCache: Record<string, TBAMatch> = {};

export const fetchMatchData = async (eventKey: string, matchNumber: number): Promise<TBAMatch | null> => {
  const matchKey = `${eventKey}_qm${matchNumber}`;
  
  if (matchCache[matchKey]) {
    return matchCache[matchKey];
  }

  const data = await fetchTBA(`/match/${matchKey}/simple`);
  if (data) {
    matchCache[matchKey] = data;
  }
  return data;
};

export const fetchTeamEvents = async (teamKey: string, year: number): Promise<TBAEvent[]> => {
  const data = await fetchTBA(`/team/${teamKey}/events/${year}/simple`);
  return data || [];
};

export const determineCurrentEvent = (events: TBAEvent[]): TBAEvent | null => {
  if (!events || events.length === 0) return null;

  // Sort events by start date
  const sortedEvents = [...events].sort((a, b) => a.start_date.localeCompare(b.start_date));
  
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Find the first event where today is before or on the end_date
  // This handles ongoing events and picks the next one if none are ongoing
  const currentOrNext = sortedEvents.find(event => today <= event.end_date);

  return currentOrNext || sortedEvents[sortedEvents.length - 1]; // Fallback to last event of year if all passed
};

export const getTeamFromMatch = (match: TBAMatch, position: string): string => {
  if (!match || !position) return '';
  
  const [alliance, posStr] = position.split(' ');
  const index = parseInt(posStr) - 1;
  const color = alliance.toLowerCase() as 'red' | 'blue';
  
  const teamKey = match.alliances[color]?.team_keys[index];
  return teamKey ? teamKey.replace('frc', '') : '';
};
