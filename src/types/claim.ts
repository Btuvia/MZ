export interface ClaimDocument {
    id: string;
    name: string;
    url?: string;
    isVisibleToClient: boolean;
    uploadedAt: string;
}

export type ClaimStatus = 'draft' | 'submitted' | 'processing' | 'approved' | 'rejected' | 'paid';

export interface ClaimTimelineStep {
    label: string;
    date: string;
    completed: boolean;
}

export interface Claim {
    id: string;
    clientId: string;
    clientName: string;
    type: string;
    policyName: string;
    policyNumber: string;
    date: string;
    status: ClaimStatus;
    amount?: number;
    description: string;
    documents: ClaimDocument[];
    timeline: ClaimTimelineStep[];
    missingDocuments: string[]; // List of required documents that the client still needs to provide
    workflowStatus?: 'waiting_for_agent' | 'waiting_for_ops';
}
