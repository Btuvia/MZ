import { generateGeminiContent } from "@/lib/gemini-client";
import { generateWithGemini } from "@/app/actions/gemini";

export interface Policy {
    id: string;
    company: string;
    type: string;
    premium: number;
    endDate: string;
}

export interface ClientProfile {
    name: string;
    idNumber: string;
    address: string;
    birthDate: string;
    email?: string;
    phone?: string;
}

export interface AnalysisResult {
    client: ClientProfile;
    policies: Policy[];
    insights: string[];
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

export const analyzeDocument = async (file: File): Promise<AnalysisResult> => {
    const base64 = await fileToBase64(file);
    const mimeType = file.type;

    const basePrompt = `
    Analyze the attached insurance document (likely "Har HaBituach" report or a policy summary).
    Extract the following information and return it in STRICT JSON format:
    1. Client Details: Name, ID Number, Address, Birth Date, Phone Number, Email.
    2. Policies: List of policies found. For each policy include: Company Name, Product/Insurance Type, Monthly Premium (number), End Date (DD/MM/YYYY).
    3. Insights: 3 short professional insights or recommendations based on the data (e.g., missing coverages, expensive premiums, duplicate policies).

    Return ONLY the JSON with this structure:
    {
        "client": { 
            "name": "...", 
            "idNumber": "...", 
            "address": "...", 
            "birthDate": "...",
            "phone": "...",
            "email": "..."
        },
        "policies": [ { "id": "generated_unique_id", "company": "...", "type": "...", "premium": 100, "endDate": "..." } ],
        "insights": ["...", "...", "..."]
    }
    
    If accurate data is missing, make a reasonable estimate or leave empty string. For premium use plain number.
    Do not add markdown formatting like \`\`\`json. Just the raw JSON string.
    `;

    const response = await generateWithGemini(basePrompt, { base64, mimeType });

    if (response.error) {
        throw new Error(response.error);
    }

    try {
        // Clean up any markdown code blocks if the model adds them despite instructions
        const cleanText = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(cleanText);
        return data as AnalysisResult;
    } catch (e) {
        console.error("Failed to parse Gemini response", response.text);
        throw new Error("Failed to parse analysis results");
    }
};
