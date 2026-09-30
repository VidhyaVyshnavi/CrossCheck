(function (global) {
  const REPORT_TEMPLATES = {
    govtHeading: 'Government of India | CrossCheck Verification Report',
    footer: 'Generated locally by CrossCheck. Sample figures are illustrative demo copy, not quotations of real documents; verify against the official sources listed in the portal.'
  };

  // Ten sector groupings used to organise the scheme directory in the sidebar.
  const CATEGORIES = [
    "Housing & Urban Development",
    "Water, Sanitation & Rural Infrastructure",
    "Rural Employment & Livelihoods",
    "Health & Family Welfare",
    "Education & Skill Development",
    "Agriculture & Farmer Welfare",
    "Financial Inclusion & Pension",
    "Energy",
    "Digital Connectivity",
    "Social Welfare & Women / Child Development",
    "Custom"
  ];

  const SCHEME_LIBRARY = {

    pmayg: {
      key: "pmayg", label: "PMAY-G — Rural Housing", ministry: "Ministry of Rural Development",
      category: "Housing & Urban Development", status: "Active",
      sourcePool: [
        { label: "PMAY-Gramin Mission", url: "https://pmayg.nic.in" },
        { label: "Ministry of Rural Development", url: "https://rural.gov.in" },
        { label: "Lok Sabha Q&A", url: "https://sansad.in/ls/questions/questions-and-answers" }
      ],
      docs: [
        { id: "pmayg-a", title: "Document A — Parliament Reply", source: "Lok Sabha Unstarred Question No. 1102 (illustrative)",
          text: "In reply to Lok Sabha Unstarred Question No. 1102, the Minister of Rural Development stated that under the Pradhan Mantri Awas Yojana-Gramin (PMAY-G), a cumulative total of 2.94 crore houses have been sanctioned as on 31 March 2024, against an overall target of 2.95 crore houses for the period 2016-17 to 2023-24. Central assistance amounting to Rs. 1,42,434 crore has been released to States and Union Territories during the corresponding period. As on date, 92% of the sanctioned houses stand completed." },
        { id: "pmayg-b", title: "Document B — Budget Document", source: "Ministry of Rural Development, Outcome Budget 2023-24 (illustrative)",
          text: "Pradhan Mantri Awas Yojana-Gramin (PMAY-G): Houses sanctioned cumulatively stand at 2.94 crore. Central share released under the scheme during the period under review amounted to Rs. 1,32,434 crore. Physical completion of sanctioned houses is reported at 89% as per the latest MIS data." }
      ]
    },

    pmayu: {
      key: "pmayu", label: "PMAY-U — Urban Housing", ministry: "Ministry of Housing and Urban Affairs",
      category: "Housing & Urban Development", status: "Active",
      sourcePool: [
        { label: "PMAY-Urban Mission", url: "https://pmay-urban.gov.in" },
        { label: "Ministry of Housing and Urban Affairs", url: "https://mohua.gov.in" },
        { label: "Union Budget — Demands for Grants", url: "https://www.indiabudget.gov.in" }
      ],
      docs: [
        { id: "pmayu-a", title: "Document A — Parliament Reply", source: "Lok Sabha Unstarred Question (illustrative)",
          text: "Responding to an Unstarred Question in the Lok Sabha, the Minister of Housing and Urban Affairs stated that under the Pradhan Mantri Awas Yojana-Urban (PMAY-U), 1.18 crore houses have been sanctioned as on 31 March 2024. Central assistance of Rs. 89,470 crore has been released to States and Union Territories so far. Of the sanctioned houses, 76% stand completed and delivered to beneficiaries." },
        { id: "pmayu-b", title: "Document B — Annual Report", source: "Ministry of Housing and Urban Affairs, Annual Report 2023-24 (illustrative)",
          text: "Pradhan Mantri Awas Yojana-Urban (PMAY-U): Cumulative houses sanctioned under the Mission stand at 1.18 crore as per the latest dashboard. Central assistance released to States/UTs during the period under review totalled Rs. 89,470 crore. Physical completion of sanctioned houses is placed at 74% as per Ministry records." }
      ]
    },

    jjm: {
      key: "jjm", label: "Jal Jeevan Mission — Rural Water", ministry: "Ministry of Jal Shakti",
      category: "Water, Sanitation & Rural Infrastructure", status: "Active",
      sourcePool: [
        { label: "Jal Jeevan Mission", url: "https://jaljeevanmission.gov.in" },
        { label: "Dept. of Drinking Water & Sanitation", url: "https://jalshakti-ddws.gov.in" },
        { label: "Rajya Sabha Q&A", url: "https://sansad.in/rs/questions/questions-and-answers" }
      ],
      docs: [
        { id: "jjm-a", title: "Document A — Parliament Reply", source: "Rajya Sabha reply (illustrative)",
          text: "Replying to a question in the Rajya Sabha, the Minister of Jal Shakti informed the House that under the Jal Jeevan Mission, tap water coverage among rural households stood at 78% as on 31.03.2024. An amount of Rs. 68,275 crore has been allocated to States and UTs under the Mission during 2023-24. Over 1.6 lakh villages have been declared 'Har Ghar Jal' villages so far." },
        { id: "jjm-b", title: "Document B — Annual Report", source: "Ministry of Jal Shakti, Annual Report 2023-24 (illustrative)",
          text: "Jal Jeevan Mission: Tap water connection coverage among rural households stood at 76% as on 31 March 2024, as per the JJM-IMIS dashboard. Fund allocation to States/UTs for the financial year was Rs. 68,275 crore. A total of 1.6 lakh villages have attained 'Har Ghar Jal' status during the year." }
      ]
    },

    sbmg: {
      key: "sbmg", label: "Swachh Bharat Mission (Gramin)", ministry: "Ministry of Jal Shakti",
      category: "Water, Sanitation & Rural Infrastructure", status: "Active",
      sourcePool: [
        { label: "Swachh Bharat Mission", url: "https://swachhbharatmission.gov.in" },
        { label: "Dept. of Drinking Water & Sanitation", url: "https://jalshakti-ddws.gov.in" },
        { label: "Lok Sabha Q&A", url: "https://sansad.in/ls/questions/questions-and-answers" }
      ],
      docs: [
        { id: "sbmg-a", title: "Document A — Parliament Reply", source: "Lok Sabha written reply (illustrative)",
          text: "In a written reply to the Lok Sabha, the Minister of Jal Shakti stated that under the Swachh Bharat Mission (Gramin) Phase II, rural sanitation coverage across the country stood at 99% as on 31 March 2024. Central funds amounting to Rs. 12,378 crore have been released to States and UTs during 2023-24. Over 1.3 lakh villages have been declared Open Defecation Free Plus (ODF Plus) villages so far." },
        { id: "sbmg-b", title: "Document B — Dashboard Extract", source: "SBM-Gramin dashboard summary (illustrative)",
          text: "Swachh Bharat Mission (Gramin) Phase II: Rural sanitation coverage is reported at 99% as per the SBM-G dashboard. Central funds released to States/UTs during the financial year stood at Rs. 12,378 crore. A total of 1.3 lakh villages have attained ODF Plus status during the year." }
      ]
    },

    sbmu: {
      key: "sbmu", label: "Swachh Bharat Mission (Urban)", ministry: "Ministry of Housing and Urban Affairs",
      category: "Water, Sanitation & Rural Infrastructure", status: "Active",
      sourcePool: [
        { label: "Swachh Bharat Mission — Urban", url: "https://swachhbharatmission.gov.in" },
        { label: "Ministry of Housing and Urban Affairs", url: "https://mohua.gov.in" },
        { label: "Press Information Bureau", url: "https://pib.gov.in" }
      ],
      docs: [
        { id: "sbmu-a", title: "Document A — Parliament Reply", source: "Rajya Sabha reply (illustrative)",
          text: "The Minister of Housing and Urban Affairs informed the Rajya Sabha that under Swachh Bharat Mission-Urban 2.0, urban sanitation coverage stood at 96% as on 31 March 2024. Central assistance of Rs. 8,652 crore has been released to States and Union Territories during 2023-24 for solid waste management infrastructure. Against the Mission's statutory-town target, 94% of the target has been achieved as on date." },
        { id: "sbmu-b", title: "Document B — Ministry Dashboard", source: "SBM-Urban dashboard summary (illustrative)",
          text: "Swachh Bharat Mission-Urban 2.0: Urban sanitation coverage is placed at 91% as per the latest Ministry dashboard. Central assistance released to States/UTs for solid waste management infrastructure during the period under review amounted to Rs. 8,652 crore. Target achievement against statutory towns covered under the Mission stands at 94% as per Ministry records." }
      ]
    },

    pmgsy: {
      key: "pmgsy", label: "PMGSY — Rural Roads", ministry: "Ministry of Rural Development",
      category: "Water, Sanitation & Rural Infrastructure", status: "Active",
      sourcePool: [
        { label: "Pradhan Mantri Gram Sadak Yojana", url: "https://pmgsy.nic.in" },
        { label: "Ministry of Rural Development", url: "https://rural.gov.in" },
        { label: "Lok Sabha Q&A", url: "https://sansad.in/ls/questions/questions-and-answers" }
      ],
      docs: [
        { id: "pmgsy-a", title: "Document A — Parliament Reply", source: "Lok Sabha question (illustrative)",
          text: "Responding to a Lok Sabha question, the Minister of Rural Development stated that under the Pradhan Mantri Gram Sadak Yojana, 7,44,529 km of rural roads have been constructed as on 31 March 2024. Central funds amounting to Rs. 27,614 crore were released to States during 2023-24. As on date, 97% of eligible habitations stand covered with all-weather road connectivity." },
        { id: "pmgsy-b", title: "Document B — Programme Dashboard", source: "PMGSY-OMMS portal summary (illustrative)",
          text: "Pradhan Mantri Gram Sadak Yojana: Cumulative road length constructed under the scheme stands at 7,44,529 km as per the PMGSY-OMMS portal. Central funds released to States during the financial year totalled Rs. 26,614 crore. Habitation coverage under the scheme is reported at 97% as per the latest data." }
      ]
    },

    mgnrega: {
      key: "mgnrega", label: "MGNREGS — Rural Employment", ministry: "Ministry of Rural Development",
      category: "Rural Employment & Livelihoods", status: "Active",
      sourcePool: [
        { label: "MGNREGA Public Data Portal", url: "https://nrega.nic.in" },
        { label: "Ministry of Rural Development", url: "https://rural.gov.in" },
        { label: "Open Government Data Platform India", url: "https://data.gov.in" }
      ],
      docs: [
        { id: "mgnrega-a", title: "Document A — Parliament Reply", source: "Written reply, Lok Sabha (illustrative)",
          text: "The Minister of Rural Development stated in a written reply that under the Mahatma Gandhi National Rural Employment Guarantee Scheme (MGNREGS), 289 crore person-days of employment were generated during 2023-24. Wage payments amounting to Rs. 89,154 crore were disbursed to workers during the year, at an average wage rate of Rs. 267 per day." },
        { id: "mgnrega-b", title: "Document B — Annual Report", source: "Ministry of Rural Development, Annual Report 2023-24 (illustrative)",
          text: "MGNREGS: 289 crore person-days of employment were generated during the financial year 2023-24. Total wage expenditure for the year stood at Rs. 89,154 crore, with the national average wage rate reported at Rs. 258 per day." }
      ]
    },

    nrlm: {
      key: "nrlm", label: "DAY-NRLM — Rural Livelihoods (SHGs)", ministry: "Ministry of Rural Development",
      category: "Rural Employment & Livelihoods", status: "Active",
      sourcePool: [
        { label: "Aajeevika — DAY-NRLM", url: "https://aajeevika.gov.in" },
        { label: "Ministry of Rural Development", url: "https://rural.gov.in" },
        { label: "Press Information Bureau", url: "https://pib.gov.in" }
      ],
      docs: [
        { id: "nrlm-a", title: "Document A — Parliament Reply", source: "Lok Sabha written reply (illustrative)",
          text: "In a written reply to the Lok Sabha, the Minister of Rural Development stated that under the Deendayal Antyodaya Yojana-National Rural Livelihoods Mission (DAY-NRLM), 9.8 crore women have been enrolled into Self Help Groups as on 31 March 2024. Cumulative bank loans disbursed to these groups stood at Rs. 3,26,417 crore. Corpus support released to SHGs during 2023-24 amounted to Rs. 6,842 crore." },
        { id: "nrlm-b", title: "Document B — Mission MIS Summary", source: "DAY-NRLM MIS extract (illustrative)",
          text: "DAY-NRLM: A cumulative 9.8 crore women members have been enrolled under the Self Help Group network as per the Mission's MIS. Bank loans disbursed to SHGs cumulatively stand at Rs. 3,18,417 crore. Corpus support released to Self Help Groups during the financial year was Rs. 6,842 crore." }
      ]
    },

    abpmjay: {
      key: "abpmjay", label: "Ayushman Bharat PM-JAY", ministry: "Ministry of Health and Family Welfare",
      category: "Health & Family Welfare", status: "Active",
      sourcePool: [
        { label: "Ayushman Bharat PM-JAY", url: "https://pmjay.gov.in" },
        { label: "National Health Authority", url: "https://nha.gov.in" },
        { label: "Ministry of Health & Family Welfare", url: "https://mohfw.gov.in" }
      ],
      docs: [
        { id: "abpmjay-a", title: "Document A — Parliament Reply", source: "Lok Sabha Unstarred Question (illustrative)",
          text: "Replying to an Unstarred Question in the Lok Sabha, the Minister of Health and Family Welfare stated that under Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (AB PM-JAY), 34.7 crore beneficiaries have been covered with Ayushman Cards issued as on 31 March 2024. A total of 29,648 hospitals stand empanelled under the scheme across the country. Claims amounting to Rs. 78,188 crore have been settled cumulatively since inception." },
        { id: "abpmjay-b", title: "Document B — NHA Dashboard", source: "National Health Authority dashboard summary (illustrative)",
          text: "Ayushman Bharat PM-JAY: Cumulative beneficiaries covered under the scheme stand at 34.7 crore as per the National Health Authority dashboard. The empanelled hospital network comprises 29,648 hospitals as on date. Cumulative claims settled under the scheme amount to Rs. 74,188 crore." }
      ]
    },

    nhm: {
      key: "nhm", label: "National Health Mission", ministry: "Ministry of Health and Family Welfare",
      category: "Health & Family Welfare", status: "Active",
      sourcePool: [
        { label: "National Health Mission", url: "https://nhm.gov.in" },
        { label: "Ministry of Health & Family Welfare", url: "https://mohfw.gov.in" },
        { label: "Union Budget — Demands for Grants", url: "https://www.indiabudget.gov.in" }
      ],
      docs: [
        { id: "nhm-a", title: "Document A — Parliament Reply", source: "Lok Sabha written reply (illustrative)",
          text: "The Minister of Health and Family Welfare stated in a written reply that under the National Health Mission, Rs. 36,785 crore has been released to States and UTs during 2023-24. Institutional deliveries covered under the Mission stood at 95% as on date. A cumulative 1.9 crore beneficiaries have been reached through Health and Wellness Centres during the year." },
        { id: "nhm-b", title: "Document B — HMIS Summary", source: "Health Management Information System extract (illustrative)",
          text: "National Health Mission: Funds released to States/UTs during the financial year totalled Rs. 36,785 crore. Institutional delivery coverage under the Mission is reported at 93% as per HMIS data. Beneficiaries reached through Health and Wellness Centres during the year stood at 1.9 crore." }
      ]
    },

    pmposhan: {
      key: "pmposhan", label: "PM POSHAN — School Meals", ministry: "Dept. of School Education & Literacy",
      category: "Education & Skill Development", status: "Active",
      sourcePool: [
        { label: "PM POSHAN", url: "https://pmposhan.education.gov.in" },
        { label: "Ministry of Education", url: "https://education.gov.in" },
        { label: "Press Information Bureau", url: "https://pib.gov.in" }
      ],
      docs: [
        { id: "pmposhan-a", title: "Document A — Parliament Reply", source: "Lok Sabha question (illustrative)",
          text: "Responding to a Lok Sabha question, the Minister of Education stated that under PM POSHAN (erstwhile Mid-Day Meal Scheme), 11.2 crore children were covered with hot cooked meals across 1.14 lakh schools during 2023-24. Central funds amounting to Rs. 11,600 crore were released to States and UTs during the year." },
        { id: "pmposhan-b", title: "Document B — Scheme MIS Extract", source: "Dept. of School Education MIS summary (illustrative)",
          text: "PM POSHAN: A cumulative 11.2 crore children were covered under the hot cooked meal programme across 1.14 lakh schools during the year, as per the Department of School Education MIS. Central funds released to States/UTs during 2023-24 amounted to Rs. 11,200 crore." }
      ]
    },

    samagra: {
      key: "samagra", label: "Samagra Shiksha", ministry: "Dept. of School Education & Literacy",
      category: "Education & Skill Development", status: "Active",
      sourcePool: [
        { label: "Samagra Shiksha", url: "https://samagra.education.gov.in" },
        { label: "Ministry of Education", url: "https://education.gov.in" },
        { label: "Union Budget — Demands for Grants", url: "https://www.indiabudget.gov.in" }
      ],
      docs: [
        { id: "samagra-a", title: "Document A — Parliament Reply", source: "Rajya Sabha reply (illustrative)",
          text: "The Minister of Education informed the Rajya Sabha that under Samagra Shiksha, Rs. 37,453 crore was released to States and UTs during 2023-24. The scheme covered 11.6 lakh schools across the country during the year. Girl students covered under the scheme's residential facilities numbered 2.8 lakh." },
        { id: "samagra-b", title: "Document B — Scheme Progress Report", source: "Samagra Shiksha progress report (illustrative)",
          text: "Samagra Shiksha: Central funds released to States/UTs during the financial year stood at Rs. 37,453 crore. The scheme's coverage extended to 11.6 lakh schools during the year. Girl students covered under residential/hostel facilities under the scheme numbered 2.6 lakh." }
      ]
    },

    pmkvy: {
      key: "pmkvy", label: "PMKVY — Skill India", ministry: "Ministry of Skill Development & Entrepreneurship",
      category: "Education & Skill Development", status: "Active",
      sourcePool: [
        { label: "PMKVY — Skill India", url: "https://pmkvyofficial.org" },
        { label: "Ministry of Skill Development & Entrepreneurship", url: "https://msde.gov.in" },
        { label: "Press Information Bureau", url: "https://pib.gov.in" }
      ],
      docs: [
        { id: "pmkvy-a", title: "Document A — Parliament Reply", source: "Lok Sabha written reply (illustrative)",
          text: "In a written reply to the Lok Sabha, the Minister of Skill Development and Entrepreneurship stated that under the Pradhan Mantri Kaushal Vikas Yojana (PMKVY), 1.4 crore beneficiaries have been reached through short-term and recognition-of-prior-learning training since inception. During 2023-24, Rs. 1,988 crore was released for skilling activities under the scheme. Placement outcomes covered 62% of certified candidates under the short-term training component." },
        { id: "pmkvy-b", title: "Document B — Skill India Portal Summary", source: "Skill India portal extract (illustrative)",
          text: "PMKVY: Cumulative beneficiaries reached under short-term and RPL training components stand at 1.4 crore as per the Skill India portal. Funds released for skilling activities during the financial year amounted to Rs. 1,988 crore. Placement coverage among certified candidates under short-term training is reported at 54%." }
      ]
    },

    pmkisan: {
      key: "pmkisan", label: "PM-KISAN — Farmer Income Support", ministry: "Ministry of Agriculture & Farmers Welfare",
      category: "Agriculture & Farmer Welfare", status: "Active",
      sourcePool: [
        { label: "PM-KISAN", url: "https://pmkisan.gov.in" },
        { label: "Dept. of Agriculture & Farmers Welfare", url: "https://agricoop.nic.in" },
        { label: "Lok Sabha Q&A", url: "https://sansad.in/ls/questions/questions-and-answers" }
      ],
      docs: [
        { id: "pmkisan-a", title: "Document A — Parliament Reply", source: "Lok Sabha question (illustrative)",
          text: "Responding to a Lok Sabha question, the Minister of Agriculture and Farmers Welfare stated that under PM-KISAN, 11 crore farmer families have been covered under the scheme as on 31 March 2024. During 2023-24, Rs. 21,000 crore was released under the scheme's instalments to eligible beneficiaries." },
        { id: "pmkisan-b", title: "Document B — Scheme Portal Summary", source: "PM-KISAN portal extract (illustrative)",
          text: "PM-KISAN: Cumulative farmer families covered under the scheme stand at 11 crore as per the PM-KISAN portal. Central funds released under the scheme's instalments during the financial year amounted to Rs. 19,500 crore." }
      ]
    },

    pmfby: {
      key: "pmfby", label: "PM Fasal Bima Yojana — Crop Insurance", ministry: "Ministry of Agriculture & Farmers Welfare",
      category: "Agriculture & Farmer Welfare", status: "Active",
      sourcePool: [
        { label: "PM Fasal Bima Yojana", url: "https://pmfby.gov.in" },
        { label: "Dept. of Agriculture & Farmers Welfare", url: "https://agricoop.nic.in" },
        { label: "Press Information Bureau", url: "https://pib.gov.in" }
      ],
      docs: [
        { id: "pmfby-a", title: "Document A — Parliament Reply", source: "Lok Sabha written reply (illustrative)",
          text: "The Minister of Agriculture and Farmers Welfare stated in a written reply that under the Pradhan Mantri Fasal Bima Yojana (PMFBY), 4 crore farmer applications were covered under the scheme during 2023-24. Claims amounting to Rs. 20,590 crore were settled to farmers during the year." },
        { id: "pmfby-b", title: "Document B — National Crop Insurance Portal", source: "NCIP dashboard summary (illustrative)",
          text: "PMFBY: Farmer applications covered under the scheme during the year stood at 4 crore as per the National Crop Insurance Portal. Claims settled to farmers during the same period amounted to Rs. 19,090 crore." }
      ]
    },

    pmjdy: {
      key: "pmjdy", label: "PM Jan-Dhan Yojana — Financial Inclusion", ministry: "Dept. of Financial Services, Ministry of Finance",
      category: "Financial Inclusion & Pension", status: "Active",
      sourcePool: [
        { label: "PM Jan-Dhan Yojana", url: "https://pmjdy.gov.in" },
        { label: "Dept. of Financial Services", url: "https://financialservices.gov.in" },
        { label: "Press Information Bureau", url: "https://pib.gov.in" }
      ],
      docs: [
        { id: "pmjdy-a", title: "Document A — Parliament Reply", source: "Rajya Sabha question (illustrative)",
          text: "Responding to a Rajya Sabha question, the Minister of Finance stated that under Pradhan Mantri Jan-Dhan Yojana (PM-JDY), 53.1 crore accounts have been opened as on 31 March 2024. Women account holders covered under the scheme numbered 29.6 crore as on the same date." },
        { id: "pmjdy-b", title: "Document B — PMJDY Dashboard", source: "PMJDY dashboard summary (illustrative)",
          text: "PM-JDY: Cumulative accounts opened under the scheme stand at 53.1 crore as per the PMJDY dashboard. Women account holders covered under the scheme number 29.3 crore as on date." }
      ]
    },

    apy: {
      key: "apy", label: "Atal Pension Yojana", ministry: "Dept. of Financial Services, Ministry of Finance",
      category: "Financial Inclusion & Pension", status: "Active",
      sourcePool: [
        { label: "PFRDA — Atal Pension Yojana", url: "https://www.pfrda.org.in" },
        { label: "Dept. of Financial Services", url: "https://financialservices.gov.in" },
        { label: "Press Information Bureau", url: "https://pib.gov.in" }
      ],
      docs: [
        { id: "apy-a", title: "Document A — Parliament Reply", source: "Lok Sabha written reply (illustrative)",
          text: "The Minister of Finance stated in a written reply to the Lok Sabha that Atal Pension Yojana (APY) enrolments have covered 6.6 crore subscribers as on 31 March 2024. Against an annual enrolment target for 2023-24, 118% of the target was achieved during the year." },
        { id: "apy-b", title: "Document B — PFRDA Dashboard", source: "PFRDA dashboard summary (illustrative)",
          text: "Atal Pension Yojana: Cumulative subscribers covered under the scheme stand at 6.6 crore as per the PFRDA dashboard. Target achievement for annual enrolments during the financial year is reported at 112% of the target set." }
      ]
    },

    mudra: {
      key: "mudra", label: "PM Mudra Yojana — MSME Loans", ministry: "Dept. of Financial Services, Ministry of Finance",
      category: "Financial Inclusion & Pension", status: "Active",
      sourcePool: [
        { label: "PM Mudra Yojana", url: "https://www.mudra.org.in" },
        { label: "Dept. of Financial Services", url: "https://financialservices.gov.in" },
        { label: "Press Information Bureau", url: "https://pib.gov.in" }
      ],
      docs: [
        { id: "mudra-a", title: "Document A — Parliament Reply", source: "Lok Sabha question (illustrative)",
          text: "Responding to a Lok Sabha question, the Minister of Finance stated that under Pradhan Mantri MUDRA Yojana (PMMY), loans amounting to Rs. 5,41,000 crore were sanctioned to beneficiaries during 2023-24. A cumulative 46.9 crore loan accounts have been opened under the scheme since inception." },
        { id: "mudra-b", title: "Document B — MUDRA Portal Summary", source: "MUDRA portal extract (illustrative)",
          text: "PM MUDRA Yojana: Loans sanctioned to beneficiaries during the financial year amounted to Rs. 5,23,000 crore as per the MUDRA portal. Cumulative loan accounts opened under the scheme since inception stand at 46.9 crore." }
      ]
    },

    standupindia: {
      key: "standupindia", label: "Stand-Up India", ministry: "Dept. of Financial Services, Ministry of Finance",
      category: "Financial Inclusion & Pension", status: "Active",
      sourcePool: [
        { label: "Stand-Up India — StandUpMitra", url: "https://www.standupmitra.in" },
        { label: "Dept. of Financial Services", url: "https://financialservices.gov.in" },
        { label: "Press Information Bureau", url: "https://pib.gov.in" }
      ],
      docs: [
        { id: "standupindia-a", title: "Document A — Parliament Reply", source: "Rajya Sabha reply (illustrative)",
          text: "The Minister of Finance informed the Rajya Sabha that under the Stand-Up India scheme, loans amounting to Rs. 51,232 crore have been sanctioned to SC/ST and women entrepreneurs since inception. A cumulative 2.4 lakh accounts have been opened under the scheme as on 31 March 2024." },
        { id: "standupindia-b", title: "Document B — Scheme Portal Summary", source: "StandUpMitra portal extract (illustrative)",
          text: "Stand-Up India: Loans sanctioned to SC/ST and women entrepreneurs since inception amount to Rs. 51,232 crore as per the Stand-Up India portal. Cumulative accounts opened under the scheme stand at 2.3 lakh as on date." }
      ]
    },

    svanidhi: {
      key: "svanidhi", label: "PM SVANidhi — Street Vendor Credit", ministry: "Ministry of Housing and Urban Affairs",
      category: "Financial Inclusion & Pension", status: "Active",
      sourcePool: [
        { label: "PM SVANidhi", url: "https://pmsvanidhi.mohua.gov.in" },
        { label: "Ministry of Housing and Urban Affairs", url: "https://mohua.gov.in" },
        { label: "Press Information Bureau", url: "https://pib.gov.in" }
      ],
      docs: [
        { id: "svanidhi-a", title: "Document A — Parliament Reply", source: "Lok Sabha question (illustrative)",
          text: "Responding to a Lok Sabha question, the Minister of Housing and Urban Affairs stated that under PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi), loans amounting to Rs. 13,224 crore have been disbursed to street vendors since the scheme's launch. A cumulative 92.6 lakh vendors have been covered under the scheme as on 31 March 2024." },
        { id: "svanidhi-b", title: "Document B — Scheme Portal Summary", source: "PM SVANidhi portal extract (illustrative)",
          text: "PM SVANidhi: Loans disbursed to street vendors since the scheme's launch amount to Rs. 13,224 crore as per the PM SVANidhi portal. Cumulative vendors covered under the scheme stand at 89.4 lakh as on date." }
      ]
    },

    ujjwala: {
      key: "ujjwala", label: "PM Ujjwala Yojana — LPG Connections", ministry: "Ministry of Petroleum & Natural Gas",
      category: "Energy", status: "Active",
      sourcePool: [
        { label: "PM Ujjwala Yojana", url: "https://pmuy.gov.in" },
        { label: "Press Information Bureau", url: "https://pib.gov.in" },
        { label: "Union Budget — Demands for Grants", url: "https://www.indiabudget.gov.in" }
      ],
      docs: [
        { id: "ujjwala-a", title: "Document A — Parliament Reply", source: "Lok Sabha written reply (illustrative)",
          text: "The Minister of Petroleum and Natural Gas stated in a written reply that under Pradhan Mantri Ujjwala Yojana (PMUY), 10.3 crore LPG connections have been sanctioned and released to beneficiaries as on 31 March 2024. Subsidy amounting to Rs. 12,600 crore was disbursed to PMUY beneficiaries during 2023-24." },
        { id: "ujjwala-b", title: "Document B — Scheme Dashboard", source: "PMUY dashboard summary (illustrative)",
          text: "Pradhan Mantri Ujjwala Yojana: Cumulative LPG connections sanctioned under the scheme stand at 10.3 crore as per the PMUY dashboard. Subsidy disbursed to beneficiaries during the financial year amounted to Rs. 11,100 crore." }
      ]
    },

    pmsuryaghar: {
      key: "pmsuryaghar", label: "PM Surya Ghar: Muft Bijli Yojana", ministry: "Ministry of New and Renewable Energy",
      category: "Energy", status: "Active",
      sourcePool: [
        { label: "PM Surya Ghar: Muft Bijli Yojana", url: "https://pmsuryaghar.gov.in" },
        { label: "Ministry of New and Renewable Energy", url: "https://mnre.gov.in" },
        { label: "Press Information Bureau", url: "https://pib.gov.in" }
      ],
      docs: [
        { id: "pmsuryaghar-a", title: "Document A — Parliament Reply", source: "Lok Sabha question (illustrative)",
          text: "Responding to a Lok Sabha question, the Minister of New and Renewable Energy stated that under PM Surya Ghar: Muft Bijli Yojana, rooftop solar installations have been completed for 14.8 lakh households as on date. Subsidy amounting to Rs. 6,512 crore has been disbursed to beneficiaries since the scheme's launch. The scheme has added 1.1 GW of rooftop solar capacity so far." },
        { id: "pmsuryaghar-b", title: "Document B — MNRE Portal Summary", source: "MNRE portal extract (illustrative)",
          text: "PM Surya Ghar: Muft Bijli Yojana: Rooftop solar installations completed under the scheme stand at 14.8 lakh households as per the MNRE portal. Subsidy disbursed to beneficiaries since launch amounts to Rs. 6,048 crore. Rooftop solar capacity added under the scheme is reported at 1.1 GW." }
      ]
    },

    bharatnet: {
      key: "bharatnet", label: "BharatNet — Rural Broadband", ministry: "Dept. of Telecommunications",
      category: "Digital Connectivity", status: "Active",
      sourcePool: [
        { label: "BharatNet Project", url: "https://bharatnet.gov.in" },
        { label: "Dept. of Telecommunications", url: "https://dot.gov.in" },
        { label: "Union Budget — Demands for Grants", url: "https://www.indiabudget.gov.in" }
      ],
      docs: [
        { id: "bharatnet-a", title: "Document A — Parliament Reply", source: "Rajya Sabha written reply (illustrative)",
          text: "The Minister of Communications stated in a written reply to the Rajya Sabha that under the BharatNet project, 2.1 lakh Gram Panchayats have been connected with broadband connectivity as on 31 March 2024. Central funds amounting to Rs. 19,041 crore have been released for the project during the corresponding period." },
        { id: "bharatnet-b", title: "Document B — DoT Dashboard", source: "Dept. of Telecommunications dashboard summary (illustrative)",
          text: "BharatNet: Cumulative Gram Panchayats connected under the project stand at 2.1 lakh as per the DoT dashboard. Central funds released for the project during the period under review amounted to Rs. 17,041 crore." }
      ]
    },

    bbbp: {
      key: "bbbp", label: "Beti Bachao Beti Padhao", ministry: "Ministry of Women and Child Development",
      category: "Social Welfare & Women / Child Development", status: "Active",
      sourcePool: [
        { label: "Ministry of Women and Child Development", url: "https://wcd.nic.in" },
        { label: "Press Information Bureau", url: "https://pib.gov.in" },
        { label: "MyGov India", url: "https://www.mygov.in" }
      ],
      docs: [
        { id: "bbbp-a", title: "Document A — Parliament Reply", source: "Lok Sabha question (illustrative)",
          text: "Responding to a Lok Sabha question, the Minister of Women and Child Development stated that under Beti Bachao Beti Padhao (BBBP), advocacy and awareness interventions have covered 96% of targeted districts as on date. Central funds amounting to Rs. 848 crore have been released to States and UTs since the scheme's launch." },
        { id: "bbbp-b", title: "Document B — Ministry Records", source: "Ministry of WCD progress summary (illustrative)",
          text: "Beti Bachao Beti Padhao: District-level advocacy and awareness coverage under the scheme stands at 96% as per Ministry records. Central funds released to States/UTs since the scheme's launch amount to Rs. 823 crore." }
      ]
    },

    nfsa: {
      key: "nfsa", label: "National Food Security Act / PDS", ministry: "Dept. of Food & Public Distribution",
      category: "Social Welfare & Women / Child Development", status: "Active",
      sourcePool: [
        { label: "National Food Security Act", url: "https://nfsa.gov.in" },
        { label: "Dept. of Food & Public Distribution", url: "https://dfpd.gov.in" },
        { label: "Union Budget — Demands for Grants", url: "https://www.indiabudget.gov.in" }
      ],
      docs: [
        { id: "nfsa-a", title: "Document A — Parliament Reply", source: "Lok Sabha written reply (illustrative)",
          text: "The Minister of Consumer Affairs, Food and Public Distribution stated in a written reply that under the National Food Security Act (NFSA), 81.4 crore beneficiaries are covered for subsidised foodgrains as on date. Foodgrain allocation released to States and UTs during 2023-24 amounted to Rs. 2,03,000 crore." },
        { id: "nfsa-b", title: "Document B — PDS Dashboard", source: "Public Distribution System dashboard summary (illustrative)",
          text: "National Food Security Act: Cumulative beneficiaries covered for subsidised foodgrains under the Act stand at 81.4 crore as per the Public Distribution System dashboard. Foodgrain allocation released to States/UTs during the financial year amounted to Rs. 1,97,000 crore." }
      ]
    },

    pmkusum: {
      key: "pmkusum", label: "PM-KUSUM — Solar for Farmers", ministry: "Ministry of New and Renewable Energy",
      category: "Energy", status: "Active",
      sourcePool: [
        { label: "PM-KUSUM (MNRE)", url: "https://mnre.gov.in" },
        { label: "Lok Sabha Q&A", url: "https://sansad.in/ls/questions/questions-and-answers" }
      ],
      docs: [
        { id: "pmkusum-a", title: "Document A — Parliament Reply", source: "Lok Sabha Unstarred Question (illustrative)",
          text: "Replying to a Lok Sabha question, the Minister of New and Renewable Energy stated that under PM-KUSUM, solar capacity of 4.1 GW has been added as on 31 March 2024. Central subsidy amounting to Rs. 5,890 crore has been disbursed to States. Installations of standalone solar pumps completed stand at 3.6 lakh." },
        { id: "pmkusum-b", title: "Document B — Budget / Annual Report", source: "MNRE Annual Report 2023-24 (illustrative)",
          text: "PM-KUSUM: Cumulative solar capacity added stands at 3.9 GW. Central subsidy disbursed under the scheme amounted to Rs. 5,890 crore. Installations completed number 3.6 lakh pumps." }
      ]
    },

    saubhagya: {
      key: "saubhagya", label: "Saubhagya — Household Electrification", ministry: "Ministry of Power",
      category: "Energy", status: "Active",
      sourcePool: [
        { label: "Saubhagya Dashboard", url: "https://saubhagya.gov.in" },
        { label: "Ministry of Power", url: "https://powermin.gov.in" }
      ],
      docs: [
        { id: "saubhagya-a", title: "Document A — Parliament Reply", source: "Rajya Sabha reply (illustrative)",
          text: "The Minister of Power informed Parliament that under the Saubhagya scheme, 2.86 crore households have been covered through electrification as on 31 March 2022. Central assistance of Rs. 3,850 crore has been released to States and power utilities. Coverage of un-electrified households is reported at 99%." },
        { id: "saubhagya-b", title: "Document B — Budget / Annual Report", source: "Ministry of Power Annual Report 2021-22 (illustrative)",
          text: "Saubhagya: A total of 2.82 crore households stand covered under the scheme. Central funds released to States and power utilities totalled Rs. 3,850 crore. Coverage of households stands at 99% as per the Saubhagya dashboard." }
      ]
    },

    amrut: {
      key: "amrut", label: "AMRUT 2.0 — Urban Water & Sewerage", ministry: "Ministry of Housing and Urban Affairs",
      category: "Housing & Urban Development", status: "Active",
      sourcePool: [
        { label: "AMRUT Mission", url: "https://amrut.gov.in" },
        { label: "Ministry of Housing and Urban Affairs", url: "https://mohua.gov.in" }
      ],
      docs: [
        { id: "amrut-a", title: "Document A — Parliament Reply", source: "Rajya Sabha reply (illustrative)",
          text: "Replying to a Rajya Sabha question, the Minister of Housing and Urban Affairs stated that under AMRUT, Rs. 77,640 crore has been allocated to States and UTs for approved projects. Central assistance of Rs. 31,200 crore has been released so far. Physical completion of approved projects stands at 64%." },
        { id: "amrut-b", title: "Document B — Budget / Annual Report", source: "MoHUA Outcome Budget 2023-24 (illustrative)",
          text: "AMRUT: Central allocation for approved State Annual Action Plans amounts to Rs. 77,640 crore. Central assistance released to States stands at Rs. 28,900 crore. Completion of projects is reported at 64% as per the Mission dashboard." }
      ]
    },

    smartcities: {
      key: "smartcities", label: "Smart Cities Mission", ministry: "Ministry of Housing and Urban Affairs",
      category: "Housing & Urban Development", status: "Active",
      sourcePool: [
        { label: "Smart Cities Mission", url: "https://smartcities.gov.in" },
        { label: "Ministry of Housing and Urban Affairs", url: "https://mohua.gov.in" }
      ],
      docs: [
        { id: "smartcities-a", title: "Document A — Parliament Reply", source: "Lok Sabha Unstarred Question (illustrative)",
          text: "As informed to the Lok Sabha, central share of Rs. 48,000 crore has been allocated under the Smart Cities Mission. Rs. 46,585 crore of this has been released to the 100 Smart Cities. Completion of projects stands at 91%." },
        { id: "smartcities-b", title: "Document B — Budget / Annual Report", source: "MoHUA Annual Report 2023-24 (illustrative)",
          text: "Smart Cities Mission: Central allocation stands at Rs. 48,000 crore. Central funds released to the 100 Smart Cities total Rs. 46,585 crore. Project completion stands at 91% per the Mission dashboard." }
      ]
    },

    indradhanush: {
      key: "indradhanush", label: "Mission Indradhanush — Immunisation", ministry: "Ministry of Health and Family Welfare",
      category: "Health & Family Welfare", status: "Active",
      sourcePool: [
        { label: "Ministry of Health and Family Welfare", url: "https://mohfw.gov.in" },
        { label: "National Health Mission", url: "https://nhm.gov.in" }
      ],
      docs: [
        { id: "indradhanush-a", title: "Document A — Parliament Reply", source: "Lok Sabha reply (illustrative)",
          text: "The Minister of Health and Family Welfare informed the Lok Sabha that under Mission Indradhanush, 5.5 crore children have been covered across intensified immunisation rounds. Immunisation coverage among children stands at 93%." },
        { id: "indradhanush-b", title: "Document B — Budget / Annual Report", source: "MoHFW Annual Report 2023-24 (illustrative)",
          text: "Mission Indradhanush: A total of 5.5 crore children have been covered. Full immunisation coverage among children is reported at 90%." }
      ]
    },

    pmgkay: {
      key: "pmgkay", label: "PM Garib Kalyan Anna Yojana", ministry: "Dept. of Food & Public Distribution",
      category: "Social Welfare & Women / Child Development", status: "Active",
      sourcePool: [
        { label: "Dept. of Food & Public Distribution", url: "https://dfpd.gov.in" },
        { label: "PIB", url: "https://pib.gov.in" }
      ],
      docs: [
        { id: "pmgkay-a", title: "Document A — Parliament Reply", source: "Rajya Sabha reply (illustrative)",
          text: "In reply to a Rajya Sabha question, the Minister stated that under the PM Garib Kalyan Anna Yojana, 81.35 crore beneficiaries have been covered for free foodgrain distribution. Rs. 2,03,000 crore has been allocated for the scheme during the period." },
        { id: "pmgkay-b", title: "Document B — Budget / Annual Report", source: "DFPD Outcome Budget 2023-24 (illustrative)",
          text: "PMGKAY: Beneficiaries covered under the scheme stand at 81.35 crore. Allocation for foodgrain subsidy under the scheme amounts to Rs. 1,97,000 crore." }
      ]
    },

    pmgdisha: {
      key: "pmgdisha", label: "PMGDISHA — Digital Literacy", ministry: "Ministry of Electronics and Information Technology",
      category: "Digital Connectivity", status: "Active",
      sourcePool: [
        { label: "PMGDISHA", url: "https://www.pmgdisha.in" },
        { label: "MeitY", url: "https://meity.gov.in" }
      ],
      docs: [
        { id: "pmgdisha-a", title: "Document A — Parliament Reply", source: "Lok Sabha Unstarred Question (illustrative)",
          text: "Replying to the Lok Sabha, the Minister of Electronics and Information Technology stated that 6.39 crore beneficiaries have been registered under PMGDISHA. Achievement against the training target stands at 100%. Around 2.5 lakh gram panchayats have been covered." },
        { id: "pmgdisha-b", title: "Document B — Budget / Annual Report", source: "MeitY Annual Report 2023-24 (illustrative)",
          text: "PMGDISHA: 6.39 crore beneficiaries stand registered under the scheme. Achievement against target is reported at 97%. Gram panchayats covered number 2.5 lakh." }
      ]
    },

    ssy: {
      key: "ssy", label: "Sukanya Samriddhi Yojana", ministry: "Dept. of Financial Services, Ministry of Finance",
      category: "Financial Inclusion & Pension", status: "Active",
      sourcePool: [
        { label: "National Savings Institute", url: "https://www.nsiindia.gov.in" },
        { label: "Ministry of Finance", url: "https://finmin.nic.in" }
      ],
      docs: [
        { id: "ssy-a", title: "Document A — Parliament Reply", source: "Lok Sabha reply (illustrative)",
          text: "The Minister of State for Finance informed the Lok Sabha that 3.1 crore accounts have been opened under the Sukanya Samriddhi Yojana as on 31 March 2024. Coverage among eligible girl children stands at 33%." },
        { id: "ssy-b", title: "Document B — Budget / Annual Report", source: "Ministry of Finance Annual Report 2023-24 (illustrative)",
          text: "Sukanya Samriddhi Yojana: Accounts opened stand at 3.07 crore. Coverage of eligible girl children is placed at 33%." }
      ]
    },

    custom: {
      key: "custom", label: "Custom — paste your own", ministry: "", category: "Custom", status: "Draft",
      sourcePool: [],
      docs: [
        { id: "custom-doc-a", title: "Document A", source: "Paste any official text", text: "" },
        { id: "custom-doc-b", title: "Document B", source: "Paste any official text", text: "" }
      ]
    }
  };

  function getAllSchemes() {
    return Object.keys(SCHEME_LIBRARY).map(function (key) { return SCHEME_LIBRARY[key]; });
  }

  function getScheme(key) {
    return SCHEME_LIBRARY[key] || null;
  }

  function getDefaultScheme() {
    return SCHEME_LIBRARY.pmayg;
  }

  function getCategories() {
    return CATEGORIES;
  }

  function buildProfessionalReport(options) {
    const { scheme, rows, tolerance, documentNames, createdAt } = options || {};
    const lines = [];
    const safeLabel = scheme && scheme.label ? scheme.label : 'CrossCheck Scheme';
    const safeMinistry = scheme && scheme.ministry ? scheme.ministry : 'Ministry not specified';
    const safeNames = Array.isArray(documentNames) && documentNames.length ? documentNames : ['Document A', 'Document B'];
    const now = createdAt || new Date().toISOString();

    lines.push('GOVERNMENT OF INDIA');
    lines.push('CrossCheck Verification Report');
    lines.push('========================================');
    lines.push('Scheme: ' + safeLabel);
    lines.push('Ministry / Department: ' + safeMinistry);
    lines.push('Tolerance applied: ' + Number(tolerance || 0).toFixed(1) + '%');
    lines.push('Generated on: ' + now);
    lines.push('Documents compared: ' + safeNames.join(' vs '));
    lines.push('');

    if (!rows || !rows.length) {
      lines.push('No comparable claims identified during this verification cycle.');
    } else {
      rows.forEach(function (row, index) {
        lines.push('[' + (index + 1) + '] ' + row.label);
        lines.push('  Verdict: ' + String(row.verdict || 'unknown').toUpperCase());
        lines.push('  Difference: ' + (row.pctDiff != null ? row.pctDiff.toFixed(2) + '%' : 'not available'));
        lines.push('  Document A: ' + (row.a ? formatClaimValue(row.a) : 'Not found'));
        lines.push('  Document B: ' + (row.b ? formatClaimValue(row.b) : 'Not found'));
        lines.push('');
      });
    }

    lines.push('----------------------------------------');
    lines.push(REPORT_TEMPLATES.footer);
    return lines.join('\n');
  }

  function formatClaimValue(claim) {
    if (!claim) return 'Not found';
    const value = (typeof claim.value === 'number' ? claim.value : Number(claim.value || 0));
    const unit = claim.unit || '';
    if (unit === '%') return value + '%';
    if (unit === '\u20b9 crore') return '\u20b9' + value.toLocaleString('en-IN') + ' crore';
    if (unit === '\u20b9/day') return '\u20b9' + value + '/day';
    if (unit === 'GW') return value + ' GW';
    if (unit === 'km') return value.toLocaleString('en-IN') + ' km';
    if (unit === 'hospitals') return value.toLocaleString('en-IN') + ' hospitals';
    if (unit.indexOf('crore') !== -1 || unit.indexOf('lakh') !== -1) return value + ' ' + unit;
    return value + (unit ? ' ' + unit : '');
  }

  const api = {
    REPORT_TEMPLATES: REPORT_TEMPLATES,
    SCHEME_LIBRARY: SCHEME_LIBRARY,
    CATEGORIES: CATEGORIES,
    getAllSchemes: getAllSchemes,
    getScheme: getScheme,
    getDefaultScheme: getDefaultScheme,
    getCategories: getCategories,
    buildProfessionalReport: buildProfessionalReport,
    formatClaimValue: formatClaimValue
  };

  if (typeof module !== 'undefined') module.exports = api;
  else global.CrossCheckDocumentStore = api;
})(typeof window !== 'undefined' ? window : this);
