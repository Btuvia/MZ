
import { generateGeminiContent } from "@/lib/gemini-client";

export interface ExtractedPolicy {
    id?: string;
    company: string;
    type: string;
    premium: number;
    expirationDate: string; // YYYY-MM-DD
}

export interface AnalysisResult {
    clientName: string;
    policies: ExtractedPolicy[];
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = result.split(",")[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
};

export const analyzeInsuranceDocument = async (file: File, apiKey: string): Promise<AnalysisResult | null> => {
    try {
        const base64 = await fileToBase64(file);

        const prompt = `
        Analyze this insurance document (Hebrew).
        Extract the following details:
        1. Client Name (Hebrew)
        2. A list of all insurance policies found. For each policy extract:
           - Company Name (Hebrew)
           - Policy Type (Short Hebrew description, e.g., "רכב", "דירה", "בריאות")
           - Annual Premium (Number only, estimate if needed)
           - Expiration Date (Format: YYYY-MM-DD). If not found, estimate 1 year from start date.

        Return STRICT JSON format only, no markdown formatting:
        {
            "clientName": "...",
            "policies": [
                { "company": "...", "type": "...", "premium": 0, "expirationDate": "YYYY-MM-DD" },
                ...
            ]
        }
        `;

        const response = await generateGeminiContent(prompt, apiKey, {
            base64,
            mimeType: file.type
        });

        if (response.error) {
            console.error("AI Analysis Error:", response.error);
            throw new Error(response.error);
        }

        // Clean any markdown backticks if Gemini adds them
        const cleanedText = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data: AnalysisResult = JSON.parse(cleanedText);

        // Add IDs to policies
        data.policies = data.policies.map((p, index) => ({
            ...p,
            id: `policy-${Date.now()}-${index}`
        }));

        return data;

    } catch (error) {
        console.error("Failed to analyze document:", error);
        return null;
    }
};
