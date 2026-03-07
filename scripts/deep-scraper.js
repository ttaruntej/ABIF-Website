/**
 * ABIF Deep Scraper — Comprehensive Funding IQ Agent
 * 
 * DESIGN PRINCIPLE:
 * Unlike the standard scraper which is optimized for speed, the Deep Scraper 
 * is optimized for accuracy and discovery. It runs overnight, takes its time,
 * uses AI to find and validate content, and crawls deeper into portals.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

puppeteer.use(StealthPlugin());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../public/data/opportunities.json');

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const MODEL_NAME = "gemini-1.5-flash"; // Reverted for sanity check

// --- CORE UTILS ---

async function randomDelay(min = 3000, max = 7000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(res => setTimeout(res, delay));
}

/**
 * Vector-lite Similarity Score (v2.1)
 * Uses a simpler Jaccard-style intersection for high speed.
 */
function getSimilarityScore(str1, str2) {
    const s1 = new Set(str1.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    const s2 = new Set(str2.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    if (s1.size === 0 || s2.size === 0) return 0;

    const intersection = new Set([...s1].filter(x => s2.has(x)));
    const union = new Set([...s1, ...s2]);
    return intersection.size / union.size;
}

/**
 * Intelligent AI Discovery (v2.1 - Pro Mode)
 */
async function aiDetectOpportunities(page) {
    if (!genAI) return [];

    try {
        const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 50000));
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
        });
        const prompt = `You are the ABIF Funding Intelligence Agent. Analyze the webpage text and extract all ACTIVE funding opportunities, grants, or schemes for Indian Startups or Incubators.
        
        Text: ${bodyText}
        
        Return a JSON array of objects with these keys: 
        - name: Full name of the scheme
        - body: Providing organization
        - deadline: Deadline if mentioned (else "Rolling")
        - maxAward: Funding amount if mentioned
        - description: Brief 1-sentence summary
        - targetAudience: Array including 'startup' or 'incubator'
        - category: One of 'national', 'international', 'state', or 'csr'
        - detailUrl: If the text contains a specific link/URL for more details on this scheme, include it.
        
        Return an empty array [] if no active grants are found. Only return JSON.`;

        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        return JSON.parse(text);
    } catch (e) {
        console.error('    ❌ AI Detection failed:', e.message);
        return [];
    }
}

/**
 * AI Batch Deduplication (v2.1)
 * Sends all candidates in ONE call to save tokens and quota.
 */
async function aiBatchDeduplicate(candidates, existingMandates) {
    if (!genAI || candidates.length === 0) return candidates;

    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const existingSummary = existingMandates.map(m => m.name).slice(-50); // Most recent 50

        const prompt = `You are a data deduplication expert. Compare the "New Candidates" list against the "Existing Mandates" list. 
        Determine which of the New Candidates are ALREADY present in the existing list (even if the naming is slightly different, e.g., "SIFS" vs "Startup India Seed Fund").
        
        New Candidates: ${JSON.stringify(candidates.map(c => c.name))}
        Existing Mandates: ${JSON.stringify(existingSummary)}
        
        Return a JSON object where keys are the Candidate Names and values are BOOLEAN (true if it's a duplicate, false if it is NEW).
        Only return the JSON object.`;

        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        const dupMap = JSON.parse(text);

        return candidates.filter(c => !dupMap[c.name]);
    } catch (e) {
        console.error('    ❌ Batch Deduplication failed:', e.message);
        return candidates; // Fallback: keep all to avoid missing data
    }
}

// --- TARGET SCRAPERS ---

async function deepScanBIRAC(browser) {
    console.log('🔍 Deep Scanning: BIRAC Portals...');
    const page = await browser.newPage();
    try {
        await page.goto('https://birac.nic.in/cfp.php', { waitUntil: 'domcontentloaded', timeout: 90000 });
        const html = await page.content();
        const $ = cheerio.load(html);
        const schemes = [];

        $('table#current tbody tr').each((i, el) => {
            const anchor = $(el).find('td:nth-child(2) a').first();
            const name = anchor.text().trim();
            const link = anchor.attr('href');
            if (name) {
                schemes.push({
                    name,
                    link: link ? (link.startsWith('http') ? link : `https://birac.nic.in/${link}`) : 'https://birac.nic.in/cfp.php',
                    body: 'BIRAC (DBT)',
                    status: 'Open',
                    targetAudience: ['startup'],
                    dataSource: 'scraper:deep:birac'
                });
            }
        });
        return schemes;
    } catch (e) {
        console.error('    ❌ BIRAC scan failed:', e.message);
        return [];
    } finally {
        await page.close();
    }
}

async function deepScanStartupIndia(browser) {
    console.log('🔍 Deep Scanning: Startup India Portals...');
    const page = await browser.newPage();
    try {
        const sites = [
            'https://seedfund.startupindia.gov.in/',
            'https://www.startupindia.gov.in/content/sih/en/reources.html'
        ];

        const allSchemes = [];
        for (const site of sites) {
            console.log(`    🌐 Crawling: ${site}`);
            await page.goto(site, { waitUntil: 'networkidle2', timeout: 90000 });
            const aiFound = await aiDetectOpportunities(page);
            aiFound.forEach(s => {
                s.link = site;
                s.dataSource = 'scraper:deep:ai';
            });
            allSchemes.push(...aiFound);



            await randomDelay();
        }
        return allSchemes;
    } catch (e) {
        console.error('    ❌ Startup India scan failed:', e.message);
        return [];
    } finally {
        await page.close();
    }
}

// --- MAIN ---

async function main() {
    console.log('\n🚀 Starting ABIF Deep Intelligence Scan (v2.1 - Efficiency Mode)...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const [birac, startupIndia] = await Promise.all([
            deepScanBIRAC(browser),
            deepScanStartupIndia(browser)
        ]);

        const rawResults = [...birac, ...startupIndia];
        console.log(`\n✅ Deep Scan complete. Found ${rawResults.length} raw candidates.`);

        if (fs.existsSync(DATA_FILE)) {
            const existingData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            const existingNames = existingData.map(d => d.name);
            const mergedData = [...existingData];

            // --- STEP 1: VECTOR-LITE PRE-PASS ---
            console.log('⚡ Running Vector-lite Pre-pass (Similarity Check)...');


            const uniqueCandidates = [];
            for (const item of rawResults) {
                // Exact match check (case-insensitive)
                const isExactDup = existingNames.some(ext => ext.toLowerCase() === item.name.toLowerCase());
                if (isExactDup) {
                    console.log(`   ⏩ Exact Skip: "${item.name}"`);
                    continue;
                }

                // Similarity check (85% threshold for automated skip)
                let maxSim = 0;
                let bestMatch = '';
                for (const ext of existingNames) {
                    const sim = getSimilarityScore(item.name, ext);
                    if (sim > maxSim) {
                        maxSim = sim;
                        bestMatch = ext;
                    }
                }

                if (maxSim > 0.85) {
                    console.log(`   ⏩ Vector Skip: "${item.name}" (High similarity ${Math.round(maxSim * 100)}% with "${bestMatch}")`);
                    continue;
                }


                uniqueCandidates.push(item);
            }

            // --- STEP 2: BATCH INTELLIGENCE ---
            if (uniqueCandidates.length > 0) {
                console.log(`🧠 Running AI Batch Deduplication on ${uniqueCandidates.length} potential mandates...`);
                const finalDiscoveries = await aiBatchDeduplicate(uniqueCandidates, existingData);

                // --- STEP 3: FINAL MERGE ---
                for (const item of finalDiscoveries) {
                    console.log(`   ✨ New Discovery Added: "${item.name}"`);
                    mergedData.push({
                        ...item,
                        category: item.category || 'national',
                        lastScanned: new Date().toISOString(),
                        dataSource: item.dataSource || 'scraper:deep:batch'
                    });
                }
            } else {
                console.log('    ℹ️ No new candidates passed the similarity pre-filter.');
            }

            fs.writeFileSync(DATA_FILE, JSON.stringify(mergedData, null, 4));
            console.log(`\n📁 Data synchronized. Total opportunities: ${mergedData.length}`);
        } else {
            fs.writeFileSync(DATA_FILE, JSON.stringify(rawResults, null, 4));
        }

    } catch (e) {
        console.error('❌ Deep Scraper Failed:', e);
    } finally {
        await browser.close();
        console.log('👋 Scan agent deactivated.');
    }
}

main();
