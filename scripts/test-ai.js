import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

async function testApiKey() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Testing API Key:', apiKey ? (apiKey.slice(0, 6) + '...') : 'MISSING');

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY is not set in .env');
        process.exit(1);
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        console.log('  ⏳ Sending test request to Gemini...');
        const result = await model.generateContent("Respond with exactly one word: 'READY'");
        const response = result.response.text().trim();

        console.log('  ✅ API Response Received:', response);
        if (response.includes('READY')) {
            console.log('  ✨ API KEY IS WORKING PERFECTLY.');
        } else {
            console.warn('  ⚠️ Received unexpected response, but connection worked.');
        }
    } catch (error) {
        console.error('  ❌ API KEY FAILED:');
        console.error('     Error Message:', error.message);
        if (error.message.includes('API_KEY_INVALID')) {
            console.error('     Reason: The API key is invalid.');
        } else if (error.message.includes('403')) {
            console.error('     Reason: Permission denied (check if the Generative Language API is enabled).');
        } else if (error.message.includes('429')) {
            console.error('     Reason: Quota exceeded.');
        }
    }
}

testApiKey();
