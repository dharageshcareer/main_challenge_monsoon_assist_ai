import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import Parser from 'rss-parser';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import db, { initDatabase } from './database.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize SQLite database schema
initDatabase();

// -------------------------------------------------------------
// SECURITY CONFIGURATION
// -------------------------------------------------------------

// Use Helmet to set secure HTTP headers (XSS protection, referrer policy, etc.)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Configure secure CORS options (limit to development ports and deployed domains)
const allowedOrigins = [
  'http://localhost:5174',
  'http://localhost:3000',
  'https://monsoonmind-assist-98.web.app',
  'https://monsoonmind-assist-98.firebaseapp.com'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or mobile app requests (origin is undefined)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by secure CORS policy'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Set up API rate limiting to mitigate denial of service (DoS) and brute force
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

app.use('/api/', apiLimiter);

// -------------------------------------------------------------
// GEN AI SETUP
// -------------------------------------------------------------
let ai = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  console.log('[Gemini] Google Gen AI SDK initialized successfully.');
} else {
  console.warn('[Gemini] WARNING: GEMINI_API_KEY is not defined. AI endpoints will run in fallback simulation mode.');
}

const MODEL_NAME = 'gemini-flash-lite-latest';

// -------------------------------------------------------------
// UTILITIES & LANGUAGE HELPERS
// -------------------------------------------------------------

/**
 * Maps a language code (mr, ml, bn, ta, hi, en) to a human-readable name.
 * @param {string} lang - Language code.
 * @returns {string} Human-readable language name.
 */
function getLanguageLabel(lang) {
  const labels = {
    mr: 'Marathi',
    ml: 'Malayalam',
    bn: 'Bengali',
    ta: 'Tamil',
    hi: 'Hindi',
    en: 'English'
  };
  return labels[lang] || 'English';
}

// -------------------------------------------------------------
// FALLBACK DATA GENERATORS FOR RESILIENCE
// -------------------------------------------------------------

/**
 * Provides static, validated fallbacks for context advisories when APIs fail.
 */
function getAdviceFallback(profile, lang) {
  const fallback = {
    mr: {
      advice: `नमस्कार ${profile.name}, आपल्या परिसरात (${profile.location}) सध्या पाऊस पडत आहे. कृपया सुरक्षित राहा.`,
      checklist: [
        "तुमच्या मोटारसायकलचे इंजिन पाण्यापासून सुरक्षित जागी ठेवा.",
        "घराच्या बाहेरील पाण्याचा निचरा होणारी जागा स्वच्छ करा.",
        "आणीबाणीच्या औषधांचा साठा तपासा."
      ]
    },
    ml: {
      advice: `പ്രിയ ${profile.name}, മുന്നാറിൽ ഉരുൾപൊട്ടൽ സാധ്യതയുള്ളതിനാൽ അതീവ ജാഗ്രത പാലിക്കുക.`,
      checklist: [
        "പ്രായമായവരുടെ മരുന്നുകളും അത്യാവശ്യ സാധനങ്ങളും തയ്യാറാക്കുക.",
        "അടിയന്തര സാഹചര്യത്തിൽ ബന്ധപ്പെടേണ്ട നമ്പറുകൾ കുറിച്ചുവെക്കുക.",
        "വീട്ടുപരിസരത്തെ ജലനിരപ്പ് നിരീക്ഷിക്കുക."
      ]
    },
    bn: {
      advice: `নমস্কার ${profile.name}, নিউ টাউনে ভারী বৃষ্টির পূর্বাভাস রয়েছে। সাবধানে থাকুন।`,
      checklist: [
        "বারান্দার ড্রেনেজ পাইপ পরিষ্কার রাখুন এবং হালকা জিনিসপত্র ঘরে আনুন।",
        "পোষ্য কুকুরের খাবার এবং শুকনো খাবার মজুত রাখুন।",
        "লিফট বন্ধ থাকলে সিঁড়ি ব্যবহার করুন।"
      ]
    },
    ta: {
      advice: `வணக்கம் ${profile.name}, வேளச்சேரி தாழ்வான பகுதி என்பதால் மின்சாரம் மற்றும் குடிநீர் சேமிப்பை சரிபார்க்கவும்.`,
      checklist: [
        "தாழ்வான பகுதியில் வசிப்பதால் வெள்ள அபாய எச்சரிக்கைகளை கவனியுங்கள்.",
        "டாஸ் விளக்குகள் மற்றும் மொபைல் பவர் பேங்க் சார்ஜ் செய்யவும்.",
        "குடிநீர் வடிகால் பாதையை அடைப்புகள் இல்லாமல் வைக்கவும்."
      ]
    },
    hi: {
      advice: `नमस्ते ${profile.name}, सेक्टर 48 गुरुग्राम में बेसमेंट वाले विला के लिए सुरक्षा अलर्ट।`,
      checklist: [
        "निजी बेसमेंट में पानी भरने की स्थिति में पंप तैयार रखें.",
        "अपनी एसयूवी को सुरक्षित ऊंचाई पर पार्क करें।",
        "बच्चों के साथ घर के अंदर सुरक्षित रहें।"
      ]
    },
    en: {
      advice: `Hello ${profile.name}, moderate rain is active near ${profile.location}. Please take necessary precautions.`,
      checklist: [
        "Check structural vulnerabilities and power utilities.",
        "Prepare basic emergency kit and medication.",
        "Keep emergency contact numbers handy."
      ]
    }
  };
  return fallback[lang] || fallback.en;
}

/**
 * Provides static fallback route safety reports.
 */
function getRouteFallback(language) {
  const fallback = {
    mr: {
      safetyStatus: 'Caution',
      detailedWarning: 'कुर्ला भागात काही सखल रस्त्यांवर पाणी साचल्याची तक्रार आहे. जास्त उंचीचे रस्ते निवडा.',
      alternateRoute: 'रेल्वे ट्रॅक शेजारील रस्त्यांऐवजी पूर्व द्रुतगती महामार्गाचा वापर करा.'
    },
    ml: {
      safetyStatus: 'Unsafe',
      detailedWarning: 'मुन्नാर घाटात मुसळधार पावसामुळे दरड कोसळण्याची भीती आहे. सार्वजनिक बस सेवा विस्कळीत होऊ शकते.',
      alternateRoute: 'घाटातील प्रवास टाळा आणि हवामान सुधारेपर्यंत सुरक्षित ठिकाणी थांबा.'
    },
    bn: {
      safetyStatus: 'Safe',
      detailedWarning: 'নিউ টাউনে বৃষ্টি মাঝারি হলেও मेट्रो ট্রানজিট সचल রয়েছে। काही ठिकाणी पाणी साचले असू शकते.',
      alternateRoute: 'মেট্রো ব্যবহার করুন এবং জলমগ্ন সার্ভিস রোড এড়িয়ে চলুন।'
    },
    ta: {
      safetyStatus: 'Unsafe',
      detailedWarning: 'வேளச்சேரி பிரதான சாலைகளில் கடுமையான நீர் தேக்கம். இருசக்கர வாகனம் ஓட்டுவது ஆபத்தானது.',
      alternateRoute: 'தாம்பரம் சாலை அல்லது உயர்மட்ட மேம்பாலங்களை மட்டும் பயன்படுத்தவும்.'
    },
    hi: {
      safetyStatus: 'Caution',
      detailedWarning: 'सेक्टर 48 गुरुग्राम के आस-पास अंडरपास में जलभराव हो सकता है। गति धीमी रखें।',
      alternateRoute: 'गोल्फ कोर्स एक्सटेंशन रोड का उपयोग करें जहाँ जल निकासी व्यवस्था बेहतर है.'
    },
    en: {
      safetyStatus: 'Caution',
      detailedWarning: 'Localized waterlogging reported near low-lying points. High risk of transit delays.',
      alternateRoute: 'Use arterial flyovers and avoid service roads.'
    }
  };
  return fallback[language] || fallback.en;
}

/**
 * Provides bullet point fallbacks for news descriptions.
 */
function getNewsFallback(langLabel) {
  return [
    `मुख्य धोका आणि जलद पाण्याचा निचरा होण्याची सद्यस्थिती. (${langLabel})`,
    `स्थानिक प्रशासन आणि वाहतूक बदलांची माहिती. (${langLabel})`
  ];
}

/**
 * Provides chatbot response fallbacks.
 */
function getChatFallback(profile, lang) {
  const replies = {
    mr: `नमस्कार ${profile?.name ?? ''}, मी वेदरमॅन आहे. तुम्हाला प्रथमोपचार किंवा पुराच्या परिस्थितीबाबत कोणतीही मदत हवी असल्यास कृपया विचारा.`,
    ml: `ഹലോ ${profile?.name ?? ''}, ഞാൻ വെതർമാൻ ആണ്. ദുരന്ത നിവാരണത്തെക്കുറിച്ചോ പ്രഥമശുശ്രൂഷയെക്കുറിച്ചോ എന്തെങ്കിലും ചോദ്യങ്ങളുണ്ടെങ്കിൽ ചോദിക്കാവുന്നതാണ്.`,
    bn: `হ্যালো ${profile?.name ?? ''}, আমি ওয়েদারম্যান। ঘূর্ণিঝড় বা অতিবৃষ্টির সময় ফার্স্ট-এইড এবং সুরক্ষার পরামর্শ দিতে আমি প্রস্তুত।`,
    ta: `வணக்கம் ${profile?.name ?? ''}, நான் வெதர்மன். வெள்ள கால முதலுதவி அல்லது அவசரகால பாதுகாப்பு வழிகாட்டுதல்கள் ஏதேனும் தேவையா?`,
    hi: `नमस्ते ${profile?.name ?? ''}, मैं वेदरमैन हूँ। आपातकालीन प्राथमिक चिकित्सा या मानसून सुरक्षा के बारे में जानकारी के लिए मुझसे बात करें।`,
    en: `Hello ${profile?.name ?? ''}, I am WeatherMan. How can I assist you with safety advisories, first-aid steps, or nearby incidents today?`
  };
  return { reply: replies[lang] || replies.en };
}

// -------------------------------------------------------------
// DATABASE REST API ENDPOINTS
// -------------------------------------------------------------

// Fetch all profiles
app.get('/api/profiles', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM users');
    const rows = stmt.all();
    const parsedRows = rows.map(row => ({
      ...row,
      household: JSON.parse(row.household_json),
      infrastructure: JSON.parse(row.infrastructure_json)
    }));
    res.json(parsedRows);
  } catch (error) {
    console.error('[DB Error] Fetch profiles failed:', error);
    res.status(500).json({ error: 'Internal server query error' });
  }
});

// Fetch a single profile
app.get('/api/profiles/:id', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(req.params.id);
    if (!row) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json({
      ...row,
      household: JSON.parse(row.household_json),
      infrastructure: JSON.parse(row.infrastructure_json)
    });
  } catch (error) {
    console.error(`[DB Error] Fetch profile ${req.params.id} failed:`, error);
    res.status(500).json({ error: 'Internal server query error' });
  }
});

// Create profile (Wizard onboarding)
app.post('/api/profiles', (req, res) => {
  try {
    const profileSchema = z.object({
      name: z.string().min(1),
      location: z.string().min(1),
      latitude: z.number(),
      longitude: z.number(),
      language: z.string().min(1),
      household: z.object({}).passthrough(),
      infrastructure: z.object({}).passthrough(),
    });

    const validatedProfile = profileSchema.parse(req.body);
    const { name, location, latitude, longitude, language, household, infrastructure } = validatedProfile;

    const stmt = db.prepare(`
      INSERT INTO users (name, location, latitude, longitude, language, household_json, infrastructure_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      name,
      location,
      latitude,
      longitude,
      language,
      JSON.stringify(household),
      JSON.stringify(infrastructure)
    );

    const selectStmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const newUser = selectStmt.get(result.lastInsertRowid);

    res.status(201).json({
      ...newUser,
      household: JSON.parse(newUser.household_json),
      infrastructure: JSON.parse(newUser.infrastructure_json)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid profile data', details: error.errors });
    }
    console.error('[DB Error] Create profile failed:', error);
    res.status(500).json({ error: 'Internal server write error' });
  }
});

// Fetch all incidents
app.get('/api/incidents', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM incidents ORDER BY timestamp DESC');
    const rows = stmt.all();
    res.json(rows);
  } catch (error) {
    console.error('[DB Error] Fetch incidents failed:', error);
    res.status(500).json({ error: 'Internal server query error' });
  }
});

// Create new incident
app.post('/api/incidents', (req, res) => {
  try {
    const incidentSchema = z.object({
      category: z.string().min(1),
      latitude: z.number(),
      longitude: z.number(),
      reported_by: z.string().optional(),
    });

    const validatedIncident = incidentSchema.parse(req.body);
    const { category, latitude, longitude, reported_by } = validatedIncident;

    const stmt = db.prepare(`
      INSERT INTO incidents (category, latitude, longitude, reported_by)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      category,
      latitude,
      longitude,
      reported_by || 'Anonymous'
    );

    const selectStmt = db.prepare('SELECT * FROM incidents WHERE id = ?');
    const newIncident = selectStmt.get(result.lastInsertRowid);

    res.status(201).json(newIncident);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid incident data', details: error.errors });
    }
    console.error('[DB Error] Create incident failed:', error);
    res.status(500).json({ error: 'Internal server write error' });
  }
});

// -------------------------------------------------------------
// WEATHER PROXY ENDPOINT (Open-Meteo)
// -------------------------------------------------------------
app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and Longitude are required' });
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${parseFloat(lat)}&longitude=${parseFloat(lng)}&current=temperature_2m,precipitation,rain,weather_code&hourly=temperature_2m,rain&timezone=auto`;
    const response = await fetch(weatherUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch weather data from Open-Meteo: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('[Weather Proxy Error]', error);
    res.status(500).json({ error: 'Failed to retrieve weather reports' });
  }
});

// -------------------------------------------------------------
// LOCALIZED NEWS FEED PROXY (Google News RSS)
// -------------------------------------------------------------
const rssParser = new Parser();

app.get('/api/news', async (req, res) => {
  try {
    const { location } = req.query;
    if (!location) {
      return res.status(400).json({ error: 'Location query parameter is required' });
    }

    const mainLocation = location.split(',')[0].trim();
    // Sanitized location tag to prevent script inject
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(mainLocation)}+monsoon+flooding&hl=en-IN&gl=IN&ceid=IN:en`;

    const feed = await rssParser.parseURL(rssUrl);
    
    const items = (feed.items || []).slice(0, 5).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      description: item.contentSnippet || item.content || ''
    }));

    res.json(items);
  } catch (error) {
    console.error('[News Proxy Error]', error);
    res.status(500).json({ error: 'Failed to retrieve neighborhood bulletins' });
  }
});

// -------------------------------------------------------------
// REVERSE GEOCODING PROXY
// -------------------------------------------------------------
app.get('/api/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and Longitude are required' });
    }

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${parseFloat(lat)}&lon=${parseFloat(lng)}&format=json&accept-language=en`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MonsoonMind/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch geocoding data: ${response.statusText}`);
    }

    const data = await response.json();
    const address = data.address || {};
    const cityName = address.city || address.town || address.village || address.suburb || address.state || 'Unknown Location';
    res.json({ city: cityName });
  } catch (error) {
    console.error('[Reverse Geocode Error]', error);
    res.status(500).json({ error: 'Failed to geocode location coordinates' });
  }
});

// -------------------------------------------------------------
// GENERATIVE AI INTEGRATIONS & RUNTIME GUARDRAILS
// -------------------------------------------------------------

const adviceSchema = z.object({
  advice: z.string(),
  checklist: z.array(z.string())
});

const routeSchema = z.object({
  safetyStatus: z.string(),
  detailedWarning: z.string(),
  alternateRoute: z.string()
});

const newsSummarySchema = z.object({
  bullets: z.array(z.string()).length(2)
});

const chatSchema = z.object({
  reply: z.string()
});

// 1. Context-Aware Preparedness Advice (Module A)
app.post('/api/ai-advice', async (req, res) => {
  const { profile, weather, incidents, zone } = req.body;
  if (!profile) {
    return res.status(400).json({ error: 'Profile context is required' });
  }
  const lang = profile.language || 'en';

  try {
    const currentTemp = weather?.current?.temperature_2m ?? 24;
    const rainRate = weather?.current?.rain ?? 0;
    const langLabel = getLanguageLabel(lang);

    const userLat = parseFloat(profile.latitude);
    const userLng = parseFloat(profile.longitude);
    const nearbyIncidents = (incidents || []).filter(inc => {
      const latDiff = Math.abs(inc.latitude - userLat);
      const lngDiff = Math.abs(inc.longitude - userLng);
      return latDiff < 0.25 && lngDiff < 0.25;
    });

    const isGpsZone = zone === 'gps';
    const zoneFocusInstructions = isGpsZone
      ? `The user is currently away from home at their Live GPS location. Generate safety guidelines and checklist items focusing strictly on outdoor transit safety, weather shielding, travel precautions, and flash flooding advisories for their current geocoded location. Do NOT reference home-specific dwelling infrastructure parameters (like basement pumps, floor levels, or home utilities) since they are currently away from home.`
      : `The user is at home. Focus safety guidelines and checklist items specifically on their home dwelling type (e.g. ground floor independent drainage, basement water ingress, high-rise lift/wind safety) and home infrastructure setups (power backup, water storage).`;

    const systemPrompt = `You are MonsoonMind's AI Sentinel, an expert meteorological emergency preparedness bot.
Your task is to generate a personalized, three-phase (Before, During, After) safety plan for a user based on their specific profile and current weather.

User Profile:
- Name: ${profile.name}
- Location: ${profile.location}
- Language: ${langLabel}
- Household: ${JSON.stringify(profile.household)}
- Dwelling: ${JSON.stringify(profile.infrastructure)}

Weather Context:
- Temperature: ${currentTemp}°C
- Rain Rate: ${rainRate} mm/hr
- Nearby Hazards: ${JSON.stringify(nearbyIncidents)}

Instructions:
1.  **Phase 1: Before the Storm:** Generate 2-3 checklist items for immediate preparation based on the user's profile.
2.  **Phase 2: During the Storm:** Generate 2-3 checklist items for safety while the event is active. ${zoneFocusInstructions}
3.  **Phase 3: After the Storm:** Generate 2-3 checklist items for recovery and safety post-event (e.g., checking for structural damage, water contamination, electrical hazards).
4.  Provide a concise, reassuring summary (1-2 sentences) in ${langLabel}.
5.  Translate the entire response into ${langLabel}.

CRITICAL: Return a JSON object matching this schema:
{
  "advice": "Summary string in ${langLabel}",
  "checklist": [
    "Phase 1: Item 1 in ${langLabel}",
    "Phase 1: Item 2 in ${langLabel}",
    "Phase 2: Item 1 in ${langLabel}",
    "Phase 2: Item 2 in ${langLabel}",
    "Phase 3: Item 1 in ${langLabel}",
    "Phase 3: Item 2 in ${langLabel}"
  ]
}`;

    if (!ai) {
      throw new Error('Gemini client not initialized.');
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            advice: { type: 'STRING' },
            checklist: {
              type: 'ARRAY',
              items: { type: 'STRING' }
            }
          },
          required: ['advice', 'checklist']
        }
      }
    });

    const parsedData = JSON.parse(response.text.trim());
    const validated = adviceSchema.parse(parsedData);
    res.json(validated);
  } catch (error) {
    console.error('[Gemini Error]', error);
    const fallback = getAdviceFallback(profile, lang);
    res.json(fallback);
  }
});

// 2. AI Monsoon Travel Advisory (Module B)
app.post('/api/ai-route-safety', async (req, res) => {
  const { origin, destination, weather, incidents, language } = req.body;
  const lang = language || 'en';

  try {
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and Destination are required' });
    }

    const rainRate = weather?.current?.rain ?? 0;
    const langLabel = getLanguageLabel(lang);

    const systemPrompt = `You are a weather-aware transit routing specialist.
Analyze the travel route starting at "${origin}" and ending at "${destination}" under the current weather rate of ${rainRate} mm/hr and nearby incidents from our active community database: ${JSON.stringify(incidents || [])}.

Provide a safety evaluation in ${langLabel} containing:
1. "safetyStatus": exactly "Safe", "Caution", or "Unsafe".
2. "detailedWarning": specific route hazards, flooding reports, or blockage alerts along this start-to-end path.
3. "alternateRoute": alternate transit path or specific guidance.

You must translate all text fields in the output into the target language (${langLabel}).

CRITICAL: Return the response strictly as a JSON object matching this schema:
{
  "safetyStatus": "Safe | Caution | Unsafe",
  "detailedWarning": "Detailed warning text in ${langLabel}",
  "alternateRoute": "Alternate route/transit advice in ${langLabel}"
}`;

    if (!ai) {
      throw new Error('Gemini client not initialized.');
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            safetyStatus: { type: 'STRING' },
            detailedWarning: { type: 'STRING' },
            alternateRoute: { type: 'STRING' }
          },
          required: ['safetyStatus', 'detailedWarning', 'alternateRoute']
        }
      }
    });

    const parsedData = JSON.parse(response.text.trim());
    const validated = routeSchema.parse(parsedData);
    res.json(validated);
  } catch (error) {
    console.error('[Gemini Route Safety Error]', error);
    const fallback = getRouteFallback(lang);
    res.json(fallback);
  }
});

// 3. AI News Summary
app.post('/api/ai-news-summary', async (req, res) => {
  const { title, description, language } = req.body;
  const lang = language || 'en';

  try {
    if (!title) {
      return res.status(400).json({ error: 'News title is required' });
    }

    const langLabel = getLanguageLabel(lang);

    const systemPrompt = `You are a concise hazard communication assistant.
Summarize the following news item and explain its hazard implications for local residents.

News Item:
- Title: ${title}
- Snippet: ${description}

Instructions:
Generate exactly 2 short, bullet-point sentences containing safety implications or status.
You must translate the response into the target language (${langLabel}).

CRITICAL: Return the response strictly as a JSON object matching this schema:
{
  "bullets": [
    "First summary bullet in ${langLabel}",
    "Second summary bullet in ${langLabel}"
  ]
}`;

    if (!ai) {
      throw new Error('Gemini client not initialized.');
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            bullets: {
              type: 'ARRAY',
              items: { type: 'STRING' }
            }
          },
          required: ['bullets']
        }
      }
    });

    const parsedData = JSON.parse(response.text.trim());
    const validated = newsSummarySchema.parse(parsedData);
    res.json(validated);
  } catch (error) {
    console.error('[Gemini News Summary Error]', error);
    const langLabel = getLanguageLabel(lang);
    res.json({ bullets: getNewsFallback(langLabel) });
  }
});

// 4. Weatherman Bot Chat (FAB Widget)
app.post('/api/chat', async (req, res) => {
  const { message, history, profile, weather, incidents } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  const lang = profile?.language || 'en';

  try {
    const langLabel = getLanguageLabel(lang);

    const systemPrompt = `You are "WeatherMan", a helpful, empathetic local weather assistant for the MonsoonMind application.
Your mission is to provide safety recommendations, first-aid advice, and localized preparedness alerts.

User Profile:
- Name: ${profile?.name ?? 'Guest'}
- Location: ${profile?.location ?? 'Unknown'}
- Language: ${langLabel}
- Household Config: ${JSON.stringify(profile?.household ?? {})}
- Dwelling Structure: ${JSON.stringify(profile?.infrastructure ?? {})}

Current Weather:
- Temperature & Conditions: ${JSON.stringify(weather ?? {})}
- Local Incidents/Hazards (from active database): ${JSON.stringify(incidents ?? [])}

Instructions:
1. Provide a helpful, clear, and empathetic reply.
2. If the user writes their query in Hindi, Marathi, Bengali, Tamil, or Malayalam, reply to them in that language. Otherwise, default to the profile's active language (${langLabel}).
3. Use the user's infrastructure and household parameters to keep tips highly contextual (e.g. if they have mobility needs, prioritize evacuation support).
4. If they ask about local hazards, reference the reported incidents list.

CRITICAL: Return the response strictly as a JSON object matching this schema:
{
  "reply": "Empathetic bot response"
}`;

    if (!ai) {
      throw new Error('Gemini client not initialized.');
    }

    const contents = [
      { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Message: ${message}` }] }
    ];

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            reply: { type: 'STRING' }
          },
          required: ['reply']
        }
      }
    });

    const parsedData = JSON.parse(response.text.trim());
    const validated = chatSchema.parse(parsedData);
    res.json(validated);
  } catch (error) {
    console.error('[Gemini Chat Error]', error);
    res.json(getChatFallback(profile, lang));
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`[Server] MonsoonMind backend running on http://localhost:${PORT}`);
});

export default app; // For testing purposes
