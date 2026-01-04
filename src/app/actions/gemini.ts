'use server';

import { createHash } from "node:crypto";
import { generateGeminiContent, type GeminiResponse } from "@/lib/gemini-client";

const API_KEY = process.env.GEMINI_API_KEY || "";

type CacheEntry = {
    value: GeminiResponse;
    expiresAt: number;
};

function envInt(name: string, fallback: number): number {
    const raw = process.env[name];
    if (!raw) return fallback;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

const CACHE_DISABLED = process.env.GEMINI_CACHE_DISABLED === "1" || process.env.GEMINI_CACHE_DISABLED === "true";
const CACHE_TTL_MS = Math.max(0, envInt("GEMINI_CACHE_TTL_MS", 10 * 60 * 1000)); // 10 minutes
const CACHE_MAX_ENTRIES = Math.max(0, envInt("GEMINI_CACHE_MAX_ENTRIES", 200));
const CACHE_PRUNE_TO = Math.max(0, envInt("GEMINI_CACHE_PRUNE_TO", 150));

function getCacheStore(): Map<string, CacheEntry> {
    const anyGlobal = globalThis as unknown as { __geminiCache?: Map<string, CacheEntry> };
    if (!anyGlobal.__geminiCache) {
        anyGlobal.__geminiCache = new Map<string, CacheEntry>();
    }
    return anyGlobal.__geminiCache;
}

function makeCacheKey(params: { prompt: string; model: string; fileData?: GeminiFileData }): string {
    const h = createHash("sha256");
    h.update(params.model);
    h.update("\n");
    h.update(params.prompt);
    if (params.fileData) {
        h.update("\n");
        h.update(params.fileData.mimeType);
        h.update("\n");
        // Hash the content rather than using it directly as a key.
        h.update(params.fileData.base64);
    }
    return h.digest("hex");
}

function getCached(key: string): GeminiResponse | null {
    if (CACHE_DISABLED || CACHE_TTL_MS === 0) return null;
    const store = getCacheStore();
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() >= entry.expiresAt) {
        store.delete(key);
        return null;
    }
    return entry.value;
}

function setCached(key: string, value: GeminiResponse): void {
    if (CACHE_DISABLED || CACHE_TTL_MS === 0) return;
    // Do not cache errors; they tend to be transient and can hide misconfiguration fixes.
    if (value.error) return;
    const store = getCacheStore();
    store.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });

    // Simple best-effort pruning to avoid unbounded growth.
    if (CACHE_MAX_ENTRIES > 0 && store.size > CACHE_MAX_ENTRIES) {
        const now = Date.now();
        for (const [k, v] of store) {
            if (v.expiresAt <= now) store.delete(k);
            if (store.size <= CACHE_PRUNE_TO) break;
        }
    }
}

export type GeminiFileData = { base64: string; mimeType: string };

export async function getGeminiStatus() {
    return { configured: Boolean(API_KEY) };
}

export async function generateWithGemini(
    prompt: string,
    fileData?: GeminiFileData,
    model?: string
): Promise<GeminiResponse> {
    if (!API_KEY) {
        return { text: "", error: "נא להגדיר GEMINI_API_KEY בקובץ .env.local" };
    }

    const chosenModel = model || "gemini-2.0-flash";
    const key = makeCacheKey({ prompt, model: chosenModel, fileData });
    const cached = getCached(key);
    if (cached) return cached;

    const result = await generateGeminiContent(prompt, API_KEY, fileData, chosenModel);
    setCached(key, result);
    return result;
}

export async function generateLeadsInsights(leads: Array<Record<string, unknown>>) {
    if (!API_KEY) {
        return { text: "", error: "נא להגדיר GEMINI_API_KEY בקובץ .env.local" };
    }

    const prompt = `
    Analyze the following leads and suggest 3 prioritized actions for an insurance agent to close deals.
    Focus on leads with high scores or those who haven't been contacted recently.
    
    Leads Data:
    ${JSON.stringify(leads.map(l => ({ name: l.name, status: l.status, score: l.score, lastContact: l.lastContact, notes: l.notes })))}
    
    Output format: a short paragraph in Hebrew describing the recommended actions.
    `;

    return await generateGeminiContent(prompt, API_KEY);
}

export async function generateSalesTips(deals: Array<Record<string, unknown>>) {
    if (!API_KEY) {
        return { text: "", error: "נא להגדיר GEMINI_API_KEY בקובץ .env.local" };
    }

    const prompt = `
    Analyze the following sales pipeline and provide 3 specific tips to increase conversion or speed up closing.
    Focus on deals in 'negotiation' or 'proposal' stages that have high value.
    
    Deals Data:
    ${JSON.stringify(deals.map(d => ({ client: d.client, stage: d.stage, value: d.value, probability: d.probability })))}
    
    Output format: a short paragraph in Hebrew with bullet points for the tips.
    `;

    return await generateGeminiContent(prompt, API_KEY);
}
