import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    Timestamp,
    WhereFilterOp,
    setDoc,
    orderBy,
    limit,
    startAfter,
    getCountFromServer,
    DocumentSnapshot,
    QueryDocumentSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { 
    Client, 
    Task, 
    Lead, 
    Deal, 
    SystemUser, 
    UserRole,
    ContactRequest,
    FinancialProduct,
    Collaboration,
    ActivityLogEntry,
    UserPreferences
} from "@/types";
import { Workflow, WorkflowInstance } from "@/types/workflow";

// ============================================
// PAGINATION TYPES
// ============================================

export interface PaginationOptions {
    pageSize?: number;
    lastDoc?: DocumentSnapshot | null;
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
    data: T[];
    lastDoc: QueryDocumentSnapshot | null;
    hasMore: boolean;
    totalCount?: number;
}

const DEFAULT_PAGE_SIZE = 25;

// ============================================
// TYPE DEFINITIONS FOR FIRESTORE SERVICE
// ============================================

export interface LeadStatus {
    id?: string;
    name: string;
    color: string;
    order: number;
    createdAt?: Date;
}

export interface TaskStatus {
    id?: string;
    name: string;
    color: string;
    order: number;
    createdAt?: Date;
}

export interface LeadSource {
    id?: string;
    name: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface UserPermission {
    id?: string;
    userId: string;
    permissionKey: string;
    isGranted: boolean;
    createdAt?: Date;
}

export interface LeadTransfer {
    id?: string;
    leadId: string;
    fromUserId: string;
    toUserId: string;
    reason?: string;
    status: 'pending' | 'accepted' | 'rejected';
    transferredAt?: Date;
    respondedAt?: Date;
}

export interface TaskTransfer {
    id?: string;
    taskId: string;
    fromUserId: string;
    toUserId: string;
    reason?: string;
    status: 'pending' | 'accepted' | 'rejected';
    transferredAt?: Date;
    respondedAt?: Date;
}

export interface ActivityLog {
    id?: string;
    entityType: string;
    entityId: string;
    userId: string;
    action: string;
    details?: Record<string, unknown>;
    createdAt?: Date;
}

export interface DistributionSetting {
    id?: string;
    userId: string;
    settingKey: string;
    settingValue: string;
    category?: string;
    createdAt?: Date;
}

export interface Subject {
    id?: string;
    name: string;
    description?: string;
    color?: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface DocumentFilter {
    field: string;
    operator: WhereFilterOp;
    value: unknown;
}

const CLIENTS_COLLECTION = "clients";
const USERS_COLLECTION = "users";

export const firestoreService = {
    // --- System Users (Authentication) ---
    
    /**
     * Get user by Firebase Auth UID
     * This is the secure way to determine user role
     */
    async getUserByUid(uid: string): Promise<SystemUser | null> {
        if (!uid) return null;
        try {
            const q = query(collection(db, USERS_COLLECTION), where("uid", "==", uid));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                return null;
            }
            
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() } as SystemUser;
        } catch (error) {
            console.error("Error fetching user by UID:", error);
            return null;
        }
    },

    /**
     * Get user role by Firebase Auth UID
     * Returns null if user doesn't exist
     */
    async getUserRole(uid: string): Promise<UserRole | null> {
        const user = await this.getUserByUid(uid);
        return user?.role ?? null;
    },

    /**
     * Create or update user profile on first login
     */
    async upsertUser(uid: string, data: Partial<SystemUser>): Promise<void> {
        const existingUser = await this.getUserByUid(uid);
        
        if (existingUser) {
            // Update existing user
            const docRef = doc(db, USERS_COLLECTION, existingUser.id);
            await updateDoc(docRef, {
                ...data,
                lastLoginAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
        } else {
            // Create new user with default role 'client'
            await addDoc(collection(db, USERS_COLLECTION), {
                uid,
                role: 'client' as UserRole, // Default role for new users
                isActive: true,
                ...data,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                lastLoginAt: Timestamp.now()
            });
        }
    },

    /**
     * Update user role (admin only)
     */
    async updateUserRole(userId: string, role: UserRole): Promise<void> {
        const docRef = doc(db, USERS_COLLECTION, userId);
        await updateDoc(docRef, {
            role,
            updatedAt: Timestamp.now()
        });
    },

    // --- Users ---
    async getUsers(): Promise<SystemUser[]> {
        const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemUser));
    },

    // --- Clients ---

    async getClients(): Promise<Client[]> {
        const querySnapshot = await getDocs(collection(db, CLIENTS_COLLECTION));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
    },

    /**
     * Get clients with pagination support
     */
    async getClientsPaginated(options: PaginationOptions = {}): Promise<PaginatedResult<Client>> {
        const {
            pageSize = DEFAULT_PAGE_SIZE,
            lastDoc = null,
            orderByField = 'createdAt',
            orderDirection = 'desc'
        } = options;

        try {
            // Build query
            let q = query(
                collection(db, CLIENTS_COLLECTION),
                orderBy(orderByField, orderDirection),
                limit(pageSize + 1) // Fetch one extra to check if there's more
            );

            // If we have a last document, start after it
            if (lastDoc) {
                q = query(
                    collection(db, CLIENTS_COLLECTION),
                    orderBy(orderByField, orderDirection),
                    startAfter(lastDoc),
                    limit(pageSize + 1)
                );
            }

            const querySnapshot = await getDocs(q);
            const docs = querySnapshot.docs;
            
            // Check if there are more results
            const hasMore = docs.length > pageSize;
            
            // Remove the extra document if it exists
            const resultDocs = hasMore ? docs.slice(0, pageSize) : docs;
            
            return {
                data: resultDocs.map(doc => ({ id: doc.id, ...doc.data() } as Client)),
                lastDoc: resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null,
                hasMore
            };
        } catch (error) {
            console.error("Error fetching paginated clients:", error);
            return { data: [], lastDoc: null, hasMore: false };
        }
    },

    /**
     * Get total count of clients
     */
    async getClientsCount(): Promise<number> {
        try {
            const coll = collection(db, CLIENTS_COLLECTION);
            const snapshot = await getCountFromServer(coll);
            return snapshot.data().count;
        } catch (error) {
            console.error("Error getting clients count:", error);
            return 0;
        }
    },

    async getClient(id: string) {
        if (!id) return null;
        const docRef = doc(db, CLIENTS_COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    },

    async addClient(data: Omit<Client, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, CLIENTS_COLLECTION), {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateClient(id: string, data: Partial<Client>): Promise<void> {
        const docRef = doc(db, CLIENTS_COLLECTION, id);
        // Filter out undefined values - Firebase doesn't accept them
        const cleanData = Object.fromEntries(
            Object.entries(data).filter(([_, value]) => value !== undefined)
        );
        await updateDoc(docRef, {
            ...cleanData,
            updatedAt: Timestamp.now()
        });
    },

    async deleteClient(id: string) {
        await deleteDoc(doc(db, CLIENTS_COLLECTION, id));
    },

    // --- Tasks ---

    async getTask(id: string): Promise<import('@/types').Task | null> {
        if (!id) return null;
        const docRef = doc(db, "tasks", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as import('@/types').Task;
        }
        return null;
    },

    async getTasks(): Promise<import('@/types').Task[]> {
        const querySnapshot = await getDocs(collection(db, "tasks"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as import('@/types').Task));
    },

    /**
     * Get tasks with pagination support
     */
    async getTasksPaginated(options: PaginationOptions = {}): Promise<PaginatedResult<Task>> {
        const {
            pageSize = DEFAULT_PAGE_SIZE,
            lastDoc = null,
            orderByField = 'createdAt',
            orderDirection = 'desc'
        } = options;

        try {
            let q = query(
                collection(db, "tasks"),
                orderBy(orderByField, orderDirection),
                limit(pageSize + 1)
            );

            if (lastDoc) {
                q = query(
                    collection(db, "tasks"),
                    orderBy(orderByField, orderDirection),
                    startAfter(lastDoc),
                    limit(pageSize + 1)
                );
            }

            const querySnapshot = await getDocs(q);
            const docs = querySnapshot.docs;
            const hasMore = docs.length > pageSize;
            const resultDocs = hasMore ? docs.slice(0, pageSize) : docs;

            return {
                data: resultDocs.map(doc => ({ id: doc.id, ...doc.data() } as Task)),
                lastDoc: resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null,
                hasMore
            };
        } catch (error) {
            console.error("Error fetching paginated tasks:", error);
            return { data: [], lastDoc: null, hasMore: false };
        }
    },

    /**
     * Get total count of tasks
     */
    async getTasksCount(): Promise<number> {
        try {
            const coll = collection(db, "tasks");
            const snapshot = await getCountFromServer(coll);
            return snapshot.data().count;
        } catch (error) {
            console.error("Error getting tasks count:", error);
            return 0;
        }
    },

    async getTasksForClient(clientId: string) {
        if (!clientId) return [];
        const q = query(collection(db, "tasks"), where("clientId", "==", clientId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    },

    async getTasksByAssignee(assigneeName: string): Promise<Task[]> {
        if (!assigneeName) return [];
        const q = query(collection(db, "tasks"), where("assignee", "==", assigneeName));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    },

    // ... (other methods should be updated similarly if possible, but I'll focus on the ones causing errors first)



    async addTask(data: Omit<Task, 'id'>): Promise<string> {
        // Remove id if present, let firestore generate it
        const { id, ...taskData } = data as Task;
        const docRef = await addDoc(collection(db, "tasks"), {
            ...taskData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateTask(id: string, data: Partial<Task>): Promise<void> {
        const docRef = doc(db, "tasks", id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    async deleteTask(id: string) {
        await deleteDoc(doc(db, "tasks", id));
    },

    // --- Leads ---

    async getLeads(): Promise<Lead[]> {
        const querySnapshot = await getDocs(collection(db, "leads"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
    },

    /**
     * Get leads with pagination support
     */
    async getLeadsPaginated(options: PaginationOptions = {}): Promise<PaginatedResult<Lead>> {
        const {
            pageSize = DEFAULT_PAGE_SIZE,
            lastDoc = null,
            orderByField = 'createdAt',
            orderDirection = 'desc'
        } = options;

        try {
            let q = query(
                collection(db, "leads"),
                orderBy(orderByField, orderDirection),
                limit(pageSize + 1)
            );

            if (lastDoc) {
                q = query(
                    collection(db, "leads"),
                    orderBy(orderByField, orderDirection),
                    startAfter(lastDoc),
                    limit(pageSize + 1)
                );
            }

            const querySnapshot = await getDocs(q);
            const docs = querySnapshot.docs;
            const hasMore = docs.length > pageSize;
            const resultDocs = hasMore ? docs.slice(0, pageSize) : docs;

            return {
                data: resultDocs.map(doc => ({ id: doc.id, ...doc.data() } as Lead)),
                lastDoc: resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null,
                hasMore
            };
        } catch (error) {
            console.error("Error fetching paginated leads:", error);
            return { data: [], lastDoc: null, hasMore: false };
        }
    },

    /**
     * Get total count of leads
     */
    async getLeadsCount(): Promise<number> {
        try {
            const coll = collection(db, "leads");
            const snapshot = await getCountFromServer(coll);
            return snapshot.data().count;
        } catch (error) {
            console.error("Error getting leads count:", error);
            return 0;
        }
    },

    async addLead(data: Omit<Lead, 'id'>): Promise<string> {
        const { id, ...leadData } = data as Lead;
        const docRef = await addDoc(collection(db, "leads"), {
            ...leadData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateLead(id: string, data: Partial<Lead>): Promise<void> {
        const docRef = doc(db, "leads", id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    async deleteLead(id: string) {
        await deleteDoc(doc(db, "leads", id));
    },

    // --- Create Sales/Deals ---

    async getDeals(): Promise<Deal[]> {
        const querySnapshot = await getDocs(collection(db, "deals"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deal));
    },

    async addDeal(data: Omit<Deal, 'id'>): Promise<string> {
        const { id, ...dealData } = data as Deal;
        const docRef = await addDoc(collection(db, "deals"), {
            ...dealData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateDeal(id: string, data: Partial<Deal>): Promise<void> {
        const docRef = doc(db, "deals", id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    async deleteDeal(id: string) {
        await deleteDoc(doc(db, "deals", id));
    },

    // --- Sub-collections or Arrays? ---
    // For simplicity in this phase, we are keeping policies/family as arrays within the Client document.

    // --- Contact Requests ---
    async addContactRequest(data: Omit<ContactRequest, 'id'>) {
        const docRef = await addDoc(collection(db, "contactRequests"), {
            ...data,
            createdAt: Timestamp.now(),
            status: "new"
        });
        return docRef.id;
    },

    // --- Financial Products (Savings/Pension) ---
    async getFinancialProducts(clientId: string) {
        if (!clientId) return [];
        const q = query(collection(db, "financial_products"), where("clientId", "==", clientId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addFinancialProduct(data: Omit<FinancialProduct, 'id'>) {
        const docRef = await addDoc(collection(db, "financial_products"), {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    },

    // --- Lead Statuses ---
    async getLeadStatuses() {
        const querySnapshot = await getDocs(collection(db, "lead_statuses"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addLeadStatus(data: Partial<LeadStatus> & { name: string }) {
        const docRef = await addDoc(collection(db, "lead_statuses"), {
            ...data,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateLeadStatus(id: string, data: Partial<LeadStatus>) {
        const docRef = doc(db, "lead_statuses", id);
        await updateDoc(docRef, data);
    },

    async deleteLeadStatus(id: string) {
        await deleteDoc(doc(db, "lead_statuses", id));
    },

    // --- Task Statuses ---
    async getTaskStatuses() {
        const querySnapshot = await getDocs(collection(db, "task_statuses"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addTaskStatus(data: Partial<TaskStatus> & { name: string }) {
        const docRef = await addDoc(collection(db, "task_statuses"), {
            ...data,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateTaskStatus(id: string, data: Partial<TaskStatus>) {
        const docRef = doc(db, "task_statuses", id);
        await updateDoc(docRef, data);
    },

    async deleteTaskStatus(id: string) {
        await deleteDoc(doc(db, "task_statuses", id));
    },

    // --- Lead Sources ---
    async getLeadSources() {
        const querySnapshot = await getDocs(collection(db, "lead_sources"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addLeadSource(data: Partial<LeadSource> & { name: string }) {
        const docRef = await addDoc(collection(db, "lead_sources"), {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateLeadSource(id: string, data: Partial<LeadSource>) {
        const docRef = doc(db, "lead_sources", id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    async deleteLeadSource(id: string) {
        await deleteDoc(doc(db, "lead_sources", id));
    },

    // --- User Permissions ---
    async getUserPermissions(userId: string) {
        if (!userId) return [];
        const q = query(collection(db, "user_permissions"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async updateUserPermission(userId: string, permissionKey: string, isGranted: boolean) {
        // Check if permission exists
        const q = query(
            collection(db, "user_permissions"),
            where("userId", "==", userId),
            where("permissionKey", "==", permissionKey)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            // Create new permission
            await addDoc(collection(db, "user_permissions"), {
                userId,
                permissionKey,
                isGranted,
                createdAt: Timestamp.now()
            });
        } else {
            // Update existing permission
            const docRef = doc(db, "user_permissions", querySnapshot.docs[0].id);
            await updateDoc(docRef, { isGranted });
        }
    },

    // --- Lead Transfers ---
    async getLeadTransfers(leadId?: string) {
        if (leadId) {
            const q = query(collection(db, "lead_transfers"), where("leadId", "==", leadId));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        const querySnapshot = await getDocs(collection(db, "lead_transfers"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async transferLead(data: Omit<LeadTransfer, 'id' | 'transferredAt' | 'status'>) {
        const docRef = await addDoc(collection(db, "lead_transfers"), {
            ...data,
            status: 'pending',
            transferredAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateLeadTransfer(id: string, data: Partial<LeadTransfer>) {
        const docRef = doc(db, "lead_transfers", id);
        await updateDoc(docRef, {
            ...data,
            respondedAt: Timestamp.now()
        });
    },

    // --- Task Transfers ---
    async getTaskTransfers(taskId?: string) {
        if (taskId) {
            const q = query(collection(db, "task_transfers"), where("taskId", "==", taskId));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        const querySnapshot = await getDocs(collection(db, "task_transfers"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async transferTask(data: Omit<TaskTransfer, 'id' | 'transferredAt' | 'status'>) {
        const docRef = await addDoc(collection(db, "task_transfers"), {
            ...data,
            status: 'pending',
            transferredAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateTaskTransfer(id: string, data: Partial<TaskTransfer>) {
        const docRef = doc(db, "task_transfers", id);
        await updateDoc(docRef, {
            ...data,
            respondedAt: Timestamp.now()
        });
    },

    // --- Activity Log ---
    async logActivity(data: Omit<ActivityLogEntry, 'id' | 'createdAt'>) {
        const docRef = await addDoc(collection(db, "activity_log"), {
            ...data,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async getActivityLog(entityType?: string, entityId?: string) {
        if (entityType && entityId) {
            const q = query(
                collection(db, "activity_log"),
                where("entityType", "==", entityType),
                where("entityId", "==", entityId)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        const querySnapshot = await getDocs(collection(db, "activity_log"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async getActivityLogByUser(userId: string) {
        const q = query(collection(db, "activity_log"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // --- Distribution Settings ---
    async getDistributionSettings(userId: string) {
        if (!userId) return [];
        const q = query(collection(db, "distribution_settings"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async updateDistributionSetting(userId: string, settingKey: string, settingValue: string, category?: string) {
        // Check if setting exists
        const q = query(
            collection(db, "distribution_settings"),
            where("userId", "==", userId),
            where("settingKey", "==", settingKey)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            // Create new setting
            await addDoc(collection(db, "distribution_settings"), {
                userId,
                settingKey,
                settingValue,
                category,
                createdAt: Timestamp.now()
            });
        } else {
            // Update existing setting
            const docRef = doc(db, "distribution_settings", querySnapshot.docs[0].id);
            await updateDoc(docRef, { settingValue, category });
        }
    },

    // ============================================
    // WORKFLOWS
    // ============================================

    async getWorkflows(): Promise<import('@/types/workflow').Workflow[]> {
        const querySnapshot = await getDocs(collection(db, "workflows"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as import('@/types/workflow').Workflow));
    },

    async getWorkflow(id: string): Promise<import('@/types/workflow').Workflow | null> {
        if (!id) return null;
        const docRef = doc(db, "workflows", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as import('@/types/workflow').Workflow;
        }
        return null;
    },

    async createWorkflow(data: Omit<import('@/types/workflow').Workflow, 'id' | 'createdAt' | 'updatedAt'>) {
        const docRef = await addDoc(collection(db, "workflows"), {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateWorkflow(id: string, data: Partial<import('@/types/workflow').Workflow>) {
        const docRef = doc(db, "workflows", id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    async deleteWorkflow(id: string) {
        await deleteDoc(doc(db, "workflows", id));
    },

    // ============================================
    // WORKFLOW INSTANCES
    // ============================================

    async getWorkflowInstances(clientId?: string): Promise<import('@/types/workflow').WorkflowInstance[]> {
        if (clientId) {
            const q = query(collection(db, "workflow_instances"), where("clientId", "==", clientId));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as import('@/types/workflow').WorkflowInstance));
        }
        const querySnapshot = await getDocs(collection(db, "workflow_instances"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as import('@/types/workflow').WorkflowInstance));
    },

    async getWorkflowInstance(id: string): Promise<import('@/types/workflow').WorkflowInstance | null> {
        if (!id) return null;
        const docRef = doc(db, "workflow_instances", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as import('@/types/workflow').WorkflowInstance;
        }
        return null;
    },

    async startWorkflow(workflowId: string, clientId: string, startedBy: string, additionalData?: Partial<import('@/types/workflow').WorkflowInstance>) {
        const docRef = await addDoc(collection(db, "workflow_instances"), {
            workflowId,
            clientId,
            startedBy,
            status: 'active',
            currentStep: 1,
            completedSteps: 0,
            tasks: [],
            startedAt: Timestamp.now(),
            ...additionalData
        });
        return docRef.id;
    },

    async updateWorkflowInstance(id: string, data: Partial<import('@/types/workflow').WorkflowInstance>) {
        const docRef = doc(db, "workflow_instances", id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    async completeWorkflowStep(instanceId: string, stepNumber: number) {
        const instance = await this.getWorkflowInstance(instanceId);
        if (!instance) return;

        await this.updateWorkflowInstance(instanceId, {
            completedSteps: stepNumber,
            currentStep: stepNumber + 1
        });
    },

    // ============================================
    // TASK SUBJECTS
    // ============================================

    async getSubjects(): Promise<import('@/types/subject').TaskSubject[]> {
        const querySnapshot = await getDocs(collection(db, "task_subjects"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as import('@/types/subject').TaskSubject));
    },

    async getSubject(id: string): Promise<import('@/types/subject').TaskSubject | null> {
        if (!id) return null;
        const docRef = doc(db, "task_subjects", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as import('@/types/subject').TaskSubject;
        }
        return null;
    },

    async createSubject(data: Omit<import('@/types/subject').TaskSubject, 'id' | 'createdAt' | 'updatedAt'>) {
        const docRef = await addDoc(collection(db, "task_subjects"), {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateSubject(id: string, data: Partial<import('@/types/subject').TaskSubject>) {
        const docRef = doc(db, "task_subjects", id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    async deleteSubject(id: string) {
        await deleteDoc(doc(db, "task_subjects", id));
    },

    // ============================================
    // USER PREFERENCES
    // ============================================

    async getUserPreferences(userId: string): Promise<UserPreferences | null> {
        if (!userId) return null;
        const docRef = doc(db, "user_preferences", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, userId, ...docSnap.data() } as UserPreferences;
        }
        return null;
    },

    async updateUserPreferences(userId: string, prefs: Partial<UserPreferences>) {
        const docRef = doc(db, "user_preferences", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            await updateDoc(docRef, {
                ...prefs,
                updatedAt: Timestamp.now()
            });
        } else {
            // Create new preferences
            await updateDoc(docRef, {
                userId,
                ...prefs,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
        }
    },

    // ============================================
    // ENHANCED TASK QUERIES
    // ============================================

    async getTasksByWorkflow(workflowId: string): Promise<import('@/types').Task[]> {
        if (!workflowId) return [];
        const q = query(collection(db, "tasks"), where("workflowId", "==", workflowId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as import('@/types').Task));
    },

    async getTasksBySubject(subjectId: string) {
        if (!subjectId) return [];
        const q = query(collection(db, "tasks"), where("subjectId", "==", subjectId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async getOverdueTasks() {
        const q = query(collection(db, "tasks"), where("status", "==", "overdue"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async getTasksByStatus(status: string) {
        const q = query(collection(db, "tasks"), where("status", "==", status));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async getTasksByType(type: string) {
        const q = query(collection(db, "tasks"), where("type", "==", type));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async transferTaskToUser(taskId: string, fromUserId: string, toUserId: string, reason?: string) {
        // Update the task
        await this.updateTask(taskId, {
            assignedTo: toUserId,
            transferredFrom: fromUserId,
            transferReason: reason,
            transferredAt: Timestamp.now(),
            status: 'transferred'
        } as any);

        // Log the transfer
        await this.logActivity({
            entityType: 'task',
            entityId: taskId,
            userId: fromUserId,
            action: 'transfer',
            details: {
                toUserId,
                reason
            }
        });
    },

    // --- Generic Helper Functions ---

    /**
     * Add a document to any collection
     */
    async addDocument(collectionName: string, data: Record<string, unknown>): Promise<string> {
        const docRef = await addDoc(collection(db, collectionName), {
            ...data,
            createdAt: data.createdAt || Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    },

    /**
     * Get documents from any collection with optional filters
     */
    async getDocuments<T = Record<string, unknown>>(
        collectionName: string,
        filters?: Array<{ field: string; operator: WhereFilterOp; value: unknown }>
    ): Promise<(T & { id: string })[]> {
        const collectionRef = collection(db, collectionName);

        if (filters && filters.length > 0) {
            const constraints = filters.map(f => where(f.field, f.operator, f.value));
            const q = query(collectionRef, ...constraints);
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as T & { id: string }));
        }

        const querySnapshot = await getDocs(collectionRef);
        return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as T & { id: string }));
    },

    /**
     * Update a document in any collection
     */
    async updateDocument(collectionName: string, docId: string, data: Record<string, unknown>): Promise<void> {
        const docRef = doc(db, collectionName, docId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    /**
     * Delete a document from any collection
     */
    async deleteDocument(collectionName: string, docId: string): Promise<void> {
        const docRef = doc(db, collectionName, docId);
        await deleteDoc(docRef);
    },

    /**
     * Get a single document from any collection
     */
    async getDocument<T = Record<string, unknown>>(collectionName: string, docId: string): Promise<(T & { id: string }) | null> {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as T & { id: string };
        }
        return null;
    },

    // --- Collaborations ---
    
    async getCollaborations(): Promise<Collaboration[]> {
        const querySnapshot = await getDocs(collection(db, "collaborations"));
        return querySnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                contractSentAt: data.contractSentAt?.toDate ? data.contractSentAt.toDate() : data.contractSentAt ? new Date(data.contractSentAt) : undefined,
            } as Collaboration;
        });
    },

    async createCollaboration(data: Omit<Collaboration, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, "collaborations"), {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateCollaboration(id: string, data: Partial<Collaboration>): Promise<void> {
        const docRef = doc(db, "collaborations", id);
        const updateData: Record<string, unknown> = {
            ...data,
            updatedAt: Timestamp.now()
        };
        // Convert Date to Timestamp if needed
        if (data.contractSentAt instanceof Date) {
            updateData.contractSentAt = Timestamp.fromDate(data.contractSentAt);
        }
        await updateDoc(docRef, updateData);
    },

    async deleteCollaboration(id: string): Promise<void> {
        await deleteDoc(doc(db, "collaborations", id));
    },

    // ============================================
    // REMINDERS
    // ============================================

    async addReminder(data: {
        userId: string;
        title: string;
        description?: string;
        itemId?: string;
        itemType?: 'focus' | 'task' | 'lead' | 'client';
        reminderTime: Date;
        status?: 'pending' | 'sent' | 'dismissed';
    }): Promise<string> {
        const docRef = await addDoc(collection(db, "reminders"), {
            ...data,
            reminderTime: Timestamp.fromDate(data.reminderTime),
            status: data.status || 'pending',
            createdAt: Timestamp.now(),
        });
        return docRef.id;
    },

    async getReminders(userId: string): Promise<Array<{
        id: string;
        userId: string;
        title: string;
        description?: string;
        itemId?: string;
        itemType?: string;
        reminderTime: Date;
        status: string;
        createdAt: Date;
    }>> {
        const q = query(
            collection(db, "reminders"),
            where("userId", "==", userId),
            where("status", "==", "pending"),
            orderBy("reminderTime", "asc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                userId: data.userId,
                title: data.title,
                description: data.description,
                itemId: data.itemId,
                itemType: data.itemType,
                reminderTime: data.reminderTime?.toDate() || new Date(),
                status: data.status,
                createdAt: data.createdAt?.toDate() || new Date(),
            };
        });
    },

    async getPendingReminders(): Promise<Array<{
        id: string;
        userId: string;
        title: string;
        description?: string;
        reminderTime: Date;
        status: string;
    }>> {
        const now = new Date();
        const q = query(
            collection(db, "reminders"),
            where("status", "==", "pending"),
            where("reminderTime", "<=", Timestamp.fromDate(now))
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                userId: data.userId,
                title: data.title,
                description: data.description,
                reminderTime: data.reminderTime?.toDate() || new Date(),
                status: data.status,
            };
        });
    },

    async updateReminderStatus(id: string, status: 'sent' | 'dismissed'): Promise<void> {
        await updateDoc(doc(db, "reminders", id), {
            status,
            updatedAt: Timestamp.now(),
        });
    },

    async deleteReminder(id: string): Promise<void> {
        await deleteDoc(doc(db, "reminders", id));
    },

    // ============================================
    // MESSAGES CRUD
    // ============================================

    async getMessages(clientId?: string): Promise<Array<{
        id: string;
        clientId: string;
        text: string;
        sender: 'me' | 'client';
        channel: 'whatsapp' | 'sms' | 'email';
        status: 'sent' | 'delivered' | 'read';
        createdAt: Date;
    }>> {
        let q;
        if (clientId) {
            q = query(
                collection(db, "messages"),
                where("clientId", "==", clientId),
                orderBy("createdAt", "asc")
            );
        } else {
            q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                clientId: data.clientId,
                text: data.text,
                sender: data.sender,
                channel: data.channel,
                status: data.status,
                createdAt: data.createdAt?.toDate() || new Date(),
            };
        });
    },

    async addMessage(data: {
        clientId: string;
        text: string;
        sender: 'me' | 'client';
        channel: 'whatsapp' | 'sms' | 'email';
        status?: 'sent' | 'delivered' | 'read';
    }): Promise<string> {
        const docRef = await addDoc(collection(db, "messages"), {
            ...data,
            status: data.status || 'sent',
            createdAt: Timestamp.now(),
        });
        return docRef.id;
    },

    async updateMessageStatus(id: string, status: 'sent' | 'delivered' | 'read'): Promise<void> {
        await updateDoc(doc(db, "messages", id), {
            status,
            updatedAt: Timestamp.now(),
        });
    },

    async deleteMessage(id: string): Promise<void> {
        await deleteDoc(doc(db, "messages", id));
    },

    async getLastMessagePerClient(): Promise<Map<string, {
        text: string;
        time: Date;
        channel: string;
        unreadCount: number;
    }>> {
        const messages = await getDocs(query(
            collection(db, "messages"),
            orderBy("createdAt", "desc")
        ));
        
        const lastMessages = new Map();
        const unreadCounts = new Map<string, number>();
        
        messages.docs.forEach(doc => {
            const data = doc.data();
            const clientId = data.clientId;
            
            // Count unread messages
            if (data.sender === 'client' && data.status !== 'read') {
                unreadCounts.set(clientId, (unreadCounts.get(clientId) || 0) + 1);
            }
            
            // Track last message
            if (!lastMessages.has(clientId)) {
                lastMessages.set(clientId, {
                    text: data.text,
                    time: data.createdAt?.toDate() || new Date(),
                    channel: data.channel,
                    unreadCount: 0
                });
            }
        });
        
        // Merge unread counts
        lastMessages.forEach((value, key) => {
            value.unreadCount = unreadCounts.get(key) || 0;
        });
        
        return lastMessages;
    },

    // ============================================
    // CAMPAIGNS CRUD
    // ============================================

    async getCampaigns(): Promise<Array<{
        id: string;
        company: string;
        productType: string;
        discountPercent: number;
        startDate: Date;
        endDate: Date;
        minPremium: number;
        target: number;
        current: number;
        createdAt: Date;
    }>> {
        const snapshot = await getDocs(collection(db, "campaigns"));
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                company: data.company,
                productType: data.productType,
                discountPercent: data.discountPercent,
                startDate: data.startDate?.toDate() || new Date(),
                endDate: data.endDate?.toDate() || new Date(),
                minPremium: data.minPremium,
                target: data.target,
                current: data.current || 0,
                createdAt: data.createdAt?.toDate() || new Date(),
            };
        });
    },

    async addCampaign(data: {
        company: string;
        productType: string;
        discountPercent: number;
        startDate: Date;
        endDate: Date;
        minPremium: number;
        target: number;
    }): Promise<string> {
        const docRef = await addDoc(collection(db, "campaigns"), {
            ...data,
            startDate: Timestamp.fromDate(data.startDate),
            endDate: Timestamp.fromDate(data.endDate),
            current: 0,
            createdAt: Timestamp.now(),
        });
        return docRef.id;
    },

    async updateCampaign(id: string, data: Partial<{
        company: string;
        productType: string;
        discountPercent: number;
        startDate: Date;
        endDate: Date;
        minPremium: number;
        target: number;
        current: number;
    }>): Promise<void> {
        const updateData: Record<string, unknown> = { ...data, updatedAt: Timestamp.now() };
        if (data.startDate) updateData.startDate = Timestamp.fromDate(data.startDate);
        if (data.endDate) updateData.endDate = Timestamp.fromDate(data.endDate);
        await updateDoc(doc(db, "campaigns", id), updateData);
    },

    async deleteCampaign(id: string): Promise<void> {
        await deleteDoc(doc(db, "campaigns", id));
    },
};