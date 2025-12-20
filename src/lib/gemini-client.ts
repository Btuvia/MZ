export interface GeminiResponse {
    text: string;
    error?: string;
}

export const generateGeminiContent = async (
    prompt: string,
    apiKey: string,
    fileData?: { base64: string; mimeType: string },
    model: string = "gemini-1.5-flash"
): Promise<GeminiResponse> => {
    if (!apiKey) {
        return { text: "", error: "Missing API Key. Please configure it in Agency Settings." };
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt },
                                ...(fileData ? [{
                                    inline_data: {
                                        mime_type: fileData.mimeType,
                                        data: fileData.base64
                                    }
                                }] : [])
                            ]
                        }
                    ]
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            return { text: "", error: errorData.error?.message || "Failed to fetch from Gemini API" };
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

        return { text };
    } catch (error) {
        console.error("Gemini API Error:", error);
        return { text: "", error: "Network error or invalid API response." };
    }
};
