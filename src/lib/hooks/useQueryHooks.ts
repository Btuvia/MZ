/**
 * React Query Hooks for Data Fetching
 * 
 * These hooks provide cached data fetching with automatic revalidation,
 * optimistic updates, and error handling.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { handleError, showSuccess } from '@/lib/error-handler';
import { firestoreService } from '@/lib/firebase/firestore-service';
import type { Client, Task, Lead, Deal, SystemUser } from '@/types';
import type { TaskSubject } from '@/types/subject';
import type { Workflow, WorkflowInstance } from '@/types/workflow';

// ============================================
// QUERY KEYS - Centralized key management
// ============================================
export const queryKeys = {
    // Clients
    clients: ['clients'] as const,
    client: (id: string) => ['clients', id] as const,
    clientsPaginated: (page: number, pageSize: number) => ['clients', 'paginated', page, pageSize] as const,
    clientsCount: ['clients', 'count'] as const,

    // Tasks
    tasks: ['tasks'] as const,
    task: (id: string) => ['tasks', id] as const,
    tasksByClient: (clientId: string) => ['tasks', 'client', clientId] as const,
    tasksPaginated: (page: number, pageSize: number) => ['tasks', 'paginated', page, pageSize] as const,

    // Leads
    leads: ['leads'] as const,
    lead: (id: string) => ['leads', id] as const,
    leadsPaginated: (page: number, pageSize: number) => ['leads', 'paginated', page, pageSize] as const,

    // Deals
    deals: ['deals'] as const,
    deal: (id: string) => ['deals', id] as const,

    // Users
    users: ['users'] as const,
    user: (id: string) => ['users', id] as const,

    // Workflows
    workflows: ['workflows'] as const,
    workflow: (id: string) => ['workflows', id] as const,
    workflowInstances: (clientId?: string) => clientId 
        ? ['workflow-instances', 'client', clientId] as const 
        : ['workflow-instances'] as const,

    // Settings
    leadStatuses: ['lead-statuses'] as const,
    taskStatuses: ['task-statuses'] as const,
    leadSources: ['lead-sources'] as const,
    subjects: ['subjects'] as const,
};

// ============================================
// CLIENTS HOOKS
// ============================================

/**
 * Fetch all clients
 */
export function useClients(options?: Partial<UseQueryOptions<Client[]>>) {
    return useQuery({
        queryKey: queryKeys.clients,
        queryFn: () => firestoreService.getClients(),
        ...options,
    });
}

/**
 * Fetch a single client by ID
 */
export function useClient(id: string | null | undefined) {
    return useQuery({
        queryKey: queryKeys.client(id || ''),
        queryFn: () => firestoreService.getClient(id!),
        enabled: !!id,
    });
}

/**
 * Fetch clients with pagination
 */
export function useClientsPaginated(page: number, pageSize: number = 10) {
    return useQuery({
        queryKey: queryKeys.clientsPaginated(page, pageSize),
        queryFn: async () => {
            return firestoreService.getClientsPaginated({ pageSize });
        },
    });
}

/**
 * Get total clients count
 */
export function useClientsCount() {
    return useQuery({
        queryKey: queryKeys.clientsCount,
        queryFn: () => firestoreService.getClientsCount(),
        staleTime: 10 * 60 * 1000, // Count can be stale longer
    });
}

/**
 * Create a new client
 */
export function useCreateClient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Omit<Client, 'id'>) => firestoreService.addClient(data),
        onSuccess: () => {
            // Invalidate and refetch clients list
            queryClient.invalidateQueries({ queryKey: queryKeys.clients });
            queryClient.invalidateQueries({ queryKey: queryKeys.clientsCount });
            showSuccess('הלקוח נוסף בהצלחה');
        },
        onError: (error) => {
            handleError(error, { context: 'יצירת לקוח' });
        },
    });
}

/**
 * Update a client
 */
export function useUpdateClient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Client> }) =>
            firestoreService.updateClient(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.clients });
            queryClient.invalidateQueries({ queryKey: queryKeys.client(id) });
            showSuccess('הלקוח עודכן בהצלחה');
        },
        onError: (error) => {
            handleError(error, { context: 'עדכון לקוח' });
        },
    });
}

/**
 * Delete a client
 */
export function useDeleteClient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => firestoreService.deleteClient(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.clients });
            queryClient.invalidateQueries({ queryKey: queryKeys.clientsCount });
            showSuccess('הלקוח נמחק בהצלחה');
        },
        onError: (error) => {
            handleError(error, { context: 'מחיקת לקוח' });
        },
    });
}

// ============================================
// TASKS HOOKS
// ============================================

/**
 * Fetch all tasks
 */
export function useTasks() {
    return useQuery({
        queryKey: queryKeys.tasks,
        queryFn: () => firestoreService.getTasks(),
    });
}

/**
 * Fetch a single task
 */
export function useTask(id: string | null | undefined) {
    return useQuery({
        queryKey: queryKeys.task(id || ''),
        queryFn: () => firestoreService.getTask(id!),
        enabled: !!id,
    });
}

/**
 * Fetch tasks by client
 */
export function useTasksByClient(clientId: string | null | undefined) {
    return useQuery({
        queryKey: queryKeys.tasksByClient(clientId || ''),
        queryFn: () => firestoreService.getTasksForClient(clientId!),
        enabled: !!clientId,
    });
}

/**
 * Create a new task
 */
export function useCreateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Omit<Task, 'id'>) => firestoreService.addTask(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
            showSuccess('המשימה נוצרה בהצלחה');
        },
        onError: (error) => {
            handleError(error, { context: 'יצירת משימה' });
        },
    });
}

/**
 * Update a task
 */
export function useUpdateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
            firestoreService.updateTask(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
            queryClient.invalidateQueries({ queryKey: queryKeys.task(id) });
            showSuccess('המשימה עודכנה בהצלחה');
        },
        onError: (error) => {
            handleError(error, { context: 'עדכון משימה' });
        },
    });
}

/**
 * Delete a task
 */
export function useDeleteTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => firestoreService.deleteTask(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
            showSuccess('המשימה נמחקה בהצלחה');
        },
        onError: (error) => {
            handleError(error, { context: 'מחיקת משימה' });
        },
    });
}

// ============================================
// LEADS HOOKS
// ============================================

/**
 * Fetch all leads
 */
export function useLeads() {
    return useQuery({
        queryKey: queryKeys.leads,
        queryFn: () => firestoreService.getLeads(),
    });
}

/**
 * Fetch a single lead
 */
export function useLead(id: string | null | undefined) {
    return useQuery({
        queryKey: queryKeys.lead(id || ''),
        queryFn: () => firestoreService.getLeads().then(leads => leads.find(l => l.id === id) || null),
        enabled: !!id,
    });
}

/**
 * Create a new lead
 */
export function useCreateLead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Omit<Lead, 'id'>) => firestoreService.addLead(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.leads });
            showSuccess('הליד נוסף בהצלחה');
        },
        onError: (error) => {
            handleError(error, { context: 'יצירת ליד' });
        },
    });
}

/**
 * Update a lead
 */
export function useUpdateLead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) =>
            firestoreService.updateLead(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.leads });
            queryClient.invalidateQueries({ queryKey: queryKeys.lead(id) });
            showSuccess('הליד עודכן בהצלחה');
        },
        onError: (error) => {
            handleError(error, { context: 'עדכון ליד' });
        },
    });
}

/**
 * Delete a lead
 */
export function useDeleteLead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => firestoreService.deleteLead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.leads });
            showSuccess('הליד נמחק בהצלחה');
        },
        onError: (error) => {
            handleError(error, { context: 'מחיקת ליד' });
        },
    });
}

// ============================================
// DEALS HOOKS
// ============================================

/**
 * Fetch all deals
 */
export function useDeals() {
    return useQuery({
        queryKey: queryKeys.deals,
        queryFn: () => firestoreService.getDeals(),
    });
}

/**
 * Create a deal
 */
export function useCreateDeal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Omit<Deal, 'id'>) => firestoreService.addDeal(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.deals });
            showSuccess('העסקה נוספה בהצלחה');
        },
        onError: (error) => {
            handleError(error, { context: 'יצירת עסקה' });
        },
    });
}

// ============================================
// WORKFLOWS HOOKS
// ============================================

/**
 * Fetch all workflows
 */
export function useWorkflows() {
    return useQuery({
        queryKey: queryKeys.workflows,
        queryFn: () => firestoreService.getWorkflows(),
    });
}

/**
 * Fetch a single workflow
 */
export function useWorkflow(id: string | null | undefined) {
    return useQuery({
        queryKey: queryKeys.workflow(id || ''),
        queryFn: () => firestoreService.getWorkflow(id!),
        enabled: !!id,
    });
}

/**
 * Fetch workflow instances
 */
export function useWorkflowInstances(clientId?: string) {
    return useQuery({
        queryKey: queryKeys.workflowInstances(clientId),
        queryFn: () => firestoreService.getWorkflowInstances(clientId),
    });
}

// ============================================
// SETTINGS HOOKS
// ============================================

/**
 * Fetch lead statuses
 */
export function useLeadStatuses() {
    return useQuery({
        queryKey: queryKeys.leadStatuses,
        queryFn: () => firestoreService.getLeadStatuses(),
        staleTime: 30 * 60 * 1000, // Settings change rarely
    });
}

/**
 * Fetch task statuses
 */
export function useTaskStatuses() {
    return useQuery({
        queryKey: queryKeys.taskStatuses,
        queryFn: () => firestoreService.getTaskStatuses(),
        staleTime: 30 * 60 * 1000,
    });
}

/**
 * Fetch lead sources
 */
export function useLeadSources() {
    return useQuery({
        queryKey: queryKeys.leadSources,
        queryFn: () => firestoreService.getLeadSources(),
        staleTime: 30 * 60 * 1000,
    });
}

/**
 * Fetch task subjects
 */
export function useSubjects() {
    return useQuery({
        queryKey: queryKeys.subjects,
        queryFn: () => firestoreService.getSubjects(),
        staleTime: 30 * 60 * 1000,
    });
}

// ============================================
// USERS HOOKS
// ============================================

/**
 * Fetch all users
 */
export function useUsers() {
    return useQuery({
        queryKey: queryKeys.users,
        queryFn: () => firestoreService.getUsers(),
    });
}

/**
 * Fetch a single user
 */
export function useUser(id: string | null | undefined) {
    return useQuery({
        queryKey: queryKeys.user(id || ''),
        queryFn: () => firestoreService.getUserByUid(id!),
        enabled: !!id,
    });
}

// ============================================
// CAMPAIGNS HOOKS
// ============================================

/**
 * Fetch all campaigns
 */
export function useCampaigns() {
    return useQuery({
        queryKey: ['campaigns'] as const,
        queryFn: () => firestoreService.getCampaigns(),
    });
}

/**
 * Create a new campaign
 */
export function useCreateCampaign() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            company: string;
            productType: string;
            discountPercent: number;
            startDate: Date;
            endDate: Date;
            minPremium: number;
            target: number;
        }) => firestoreService.addCampaign(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            showSuccess('קמפיין נוצר בהצלחה');
        },
        onError: (error) => handleError(error),
    });
}

/**
 * Update an existing campaign
 */
export function useUpdateCampaign() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            firestoreService.updateCampaign(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            showSuccess('קמפיין עודכן בהצלחה');
        },
        onError: (error) => handleError(error),
    });
}

/**
 * Delete a campaign
 */
export function useDeleteCampaign() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => firestoreService.deleteCampaign(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            showSuccess('קמפיין נמחק בהצלחה');
        },
        onError: (error) => handleError(error),
    });
}
// ============================================
// MESSAGES HOOKS
// ============================================

/**
 * Fetch messages for a specific client
 */
export function useMessages(clientId?: string) {
    return useQuery({
        queryKey: ['messages', clientId] as const,
        queryFn: () => firestoreService.getMessages(clientId),
    });
}

/**
 * Fetch last messages per client for conversation list
 */
export function useLastMessagesPerClient() {
    return useQuery({
        queryKey: ['messages', 'lastPerClient'] as const,
        queryFn: () => firestoreService.getLastMessagePerClient(),
    });
}

/**
 * Send a new message
 */
export function useSendMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            clientId: string;
            text: string;
            sender: 'me' | 'client';
            channel: 'whatsapp' | 'sms' | 'email';
        }) => firestoreService.addMessage(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['messages', variables.clientId] });
            queryClient.invalidateQueries({ queryKey: ['messages', 'lastPerClient'] });
        },
        onError: (error) => handleError(error),
    });
}

/**
 * Update message status (read/delivered)
 */
export function useUpdateMessageStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'sent' | 'delivered' | 'read' }) =>
            firestoreService.updateMessageStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages'] });
        },
        onError: (error) => handleError(error),
    });
}