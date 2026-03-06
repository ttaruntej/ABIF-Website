const fs = require('fs');

const agri = [
  {
      name: 'NABARD AgriSURE Fund (Direct Scheme)',
      body: 'NABVENTURES / MoA&FW',
      maxAward: 'Up to ?25 Crores',
      deadline: 'Rolling',
      link: 'https://nabventures.in/agrisure/',
      description: 'Direct equity investments in early-stage AgriTech and allied sector startups with high-impact potential.',
      category: 'national',
      status: 'Rolling',
      dataSource: 'manual:agritech',
      targetAudience: ['startup'],
      sectors: ['AgriTech', 'DeepTech'],
      stages: ['Seed', 'Early Traction', 'Scale-up']
  },
  {
      name: 'RKVY-RAFTAAR Seed Grants (NEST/NEO)',
      body: 'Various Incubators (NaaViC, etc.)',
      maxAward: 'Up to ?25 Lakhs',
      deadline: 'Varies by Incubator',
      link: 'https://rkvy.nic.in/',
      description: 'Pre-seed and seed stage grants disbursed through partner Agribusiness Incubators (R-ABIs) across India.',
      category: 'national',
      status: 'Rolling',
      dataSource: 'manual:agritech',
      targetAudience: ['startup'],
      sectors: ['AgriTech'],
      stages: ['Ideation', 'Seed']
  },
  {
      name: 'MANAGE-CIA Agri-Business Incubation',
      body: 'MANAGE Hyderabad',
      maxAward: 'Up to ?25 Lakhs',
      deadline: 'March 2026',
      link: 'https://www.manage.gov.in/cia/',
      description: 'Comprehensive incubation program offering mentorship, infrastructure, and financial grants for agri-startups.',
      category: 'national',
      status: 'Open',
      dataSource: 'manual:agritech',
      targetAudience: ['incubator', 'startup'],
      sectors: ['AgriTech'],
      stages: ['Ideation', 'Seed']
  },
  {
      name: 'AGRI UDAAN 8.0 Food & Agribusiness Accelerator',
      body: 'ICAR-NAARM a-IDEA',
      maxAward: 'Accelerator Support',
      deadline: 'Coming Soon',
      link: 'https://aidea.naarm.org.in/',
      description: 'Premier acceleration program targeting scaling startups with validated market solutions in agriculture and food tech.',
      category: 'national',
      status: 'Coming Soon',
      dataSource: 'manual:agritech',
      targetAudience: ['startup'],
      sectors: ['AgriTech', 'FoodTech'],
      stages: ['Early Traction', 'Scale-up']
  }
];

const old = JSON.parse(fs.readFileSync('public/data/opportunities.json', 'utf8'));
const filtered = old.filter(r => r.dataSource !== 'manual:agritech');
const merged = [...filtered, ...agri];
fs.writeFileSync('public/data/opportunities.json', JSON.stringify(merged, null, 2));
console.log('Successfully injected ' + agri.length + ' AgriTech records!');
