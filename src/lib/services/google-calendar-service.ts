/**
 * Google Calendar Integration Service
 * 
 * מספק התממשקות מלאה עם Google Calendar API
 * כולל סנכרון דו-כיווני של אירועים ופגישות
 */

// Types
export interface GoogleCalendarEvent {
    id?: string;
    summary: string;
    description?: string;
    start: {
        dateTime: string;
        timeZone?: string;
    };
    end: {
        dateTime: string;
        timeZone?: string;
    };
    attendees?: Array<{
        email: string;
        displayName?: string;
        responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
    }>;
    reminders?: {
        useDefault: boolean;
        overrides?: Array<{
            method: 'email' | 'popup';
            minutes: number;
        }>;
    };
    colorId?: string;
    location?: string;
    status?: 'confirmed' | 'tentative' | 'cancelled';
    htmlLink?: string;
}

export interface CalendarTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    scope: string;
}

export interface CalendarSyncStatus {
    isConnected: boolean;
    lastSync: Date | null;
    syncError: string | null;
    eventsCount: number;
}

// Constants
const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
].join(' ');

// Storage keys
const STORAGE_KEYS = {
    TOKENS: 'google_calendar_tokens',
    SYNC_STATUS: 'google_calendar_sync_status',
    LAST_SYNC: 'google_calendar_last_sync'
};

class GoogleCalendarService {
    private tokens: CalendarTokens | null = null;
    private syncStatus: CalendarSyncStatus = {
        isConnected: false,
        lastSync: null,
        syncError: null,
        eventsCount: 0
    };

    constructor() {
        // Load tokens from localStorage on init (client-side only)
        if (typeof window !== 'undefined') {
            this.loadTokensFromStorage();
        }
    }

    /**
     * Load tokens from localStorage
     */
    private loadTokensFromStorage(): void {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.TOKENS);
            if (stored) {
                this.tokens = JSON.parse(stored);
                this.syncStatus.isConnected = true;

                const lastSyncStr = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
                if (lastSyncStr) {
                    this.syncStatus.lastSync = new Date(lastSyncStr);
                }
            }
        } catch (error) {
            console.error('Failed to load calendar tokens:', error);
        }
    }

    /**
     * Save tokens to localStorage
     */
    private saveTokensToStorage(): void {
        if (this.tokens) {
            localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(this.tokens));
        }
    }

    /**
     * Get OAuth URL for Google Calendar authorization
     */
    getAuthUrl(): string {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const redirectUri = typeof window !== 'undefined' 
            ? `${window.location.origin}/api/auth/google-calendar/callback`
            : '';

        const params = new URLSearchParams({
            client_id: clientId || '',
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: SCOPES,
            access_type: 'offline',
            prompt: 'consent',
            state: this.generateState()
        });

        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    /**
     * Generate a random state for OAuth
     */
    private generateState(): string {
        const state = Math.random().toString(36).substring(2, 15);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('google_oauth_state', state);
        }
        return state;
    }

    /**
     * Verify OAuth state
     */
    verifyState(state: string): boolean {
        if (typeof window !== 'undefined') {
            const savedState = sessionStorage.getItem('google_oauth_state');
            sessionStorage.removeItem('google_oauth_state');
            return state === savedState;
        }
        return false;
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCodeForTokens(code: string): Promise<boolean> {
        try {
            const response = await fetch('/api/auth/google-calendar/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });

            if (!response.ok) {
                throw new Error('Failed to exchange code for tokens');
            }

            const tokens = await response.json();
            this.tokens = {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: Date.now() + (tokens.expires_in * 1000),
                scope: tokens.scope
            };

            this.saveTokensToStorage();
            this.syncStatus.isConnected = true;
            this.syncStatus.syncError = null;

            return true;
        } catch (error) {
            console.error('Failed to exchange code:', error);
            this.syncStatus.syncError = 'שגיאה באימות מול Google';
            return false;
        }
    }

    /**
     * Refresh access token if expired
     */
    async refreshTokenIfNeeded(): Promise<boolean> {
        if (!this.tokens) return false;

        // Check if token is still valid (with 5 min buffer)
        if (this.tokens.expiresAt > Date.now() + 300000) {
            return true;
        }

        try {
            const response = await fetch('/api/auth/google-calendar/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.tokens.refreshToken })
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const newTokens = await response.json();
            this.tokens = {
                ...this.tokens,
                accessToken: newTokens.access_token,
                expiresAt: Date.now() + (newTokens.expires_in * 1000)
            };

            this.saveTokensToStorage();
            return true;
        } catch (error) {
            console.error('Failed to refresh token:', error);
            this.disconnect();
            return false;
        }
    }

    /**
     * Check if connected to Google Calendar
     */
    isConnected(): boolean {
        return this.syncStatus.isConnected && !!this.tokens;
    }

    /**
     * Get sync status
     */
    getSyncStatus(): CalendarSyncStatus {
        return { ...this.syncStatus };
    }

    /**
     * Disconnect from Google Calendar
     */
    disconnect(): void {
        this.tokens = null;
        this.syncStatus = {
            isConnected: false,
            lastSync: null,
            syncError: null,
            eventsCount: 0
        };

        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEYS.TOKENS);
            localStorage.removeItem(STORAGE_KEYS.SYNC_STATUS);
            localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
        }
    }

    /**
     * Make authenticated request to Google Calendar API
     */
    private async apiRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const tokenValid = await this.refreshTokenIfNeeded();
        if (!tokenValid || !this.tokens) {
            throw new Error('Not authenticated with Google Calendar');
        }

        const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.tokens.accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || 'API request failed');
        }

        return response.json();
    }

    /**
     * Get list of user's calendars
     */
    async getCalendarList(): Promise<any[]> {
        const result = await this.apiRequest<{ items: any[] }>('/users/me/calendarList');
        return result.items || [];
    }

    /**
     * Get events from primary calendar
     */
    async getEvents(
        timeMin?: Date,
        timeMax?: Date,
        maxResults: number = 100
    ): Promise<GoogleCalendarEvent[]> {
        const params = new URLSearchParams({
            maxResults: maxResults.toString(),
            singleEvents: 'true',
            orderBy: 'startTime'
        });

        if (timeMin) {
            params.set('timeMin', timeMin.toISOString());
        }
        if (timeMax) {
            params.set('timeMax', timeMax.toISOString());
        }

        const result = await this.apiRequest<{ items: GoogleCalendarEvent[] }>(
            `/calendars/primary/events?${params.toString()}`
        );

        this.syncStatus.eventsCount = result.items?.length || 0;
        this.syncStatus.lastSync = new Date();
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, this.syncStatus.lastSync.toISOString());

        return result.items || [];
    }

    /**
     * Get today's events
     */
    async getTodayEvents(): Promise<GoogleCalendarEvent[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return this.getEvents(today, tomorrow);
    }

    /**
     * Get this week's events
     */
    async getWeekEvents(): Promise<GoogleCalendarEvent[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        return this.getEvents(today, nextWeek);
    }

    /**
     * Create a new calendar event
     */
    async createEvent(event: Omit<GoogleCalendarEvent, 'id'>): Promise<GoogleCalendarEvent> {
        return this.apiRequest<GoogleCalendarEvent>('/calendars/primary/events', {
            method: 'POST',
            body: JSON.stringify(event)
        });
    }

    /**
     * Update an existing calendar event
     */
    async updateEvent(eventId: string, event: Partial<GoogleCalendarEvent>): Promise<GoogleCalendarEvent> {
        return this.apiRequest<GoogleCalendarEvent>(`/calendars/primary/events/${eventId}`, {
            method: 'PATCH',
            body: JSON.stringify(event)
        });
    }

    /**
     * Delete a calendar event
     */
    async deleteEvent(eventId: string): Promise<void> {
        await this.apiRequest(`/calendars/primary/events/${eventId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Convert CRM task to Google Calendar event
     */
    taskToCalendarEvent(task: {
        title: string;
        description?: string;
        date: string;
        time?: string;
        clientName?: string;
        clientEmail?: string;
    }): Omit<GoogleCalendarEvent, 'id'> {
        const startDate = new Date(`${task.date}T${task.time || '09:00'}:00`);
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 1); // Default 1 hour duration

        const event: Omit<GoogleCalendarEvent, 'id'> = {
            summary: task.title,
            description: task.description,
            start: {
                dateTime: startDate.toISOString(),
                timeZone: 'Asia/Jerusalem'
            },
            end: {
                dateTime: endDate.toISOString(),
                timeZone: 'Asia/Jerusalem'
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 30 },
                    { method: 'email', minutes: 60 }
                ]
            }
        };

        // Add client as attendee if email provided
        if (task.clientEmail) {
            event.attendees = [{
                email: task.clientEmail,
                displayName: task.clientName
            }];
        }

        return event;
    }

    /**
     * Sync CRM task with Google Calendar
     */
    async syncTaskToCalendar(task: {
        id: string;
        title: string;
        description?: string;
        date: string;
        time?: string;
        clientName?: string;
        clientEmail?: string;
        googleEventId?: string;
    }): Promise<{ eventId: string }> {
        const event = this.taskToCalendarEvent(task);

        if (task.googleEventId) {
            // Update existing event
            await this.updateEvent(task.googleEventId, event);
            return { eventId: task.googleEventId };
        } else {
            // Create new event
            const created = await this.createEvent(event);
            return { eventId: created.id! };
        }
    }

    /**
     * Initial sync - called on user login
     * Gets all upcoming events and returns them
     */
    async performInitialSync(): Promise<{
        success: boolean;
        events: GoogleCalendarEvent[];
        error?: string;
    }> {
        try {
            if (!this.isConnected()) {
                return {
                    success: false,
                    events: [],
                    error: 'לא מחובר ליומן Google'
                };
            }

            // Get events for the next 30 days
            const today = new Date();
            const nextMonth = new Date(today);
            nextMonth.setDate(nextMonth.getDate() + 30);

            const events = await this.getEvents(today, nextMonth, 250);

            this.syncStatus.lastSync = new Date();
            this.syncStatus.eventsCount = events.length;
            this.syncStatus.syncError = null;

            console.log(`✅ Calendar sync complete: ${events.length} events loaded`);

            return {
                success: true,
                events
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
            this.syncStatus.syncError = errorMessage;

            console.error('❌ Calendar sync failed:', error);

            return {
                success: false,
                events: [],
                error: errorMessage
            };
        }
    }
}

// Export singleton instance
export const googleCalendarService = new GoogleCalendarService();

// Export class for testing
export { GoogleCalendarService };
