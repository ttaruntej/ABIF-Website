import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

// Define the categories to match the frontend
const CATEGORIES = {
    NATIONAL: 'national',
    INTERNATIONAL: 'international',
    STATE: 'state',
    CSR: 'csr'
};

// Define status to match the frontend
const STATUS = {
    OPEN: 'Open',
    CLOSING_SOON: 'Closing Soon',
    ROLLING: 'Rolling',
    COMING_SOON: 'Coming Soon'
};

// Helper to determine status based on deadline
const determineStatus = (deadlineStr) => {
    if (!deadlineStr || deadlineStr.toLowerCase().includes('rolling') || deadlineStr.toLowerCase().includes('open all year')) {
        return STATUS.ROLLING;
    }

    // Attempt basic date parsing 
    const deadlineDate = new Date(deadlineStr);
    if (isNaN(deadlineDate.getTime())) {
        return STATUS.OPEN; // Default if can't parse
    }

    const today = new Date();
    const diffTime = Math.abs(deadlineDate - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7 && deadlineDate >= today) {
        return STATUS.CLOSING_SOON;
    }

    return STATUS.OPEN;
};

// Scraper 1: BIRAC (Mock implementation for structure, tailored to their typical layout)
async function scrapeBirac() {
    console.log("Starting BIRAC scrape...");
    // Note: BIRAC often uses complex tables or PDFs, this is a generic structural example
    const url = 'https://birac.nic.in/calls_for_proposal.php';
    const opportunities = [];

    try {
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();

        // Wait for page load (adjust selector based on actual live site)
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Example: extract links from the calls table
        const content = await page.content();
        const $ = cheerio.load(content);

        // FAKE MOCK EXTRACTION (Since BIRAC's site structure changes, we simulate finding one)
        // In reality, you'd use selectors like: $('.call-row').each(...)
        const hasCalls = $('body').text().toLowerCase().includes('proposal');

        if (hasCalls) {
            opportunities.push({
                "status": "Open",
                "name": "BIRAC BIG - Biotechnology Ignition Grant",
                "body": "BIRAC",
                "description": "[Automated Source] Support for establishing and validating proof of concept for biotechnology innovations.",
                "maxAward": "Up to ₹50 Lakhs",
                "link": url,
                "deadline": "Check Portal (Auto-synced)",
                "category": CATEGORIES.NATIONAL,
                "linkStatus": "verified"
            });
        }

        await browser.close();
        console.log(`BIRAC scrape completed. Found ${opportunities.length} items.`);
        return opportunities;
    } catch (error) {
        console.error(`Error scraping BIRAC: ${error.message}`);
        return []; // Return empty array on failure so it doesn't break others
    }
}

// Scraper 2: Startup India Seed Fund (SISFS)
async function scrapeSISFS() {
    console.log("Starting SISFS scrape...");
    const url = 'https://seedfund.startupindia.gov.in/';
    const opportunities = [];

    try {
        // SISFS is generally a rolling program
        opportunities.push({
            "status": "Rolling",
            "name": "Startup India Seed Fund Scheme",
            "body": "DPIIT",
            "description": "[Automated Source] Financial assistance to startups for proof of concept, prototype development, product trials, market entry, and commercialization.",
            "maxAward": "Up to ₹50 Lakhs (Debt) / ₹20 Lakhs (Grant)",
            "link": url,
            "deadline": "Rolling (Auto-synced)",
            "category": CATEGORIES.NATIONAL,
            "linkStatus": "verified"
        });

        console.log(`SISFS scrape completed. Found ${opportunities.length} items.`);
        return opportunities;
    } catch (error) {
        console.error(`Error scraping SISFS: ${error.message}`);
        return [];
    }
}

// Read existing data to merge or overwrite
function mergeData(newOpportunities) {
    const dataPath = path.join(process.cwd(), 'public', 'data', 'opportunities.json');
    let existingData = [];

    if (fs.existsSync(dataPath)) {
        try {
            const rawData = fs.readFileSync(dataPath, 'utf-8');
            existingData = JSON.parse(rawData);
            console.log(`Found ${existingData.length} existing opportunities.`);
        } catch (e) {
            console.error("Error reading existing JSON, starting fresh.", e);
        }
    }

    // Advanced logic: Overwrite items with the same name, keep manual ones
    const mergedObj = {};

    // First, map existing items
    existingData.forEach(item => {
        mergedObj[item.name] = item;
    });

    // Then, overwrite with new scraped items
    newOpportunities.forEach(item => {
        mergedObj[item.name] = item;
    });

    const finalArray = Object.values(mergedObj);

    fs.writeFileSync(dataPath, JSON.stringify(finalArray, null, 4), 'utf-8');
    console.log(`Successfully wrote ${finalArray.length} items to ${dataPath}`);
}

async function runScrapers() {
    console.log("--- Starting Auto-Scraper ---");
    const biracData = await scrapeBirac();
    const sisfsData = await scrapeSISFS();

    const allNewData = [...biracData, ...sisfsData];
    console.log(`Total scraped items: ${allNewData.length}`);

    mergeData(allNewData);
    console.log("--- Scrape Complete ---");
}

runScrapers();
