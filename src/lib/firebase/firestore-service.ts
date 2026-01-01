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
    Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

const CLIENTS_COLLECTION = "clients";
const USERS_COLLECTION = "users";

export const firestoreService = {
    // --- Users ---
    async getUsers() {
        const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // --- Clients ---

    async getClients() {
        const querySnapshot = await getDocs(collection(db, CLIENTS_COLLECTION));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

    async addClient(data: any) {
        const docRef = await addDoc(collection(db, CLIENTS_COLLECTION), {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateClient(id: string, data: any) {
        const docRef = doc(db, CLIENTS_COLLECTION, id);
        await updateDoc(docRef, {
            ...data,
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

    async getTasksForClient(clientId: string) {
        if (!clientId) return [];
        const q = query(collection(db, "tasks"), where("clientId", "==", clientId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    },

    async getTasksByAssignee(assigneeName: string) {
        if (!assigneeName) return [];
        const q = query(collection(db, "tasks"), where("assignee", "==", assigneeName));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    },

    // ... (other methods should be updated similarly if possible, but I'll focus on the ones causing errors first)



    async addTask(data: any) {
        // Remove id if present, let firestore generate it
        const { id, ...taskData } = data;
        const docRef = await addDoc(collection(db, "tasks"), {
            ...taskData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateTask(id: string, data: any) {
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

    async getLeads() {
        const querySnapshot = await getDocs(collection(db, "leads"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addLead(data: any) {
        const { id, ...leadData } = data;
        const docRef = await addDoc(collection(db, "leads"), {
            ...leadData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateLead(id: string, data: any) {
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

    async getDeals() {
        const querySnapshot = await getDocs(collection(db, "deals"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async addDeal(data: any) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...dealData } = data;
        const docRef = await addDoc(collection(db, "deals"), {
            ...dealData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateDeal(id: string, data: any) {
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
    async addContactRequest(data: any) {
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

    async addFinancialProduct(data: any) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...productData } = data;
        const docRef = await addDoc(collection(db, "financial_products"), {
            ...productData,
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

    async addLeadStatus(data: any) {
        const { id, ...statusData } = data;
        const docRef = await addDoc(collection(db, "lead_statuses"), {
            ...statusData,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateLeadStatus(id: string, data: any) {
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

    async addTaskStatus(data: any) {
        const { id, ...statusData } = data;
        const docRef = await addDoc(collection(db, "task_statuses"), {
            ...statusData,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateTaskStatus(id: string, data: any) {
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

    async addLeadSource(data: any) {
        const { id, ...sourceData } = data;
        const docRef = await addDoc(collection(db, "lead_sources"), {
            ...sourceData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateLeadSource(id: string, data: any) {
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

    async transferLead(data: any) {
        const { id, ...transferData } = data;
        const docRef = await addDoc(collection(db, "lead_transfers"), {
            ...transferData,
            status: 'pending',
            transferredAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateLeadTransfer(id: string, data: any) {
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

    async transferTask(data: any) {
        const { id, ...transferData } = data;
        const docRef = await addDoc(collection(db, "task_transfers"), {
            ...transferData,
            status: 'pending',
            transferredAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateTaskTransfer(id: string, data: any) {
        const docRef = doc(db, "task_transfers", id);
        await updateDoc(docRef, {
            ...data,
            respondedAt: Timestamp.now()
        });
    },

    // --- Activity Log ---
    async logActivity(data: any) {
        const { id, ...activityData } = data;
        const docRef = await addDoc(collection(db, "activity_log"), {
            ...activityData,
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

    async getWorkflows() {
        const querySnapshot = await getDocs(collection(db, "workflows"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
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

    async createWorkflow(data: any) {
        const { id, ...workflowData } = data;
        const docRef = await addDoc(collection(db, "workflows"), {
            ...workflowData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateWorkflow(id: string, data: any) {
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

    async startWorkflow(workflowId: string, clientId: string, startedBy: string, additionalData?: any) {
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

    async updateWorkflowInstance(id: string, data: any) {
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

    async getSubjects() {
        const querySnapshot = await getDocs(collection(db, "task_subjects"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async getSubject(id: string) {
        if (!id) return null;
        const docRef = doc(db, "task_subjects", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    },

    async createSubject(data: any) {
        const { id, ...subjectData } = data;
        const docRef = await addDoc(collection(db, "task_subjects"), {
            ...subjectData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateSubject(id: string, data: any) {
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

    async getUserPreferences(userId: string) {
        if (!userId) return null;
        const docRef = doc(db, "user_preferences", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    },

    async updateUserPreferences(userId: string, prefs: any) {
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
        });

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
    async getDocuments(
        collectionName: string,
        filters?: Array<{ field: string; operator: any; value: any }>
    ): Promise<any[]> {
        let q = collection(db, collectionName);

        if (filters && filters.length > 0) {
            const constraints = filters.map(f => where(f.field, f.operator, f.value));
            q = query(q as any, ...constraints) as any;
        }

        const querySnapshot = await getDocs(q as any);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    },

    /**
     * Update a document in any collection
     */
    async updateDocument(collectionName: string, docId: string, data: any): Promise<void> {
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
    async getDocument(collectionName: string, docId: string): Promise<any | null> {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    },

    // --- Collaborations ---
    
    async getCollaborations(): Promise<any[]> {
        const querySnapshot = await getDocs(collection(db, "collaborations"));
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                contractSentAt: data.contractSentAt?.toDate ? data.contractSentAt.toDate() : data.contractSentAt ? new Date(data.contractSentAt) : undefined,
            };
        });
    },

    async createCollaboration(data: any): Promise<string> {
        const docRef = await addDoc(collection(db, "collaborations"), {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    },

    async updateCollaboration(id: string, data: any): Promise<void> {
        const docRef = doc(db, "collaborations", id);
        const updateData: any = {
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
};

