import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY is not set');
        process.exit(1);
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        console.log('  🔍 Listing models available for this key...');
        // Note: The SDK does not have a direct listModels call in this way,
        // but it often provides information when it fails.
        // Actually, we can use a direct fetch to the Google API endpoint.

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.error('  ❌ API Error:', data.error);
        } else {
            console.log('  ✅ Connection OK. Found models:', data.models ? data.models.length : 0);
            if (data.models) {
                data.models.forEach(m => console.log('     -', m.name));
            }
        }
    } catch (e) {
        console.error('  ❌ Failure:', e.message);
    }
}

listModels();
