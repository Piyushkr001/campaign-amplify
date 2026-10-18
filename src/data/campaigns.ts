import { Campaign } from '@/types/campaign';
import { Config } from '@/constants/config';

const DEFAULT_USE_OF_FUNDS = {
  advertising: Config.feeStructure.advertisingPercentage,
  platformFee: Config.feeStructure.platformFeePercentage,
  paymentProcessing: Config.feeStructure.paymentProcessingPercentage,
};

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    title: 'Clean Water for Every Village',
    category: 'Environment',
    creator: 'WaterFirst Foundation',
    creatorType: 'Nonprofit Organization',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    summary:
      'Funding digital and local print message distribution to bring awareness to freshwater filtration infrastructure in underserved rural areas.',
    story:
      'Over 2 billion people worldwide lack safely managed drinking water services. WaterFirst Foundation has engineered low-cost, gravity-fed biological sand filtration systems, but local civic leaders and regional authorities often remain unaware of available matching grants and implementation blueprints. By amplifying this informative campaign across regional media and social channels, we can directly connect 45 community centers with actionable filtration blueprints.',
    coverImage:
      'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=1200&q=80',
    raised: 18450,
    goal: 25000,
    estimatedReachMin: 360000,
    estimatedReachMax: 520000,
    status: 'FUNDING',
    daysRemaining: 12,
    featured: true,
    createdAt: '2026-09-15T08:00:00Z',
    backerCount: 312,
    distributionChannels: ['Meta Targeted Ads', 'Regional News Outlets', 'Civic Network Newsletters'],
    useOfFunds: DEFAULT_USE_OF_FUNDS,
    supportingSources: [
      {
        title: 'WHO/UNICEF Joint Monitoring Programme for Water Supply',
        url: 'https://washdata.org',
        publisher: 'WHO / UNICEF',
      },
      {
        title: 'Independent Filtration Field Verification Report',
        url: 'https://waterfirst.example.org/audit-2026',
        publisher: 'Global Water Institute',
      },
    ],
  },
  {
    id: 'camp-2',
    title: 'STEM Learning for Every Student',
    category: 'Education',
    creator: 'Future Minds Initiative',
    creatorType: 'Civic Initiative',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    summary:
      'Amplify free, open-source robotics and coding curricula to underfunded public schools, teachers, and student workshops.',
    story:
      'Quality hands-on science and engineering curricula often remain locked behind expensive enterprise licensing fees. Future Minds has developed complete, open-source robotics, math, and software modules designed for low-resource classrooms. This amplification campaign funds social and targeted search ads aimed directly at educators, parent-teacher associations, and after-school coordinators across 120 school districts.',
    coverImage:
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
    raised: 14200,
    goal: 18000,
    estimatedReachMin: 280000,
    estimatedReachMax: 410000,
    status: 'FUNDING',
    daysRemaining: 19,
    featured: true,
    createdAt: '2026-09-20T10:30:00Z',
    backerCount: 245,
    distributionChannels: ['Google Education Search', 'Educator Communities', 'YouTube Educational Ads'],
    useOfFunds: {
      advertising: 86,
      platformFee: 9,
      paymentProcessing: 5,
    },
    supportingSources: [
      {
        title: 'Open Source Curriculum Quality Audit',
        url: 'https://futureminds.example.org/audit',
        publisher: 'National Education Council',
      },
    ],
  },
  {
    id: 'camp-3',
    title: 'Early Mental Health Awareness',
    category: 'Health',
    creator: 'MindForward',
    creatorType: 'Research Collective',
    creatorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    summary:
      'Distribute scientifically validated early intervention guides and free confidential screening resources to young adults.',
    story:
      'Early detection and destigmatization can prevent mild depressive episodes and chronic anxiety from escalating into debilitating conditions. MindForward has assembled a verified, clinician-reviewed self-assessment tool and anonymous crisis navigator. We are crowdfunding distribution to reach young adults across digital social platforms where mental health misinformation is prevalent.',
    coverImage:
      'https://images.unsplash.com/photo-1527137342181-19aab11a8ee8?auto=format&fit=crop&w=1200&q=80',
    raised: 28900,
    goal: 30000,
    estimatedReachMin: 550000,
    estimatedReachMax: 780000,
    status: 'FUNDING',
    daysRemaining: 6,
    featured: true,
    createdAt: '2026-09-10T14:15:00Z',
    backerCount: 512,
    distributionChannels: ['Instagram & TikTok Educational Spotlights', 'Podcast Sponsorships', 'Campus Screens'],
    useOfFunds: {
      advertising: 87,
      platformFee: 8,
      paymentProcessing: 5,
    },
    supportingSources: [
      {
        title: 'Clinical Efficacy of Digital Screening Prompts',
        url: 'https://mindforward.example.org/research',
        publisher: 'Journal of Behavioral Health',
      },
    ],
  },
  {
    id: 'camp-4',
    title: 'Support Local Independent Artists',
    category: 'Arts & Culture',
    creator: 'Creative Voices Collective',
    creatorType: 'Independent Creator',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    summary:
      'Promote public awareness for independent regional artisans, grassroots exhibitions, and community cultural workspaces.',
    story:
      'Grassroots cultural spaces and independent artisans are being priced out of urban hubs, leaving communities without vibrant local artistic voices. Creative Voices Collective curates an open directory and spotlight series highlighting regional sculptors, painters, and community workshops. Contributions will fund targeted geo-fenced promotion to encourage neighborhood attendance and patron support.',
    coverImage:
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80',
    raised: 7600,
    goal: 12000,
    estimatedReachMin: 150000,
    estimatedReachMax: 230000,
    status: 'FUNDING',
    daysRemaining: 24,
    featured: false,
    createdAt: '2026-09-28T09:00:00Z',
    backerCount: 138,
    distributionChannels: ['Local City Guides', 'Instagram Cultural Discovery', 'Neighborhood Billboards'],
    useOfFunds: {
      advertising: 84,
      platformFee: 11,
      paymentProcessing: 5,
    },
    supportingSources: [
      {
        title: 'Regional Arts Economic Contribution Index',
        url: 'https://creativevoices.example.org/impact',
        publisher: 'Cultural Heritage Alliance',
      },
    ],
  },
  {
    id: 'camp-5',
    title: 'Safer Streets for Cyclists & Pedestrians',
    category: 'Community',
    creator: 'Urban Mobility Network',
    creatorType: 'Civic Initiative',
    creatorAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80',
    summary:
      'Amplify research-backed urban street redesign proposals and Vision Zero safety data to municipal transit planners and commuters.',
    story:
      'Traffic fatalities among cyclists and pedestrians have surged in major metropolitan corridors despite straightforward infrastructure remedies like protected bike lanes and raised crosswalks. The Urban Mobility Network created an interactive map detailing high-collision intersections alongside urban redesign solutions. Contributions fund localized video campaigns and transit ad placements to encourage civic participation in upcoming council planning sessions.',
    coverImage:
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
    raised: 9800,
    goal: 15000,
    estimatedReachMin: 190000,
    estimatedReachMax: 290000,
    status: 'FUNDING',
    daysRemaining: 15,
    featured: false,
    createdAt: '2026-09-22T11:45:00Z',
    backerCount: 184,
    distributionChannels: ['Transit Station Digital Displays', 'Commuter Geo-targeting', 'Local Podcasts'],
    useOfFunds: DEFAULT_USE_OF_FUNDS,
    supportingSources: [
      {
        title: 'Vision Zero Intersection Safety Data Benchmark',
        url: 'https://urbanmobility.example.org/vision-zero',
        publisher: 'Urban Transit Safety Board',
      },
    ],
  },
  {
    id: 'camp-6',
    title: 'Understanding Renewable Energy Grid Economics',
    category: 'Science',
    creator: 'GreenGrid Research',
    creatorType: 'Research Collective',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    summary:
      'Translate complex grid storage and clean energy economics into digestible public explainer videos and educational infographics.',
    story:
      'Transitioning to renewable energy requires widespread public understanding of modern grid storage, distributed generation, and peak load balancing. GreenGrid produces peer-reviewed, impartial video breakdowns explaining how battery storage and smart grids stabilize electricity costs. Backing this campaign distributes these explainer resources across digital video platforms and scientific publications.',
    coverImage:
      'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80',
    raised: 21500,
    goal: 22000,
    estimatedReachMin: 420000,
    estimatedReachMax: 600000,
    status: 'PROMOTING',
    daysRemaining: 4,
    featured: true,
    createdAt: '2026-09-08T16:20:00Z',
    backerCount: 395,
    distributionChannels: ['YouTube Science Explainer Placements', 'Tech Publication Banners', 'Substack Network'],
    useOfFunds: {
      advertising: 88,
      platformFee: 7,
      paymentProcessing: 5,
    },
    supportingSources: [
      {
        title: 'Renewable Integration & Cost Parity Analysis',
        url: 'https://greengrid.example.org/economics',
        publisher: 'Clean Power Institute',
      },
    ],
  },
  {
    id: 'camp-7',
    title: 'Digital Privacy Rights for Everyone',
    category: 'Public Policy',
    creator: 'OpenNet Coalition',
    creatorType: 'Civic Initiative',
    creatorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    summary:
      'Amplifying clear guides on personal data sovereignty, tracker blocking, and consumer biometric rights across national audiences.',
    story:
      'Everyday consumers rarely realize how extensively their location history, biometric profiles, and private browsing habits are commoditized by data brokers. OpenNet Coalition designed a 5-minute interactive checkup enabling individuals to audit their privacy permissions and opt out of predatory data brokers. Contributions fund digital ad distribution to make privacy protection accessible to non-technical users.',
    coverImage:
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
    raised: 16800,
    goal: 20000,
    estimatedReachMin: 320000,
    estimatedReachMax: 480000,
    status: 'PROMOTING',
    daysRemaining: 18,
    featured: false,
    createdAt: '2026-09-18T13:00:00Z',
    backerCount: 290,
    distributionChannels: ['Tech & News Feed Ads', 'Privacy Newsletter Sponsorships', 'Search Query Prompts'],
    useOfFunds: DEFAULT_USE_OF_FUNDS,
    supportingSources: [
      {
        title: 'Consumer Biometric Protection Guidelines',
        url: 'https://opennet.example.org/privacy-study',
        publisher: 'Digital Rights Forum',
      },
    ],
  },
  {
    id: 'camp-8',
    title: 'Financial Literacy for Early Careers',
    category: 'Economic Policy',
    creator: 'FairEconomy Alliance',
    creatorType: 'Nonprofit Organization',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    summary:
      'Educating young workers on compound interest, predatory payday lending risks, and employer retirement matches.',
    story:
      'Predatory financial products cost young workers billions annually in avoidable fees and high interest. FairEconomy Alliance has built practical, jargon-free interactive calculators on retirement compounding, credit score recovery, and student loan management. Funds will power social distribution targeting young adults entering the workforce.',
    coverImage:
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
    raised: 11400,
    goal: 16000,
    estimatedReachMin: 220000,
    estimatedReachMax: 330000,
    status: 'COMPLETED',
    daysRemaining: 21,
    featured: false,
    createdAt: '2026-09-25T15:30:00Z',
    backerCount: 201,
    distributionChannels: ['Career Platform Ads', 'Financial Education Podcasts', 'Social Feeds'],
    useOfFunds: DEFAULT_USE_OF_FUNDS,
    supportingSources: [
      {
        title: 'National Financial Capability Study Summary',
        url: 'https://faireconomy.example.org/study',
        publisher: 'Financial Capability Bureau',
      },
    ],
  },
  {
    id: 'camp-9',
    title: 'Sustainable Small Business Transitions',
    category: 'Business',
    creator: 'GreenCommerce Exchange',
    creatorType: 'Community Group',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    summary:
      'Broadcasting practical circular economy toolkits and cost-saving sustainable packaging guides to local merchants.',
    story:
      'Small business owners often want to adopt eco-friendly packaging and circular waste practices but lack time to navigate fragmented supplier directories. GreenCommerce Exchange vetted local supplier networks and created step-by-step transition roadmaps that lower costs while eliminating single-use plastics. Backers fund targeted outreach to retail shop owners and regional merchant associations.',
    coverImage:
      'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1200&q=80',
    raised: 8200,
    goal: 14000,
    estimatedReachMin: 160000,
    estimatedReachMax: 240000,
    status: 'COMPLETED',
    daysRemaining: 27,
    featured: false,
    createdAt: '2026-09-29T11:00:00Z',
    backerCount: 142,
    distributionChannels: ['Local Merchant Association Portals', 'Trade Publications', 'Digital Business Hubs'],
    useOfFunds: {
      advertising: 84,
      platformFee: 11,
      paymentProcessing: 5,
    },
    supportingSources: [
      {
        title: 'Circular Packaging Feasibility in Regional Retail',
        url: 'https://greencommerce.example.org/circular',
        publisher: 'Commerce Sustainability Review',
      },
    ],
  },
];
