
import { z } from "zod";
import { validateIsraeliID } from "./israeli-id";

export const TaskSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3, "Title too short"),
    description: z.string().optional(),
    dueDate: z.any().optional(), // Can be Firestore Timestamp or string
    priority: z.enum(["low", "medium", "high", "urgent"]),
    status: z.enum(["new", "in_progress", "completed", "pending"]),
    assignedTo: z.string().optional(),
    clientName: z.string().optional(),
    createdAt: z.any().optional(),
});

export const LeadSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, "Name too short"),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    idNumber: z.string().refine((val) => !val || validateIsraeliID(val), {
        message: "Invalid Israeli ID number",
    }).optional(),
    source: z.string().default("General"),
    score: z.number().min(0).max(100).default(50),
    status: z.string().default("new"),
    createdAt: z.any().optional(),
});

export const ClientSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, "Name too short"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(9, "Phone number too short"),
    nationalId: z.string().refine(validateIsraeliID, {
        message: "Invalid Israeli ID number",
    }),
    birthDate: z.string().optional(),
    address: z.object({
        city: z.string(),
        street: z.string(),
        num: z.string(),
    }).optional(),
    status: z.string().default("active"),
    salesStatus: z.string().optional(),
    operationsStatus: z.string().optional(),
    createdAt: z.any().optional(),
});

export const AgencySchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, "Agency name too short"),
    seatCount: z.number().int().positive("Seat count must be positive"),
    status: z.enum(["active", "pending", "suspended"]).default("pending"),
    contactEmail: z.string().email().optional(),
});

export type TaskInput = z.infer<typeof TaskSchema>;
export type LeadInput = z.infer<typeof LeadSchema>;
export type ClientInput = z.infer<typeof ClientSchema>;
export type AgencyInput = z.infer<typeof AgencySchema>;
