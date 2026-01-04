/**
 * useGoogleCalendar Hook
 * 
 * Hook לניהול חיבור וסנכרון עם Google Calendar
 * מבצע סנכרון אוטומטי בעת התחברות משתמש למערכת
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { googleCalendarService, GoogleCalendarEvent, CalendarSyncStatus } from '@/lib/services/google-calendar-service';
import { useAuth } from '@/lib/contexts/AuthContext';

interface UseGoogleCalendarReturn {
    // Connection state
    isConnected: boolean;
    isLoading: boolean;
    syncStatus: CalendarSyncStatus;
    
    // Events
    events: GoogleCalendarEvent[];
    todayEvents: GoogleCalendarEvent[];
    
    // Actions
    connect: () => void;
    disconnect: () => void;
    syncNow: () => Promise<void>;
    createEvent: (event: Omit<GoogleCalendarEvent, 'id'>) => Promise<GoogleCalendarEvent | null>;
    updateEvent: (eventId: string, event: Partial<GoogleCalendarEvent>) => Promise<GoogleCalendarEvent | null>;
    deleteEvent: (eventId: string) => Promise<boolean>;
    
    // Helpers
    syncTaskToCalendar: (task: {
        id: string;
        title: string;
        description?: string;
        date: string;
        time?: string;
        clientName?: string;
        clientEmail?: string;
        googleEventId?: string;
    }) => Promise<{ eventId: string } | null>;
}

export function useGoogleCalendar(): UseGoogleCalendarReturn {
    const { user, role } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [syncStatus, setSyncStatus] = useState<CalendarSyncStatus>({
        isConnected: false,
        lastSync: null,
        syncError: null,
        eventsCount: 0
    });
    const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
    const [todayEvents, setTodayEvents] = useState<GoogleCalendarEvent[]>([]);

    // Check connection status on mount
    useEffect(() => {
        const checkConnection = () => {
            const connected = googleCalendarService.isConnected();
            setIsConnected(connected);
            setSyncStatus(googleCalendarService.getSyncStatus());
            setIsLoading(false);
        };

        checkConnection();
    }, []);

    // Auto-sync when user logs in and is admin/agent
    useEffect(() => {
        const performAutoSync = async () => {
            // Only auto-sync for admin and agent roles
            if (!user || !role || (role !== 'admin' && role !== 'agent')) {
                return;
            }

            // Check if connected to Google Calendar
            if (!googleCalendarService.isConnected()) {
                console.log('📅 Calendar not connected - skipping auto-sync');
                return;
            }

            console.log(`📅 Auto-syncing calendar for ${role}...`);
            setIsLoading(true);

            try {
                const result = await googleCalendarService.performInitialSync();
                
                if (result.success) {
                    setEvents(result.events);
                    
                    // Filter today's events
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    
                    const todayFiltered = result.events.filter(event => {
                        const eventDate = new Date(event.start.dateTime);
                        return eventDate >= today && eventDate < tomorrow;
                    });
                    setTodayEvents(todayFiltered);
                    
                    console.log(`✅ Calendar synced: ${result.events.length} events, ${todayFiltered.length} today`);
                }

                setSyncStatus(googleCalendarService.getSyncStatus());
            } catch (error) {
                console.error('Calendar auto-sync error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        performAutoSync();
    }, [user, role]);

    /**
     * Initiate Google Calendar connection
     */
    const connect = useCallback(() => {
        const authUrl = googleCalendarService.getAuthUrl();
        window.location.href = authUrl;
    }, []);

    /**
     * Disconnect from Google Calendar
     */
    const disconnect = useCallback(() => {
        googleCalendarService.disconnect();
        setIsConnected(false);
        setEvents([]);
        setTodayEvents([]);
        setSyncStatus({
            isConnected: false,
            lastSync: null,
            syncError: null,
            eventsCount: 0
        });
    }, []);

    /**
     * Manual sync
     */
    const syncNow = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await googleCalendarService.performInitialSync();
            
            if (result.success) {
                setEvents(result.events);
                
                // Filter today's events
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                
                const todayFiltered = result.events.filter(event => {
                    const eventDate = new Date(event.start.dateTime);
                    return eventDate >= today && eventDate < tomorrow;
                });
                setTodayEvents(todayFiltered);
            }

            setSyncStatus(googleCalendarService.getSyncStatus());
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Create a new calendar event
     */
    const createEvent = useCallback(async (event: Omit<GoogleCalendarEvent, 'id'>): Promise<GoogleCalendarEvent | null> => {
        try {
            const created = await googleCalendarService.createEvent(event);
            setEvents(prev => [...prev, created]);
            return created;
        } catch (error) {
            console.error('Failed to create event:', error);
            return null;
        }
    }, []);

    /**
     * Update an existing calendar event
     */
    const updateEvent = useCallback(async (
        eventId: string, 
        event: Partial<GoogleCalendarEvent>
    ): Promise<GoogleCalendarEvent | null> => {
        try {
            const updated = await googleCalendarService.updateEvent(eventId, event);
            setEvents(prev => prev.map(e => e.id === eventId ? updated : e));
            return updated;
        } catch (error) {
            console.error('Failed to update event:', error);
            return null;
        }
    }, []);

    /**
     * Delete a calendar event
     */
    const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
        try {
            await googleCalendarService.deleteEvent(eventId);
            setEvents(prev => prev.filter(e => e.id !== eventId));
            return true;
        } catch (error) {
            console.error('Failed to delete event:', error);
            return false;
        }
    }, []);

    /**
     * Sync a CRM task to Google Calendar
     */
    const syncTaskToCalendar = useCallback(async (task: {
        id: string;
        title: string;
        description?: string;
        date: string;
        time?: string;
        clientName?: string;
        clientEmail?: string;
        googleEventId?: string;
    }): Promise<{ eventId: string } | null> => {
        try {
            return await googleCalendarService.syncTaskToCalendar(task);
        } catch (error) {
            console.error('Failed to sync task to calendar:', error);
            return null;
        }
    }, []);

    return {
        isConnected,
        isLoading,
        syncStatus,
        events,
        todayEvents,
        connect,
        disconnect,
        syncNow,
        createEvent,
        updateEvent,
        deleteEvent,
        syncTaskToCalendar
    };
}
