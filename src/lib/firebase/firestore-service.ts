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

    async getTasks() {
        const querySnapshot = await getDocs(collection(db, "tasks"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async getTasksForClient(clientId: string) {
        if (!clientId) return [];
        const q = query(collection(db, "tasks"), where("clientId", "==", clientId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async getTasksByAssignee(assigneeName: string) {
        if (!assigneeName) return [];
        const q = query(collection(db, "tasks"), where("assignee", "==", assigneeName));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

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
};
