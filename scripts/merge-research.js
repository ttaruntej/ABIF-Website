import fs from 'fs';
import path from 'path';

const DATA_FILE = 'e:/Google Antigravity/ABIF-Funding-Tracker/public/data/opportunities.json';

const newItems = [
    {
        "name": "HDFC Bank Parivartan Start-up Grants (FY26)",
        "body": "HDFC Bank CSR",
        "maxAward": "₹20 Crores (Total Pool)",
        "deadline": "Rolling (FY26 Cycle)",
        "link": "https://www.hdfcbank.com/personal/useful-links/social-initiatives/parivartan",
        "description": "CSR funding for social impact startups focusing on education, healthcare, and rural development.",
        "status": "Open",
        "linkStatus": "verified",
        "category": "csr",
        "lastScraped": new Date().toISOString(),
        "dataSource": "research:notebooklm",
        "targetAudience": ["startup", "incubator"],
        "sectors": ["Social Impact", "HealthTech", "EdTech"],
        "stages": ["Proof of Concept", "Seed", "Scale-up"]
    },
    {
        "name": "MANAGE-CIA RKVY-RAFTAAR Agribusiness Incubation",
        "body": "MANAGE / Ministry of Agriculture",
        "maxAward": "₹25 Lakhs",
        "deadline": "31-03-2026",
        "link": "https://www.manage.gov.in/cia/cia.asp",
        "description": "Grant-in-aid to support agribusiness startups for product development and scaling under the RAFTAAR scheme.",
        "status": "Closing Soon",
        "linkStatus": "verified",
        "category": "national",
        "lastScraped": new Date().toISOString(),
        "dataSource": "research:notebooklm",
        "targetAudience": ["startup", "incubator"],
        "sectors": ["AgriTech", "FoodTech"],
        "stages": ["Ideation", "Seed"]
    },
    {
        "name": "MeitY Blockchain India Challenge",
        "body": "MeitY / NIC",
        "maxAward": "Stage-wise funding",
        "deadline": "Rolling (Phase-wise)",
        "link": "https://www.msh.gov.in/",
        "description": "National challenge for startups building blockchain solutions for governance and supply chain transparency.",
        "status": "Open",
        "linkStatus": "verified",
        "category": "national",
        "lastScraped": new Date().toISOString(),
        "dataSource": "research:notebooklm",
        "targetAudience": ["startup"],
        "sectors": ["Web3", "Blockchain", "GovTech"],
        "stages": ["Ideation", "MVP", "Scale-up"]
    },
    {
        "name": "BIRAC Biotechnology Ignition Grant (BIG-25)",
        "body": "BIRAC",
        "maxAward": "₹50 Lakhs",
        "deadline": "15-08-2026",
        "link": "https://birac.nic.in/desc_new.php?id=217",
        "description": " Flagship grant for early-stage biotech innovators to translate ideas into proof-of-concept.",
        "status": "Open",
        "linkStatus": "verified",
        "category": "national",
        "lastScraped": new Date().toISOString(),
        "dataSource": "research:notebooklm",
        "targetAudience": ["startup"],
        "sectors": ["BioTech", "MedTech", "HealthTech"],
        "stages": ["Ideation", "Proof of Concept"]
    }
];

if (fs.existsSync(DATA_FILE)) {
    const existingData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const dataMap = new Map();
    existingData.forEach(item => dataMap.set(item.name, item));

    newItems.forEach(item => {
        dataMap.set(item.name, { ...(dataMap.get(item.name) || {}), ...item });
    });

    const mergedData = Array.from(dataMap.values());
    fs.writeFileSync(DATA_FILE, JSON.stringify(mergedData, null, 4));
    console.log(`Successfully merged ${newItems.length} research mandates.`);
} else {
    fs.writeFileSync(DATA_FILE, JSON.stringify(newItems, null, 4));
}
