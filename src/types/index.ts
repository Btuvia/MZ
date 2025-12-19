export type UserRole = 'admin' | 'agent' | 'client';

export type SalesStatus =
    | 'new_lead'
    | 'contacted'
    | 'meeting_scheduled'
    | 'proposal_sent'
    | 'negotiation'
    | 'closed_won'
    | 'closed_lost';

export type OperationsStatus =
    | 'sent_to_company'
    | 'needs_signatures'
    | 'needs_medical_info'
    | 'pending_approval'
    | 'policy_issued'
    | 'policy_rejected'
    | 'clearing_ordered';

export type ClientStatus = 'lead' | 'prospect' | 'active' | 'inactive' | 'churned';

export type PolicyType =
    | 'Pension'
    | 'Health'
    | 'Life'
    | 'Savings'
    | 'Car'
    | 'Home'
    | 'Disability'
    | 'Investment'
    | 'Business';

export interface Policy {
    id: string;
    type: PolicyType;
    company: string;
    premium: number;
    balance?: number;
    startDate: string;
    renewalDate: string;
    status: string;
    policyNumber: string;
    commissionRate?: number;
    coverAmount?: number;
    employerContribution?: number;
    employeeContribution?: number;
}

export interface FamilyConnection {
    clientId: string;
    relation: string;
    name: string;
}

export interface ClientDocument {
    id: string;
    name: string;
    url: string;
    type: string;
    uploadDate: string;
    status: 'pending' | 'verified' | 'rejected';
}

export interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    nationalId: string;
    address?: string;
    birthDate?: string;
    status: ClientStatus;
    salesStatus: SalesStatus;
    operationsStatus: OperationsStatus;
    pipelineStage?: string;
    dealValue?: number;
    churnProbability?: number;
    source?: string;
    campaign?: string;
    occupation?: string;
    familyStatus?: string;
    childrenCount?: number;
    familyConnections: FamilyConnection[];
    policies: Policy[];
    documents: ClientDocument[];
    communications: any[]; // To be defined
    tasks: any[]; // To be defined
    notes: string[];
    tags: string[];
    aiRecommendations: string[];
    dataQualityScore: number;
}

export interface Employee {
    id: string;
    name: string;
    email: string;
    phone: string;
    position: string;
    avatarUrl?: string;
    activeClientsCount: number;
    monthlySales: number;
    xp: number;
    level: number;
    badges: string[];
}

export interface Partner {
    id: string;
    name: string;
    type: string;
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    referralCode: string;
    totalReferrals: number;
    successfulPolicies: number;
    activeDeals: number;
    commissionEarned: number;
    commissionPremiums: number;
}
