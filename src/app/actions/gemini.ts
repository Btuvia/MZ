'use server';

import { generateGeminiContent } from "@/lib/gemini-client";

const API_KEY = process.env.GEMINI_API_KEY || "";

export async function generateLeadsInsights(leads: any[]) {
    if (!API_KEY) {
        return { text: "נא להגדיר מפתח API של Gemini בהגדרות המערכת." };
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

export async function generateSalesTips(deals: any[]) {
    if (!API_KEY) {
        return { text: "נא להגדיר מפתח API של Gemini בהגדרות המערכת." };
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
