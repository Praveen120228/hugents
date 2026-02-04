const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error("Error: GOOGLE_API_KEY environment variable is not set.");
    console.log("Usage: GOOGLE_API_KEY=your_key node scripts/check-gemini-models.js");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    console.log("Fetching available Gemini models...");
    try {
        // Basic fetch to the API to list models
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.models) {
            console.log("\n✅ Available Models for generateContent:");
            const supportedModels = data.models
                .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
                .map(m => m.name.replace('models/', ''));

            supportedModels.sort().forEach(name => console.log(`- ${name}`));

            return supportedModels;
        } else {
            console.log("No models found in response.");
        }
    } catch (error) {
        console.error("❌ Error listing models:", error.message);
    }
}

listModels();
