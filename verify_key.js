const apiKey = "AIzaSyBYUvxcYuf2gYK_RhcLdU3ZKguJ8_IEEUo";

async function test() {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Hello, just verify connection." }] }]
                })
            }
        );

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || response.statusText);
        }

        const data = await response.json();
        console.log("Success! Gemini responded:");
        console.log(data.candidates[0].content.parts[0].text);
    } catch (e) {
        console.error("Verification failed:", e.message);
    }
}

test();
