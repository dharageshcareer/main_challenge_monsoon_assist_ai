import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import Login from './components/Login';
import Wizard from './components/Wizard';
import Dashboard from './components/Dashboard';
import Chatbot from './components/Chatbot';
import IncidentReportModal from './components/IncidentReportModal';

const API_BASE_URL = 'http://localhost:3000/api';

function MainApp() {
  const [activeView, setActiveView] = useState('login'); // 'login', 'wizard', 'dashboard'
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [weatherZone, setWeatherZone] = useState('home'); // 'home' or 'gps'
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsCityName, setGpsCityName] = useState('');
  const [news, setNews] = useState([]);
  const [expandedNewsIdx, setExpandedNewsIdx] = useState(null);
  const [newsSummaries, setNewsSummaries] = useState({}); // { [index]: { bullets: [...], loading: boolean } }
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [selectedSeededProfileId, setSelectedSeededProfileId] = useState('');

  // Onboarding Wizard Form State
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardForm, setWizardForm] = useState({
    name: '',
    location: '',
    latitude: 19.0760,
    longitude: 72.8777,
    language: 'en',
    household: {
      adults: 2,
      children: 0,
      elderly: 0,
      mobility_needs: 0,
      pets: 0,
      details: '2 Adults'
    },
    infrastructure: {
      type: 'Ground Floor Independent',
      power_backup: false,
      water_source: 'Municipal Supply',
      commute: 'Motorbike'
    }
  });

  // AI Advice State (Module A)
  const [aiAdvice, setAiAdvice] = useState({
    advice: "Configuring safety profile...",
    checklist: []
  });
  const [aiAdviceLoading, setAiAdviceLoading] = useState(false);

  // Route Advisory State (Module B)
  const [routeOrigin, setRouteOrigin] = useState('');
  const [routeDestination, setRouteDestination] = useState('');
  const [routeAdvisory, setRouteAdvisory] = useState(null);
  const [routeAdvisoryLoading, setRouteAdvisoryLoading] = useState(false);

  // Chatbot State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hello! I am WeatherMan. How can I assist you with safety advisories, first-aid steps, or nearby incidents today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Incident Reporting State
  const [incidents, setIncidents] = useState([]);
  const [reportingIncident, setReportingIncident] = useState(false);
  const [incidentCategory, setIncidentCategory] = useState('Waterlogging');
  const [incidentCoords, setIncidentCoords] = useState({
    lat: 19.0760,
    lng: 72.8777
  });

  // Map Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  // Load user profiles and incidents on mount
  useEffect(() => {
    fetchProfiles();
    fetchIncidents();
  }, []);

  // Whenever active profile changes, reload weather, news, and AI Advice
  useEffect(() => {
    if (activeProfile) {
      setWeatherZone('home');
      fetchWeather(activeProfile.latitude, activeProfile.longitude);
      fetchNews(activeProfile.location);
      setRouteOrigin(activeProfile.location);
      setRouteDestination('');
      setRouteAdvisory(null);
    }
  }, [activeProfile]);

  // Whenever weather, news, language, or GPS zones update, trigger AI advice refresh
  useEffect(() => {
    if (activeProfile && currentWeather) {
      fetchAiAdvice();
    }
  }, [currentWeather, activeProfile?.language, weatherZone, gpsCoords, gpsCityName]);

  const fetchProfiles = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/profiles`);
      const data = await res.json();
      setProfiles(data);
    } catch (e) {
      console.error('Error fetching profiles', e);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
    fetchIncidents();
  }, [fetchProfiles, fetchIncidents]);

  const fetchWeather = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(`${API_BASE_URL}/weather?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      setCurrentWeather(data);
    } catch (e) {
      console.error('Error fetching weather', e);
    }
  }, []);

  const fetchNews = useCallback(async (location) => {
    try {
      const res = await fetch(`${API_BASE_URL}/news?location=${encodeURIComponent(location)}`);
      const data = await res.json();
      setNews(data);
      setExpandedNewsIdx(null);
      setNewsSummaries({});
    } catch (e) {
      console.error('Error fetching news', e);
    }
  }, []);

  const fetchIncidents = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/incidents`);
      const data = await res.json();
      setIncidents(data);
    } catch (e) {
      console.error('Error fetching incidents', e);
    }
  }, []);

  const fetchAiAdvice = useCallback(async () => {
    if (!activeProfile || !currentWeather) return;
    setAiAdviceLoading(true);
    
    const contextProfile = {
      ...activeProfile,
      location: weatherZone === 'gps' && gpsCityName ? gpsCityName : activeProfile.location,
      latitude: weatherZone === 'gps' && gpsCoords ? gpsCoords.lat : activeProfile.latitude,
      longitude: weatherZone === 'gps' && gpsCoords ? gpsCoords.lng : activeProfile.longitude
    };

    try {
      const res = await fetch(`${API_BASE_URL}/ai-advice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: contextProfile,
          weather: currentWeather,
          incidents: incidents,
          zone: weatherZone
        })
      });
      const data = await res.json();
      setAiAdvice(data);
    } catch (e) {
      console.error('Error fetching AI advice', e);
    } finally {
      setAiAdviceLoading(false);
    }
  }, [activeProfile, currentWeather, weatherZone, gpsCityName, gpsCoords, incidents]);

  useEffect(() => {
    if (activeProfile) {
      setWeatherZone('home');
      fetchWeather(activeProfile.latitude, activeProfile.longitude);
      fetchNews(activeProfile.location);
      setRouteOrigin(activeProfile.location);
      setRouteDestination('');
      setRouteAdvisory(null);
    }
  }, [activeProfile, fetchWeather, fetchNews]);

  useEffect(() => {
    if (activeProfile && currentWeather) {
      fetchAiAdvice();
    }
  }, [currentWeather, activeProfile, fetchAiAdvice]);

  const handleFetchGpsLocation = (callback) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setGpsCoords(coords);
          if (callback) callback(coords);
        },
        (error) => {
          console.error('Error getting GPS location', error);
          alert('Failed to get GPS location. Please enter location coordinates manually.');
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // -------------------------------------------------------------
  // LOGIN ACTIONS
  // -------------------------------------------------------------
  const handleLogin = (e) => {
    e.preventDefault();
    if (selectedSeededProfileId) {
      const target = profiles.find(p => p.id === parseInt(selectedSeededProfileId));
      if (target) {
        setActiveProfile(target);
        setActiveView('dashboard');
      }
    } else if (loginEmail.trim() && loginPassword.trim()) {
      // Simulate credential success, route to onboarding wizard to customize profile
      setWizardForm(prev => ({
        ...prev,
        name: loginEmail.split('@')[0],
      }));
      setActiveView('wizard');
    } else {
      alert('Please select a seeded profile or fill in your email and password.');
    }
  };

  // -------------------------------------------------------------
  // WIZARD ACTIONS
  // -------------------------------------------------------------

  const handleWizardGPS = () => {
    handleFetchGpsLocation((coords) => {
      setWizardForm(prev => ({
        ...prev,
        latitude: coords.lat,
        longitude: coords.lng,
        location: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
      }));
    });
  };

  const handleWizardSubmit = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wizardForm)
      });
      const newProfile = await res.json();
      setProfiles(prev => [...prev, newProfile]);
      setActiveProfile(newProfile);
      setActiveView('dashboard');
      // Reset wizard
      setWizardStep(1);
    } catch (e) {
      console.error('Error creating profile', e);
    }
  };

  const incrementCounter = (field) => {
    updateHouseholdCounter(field, 1);
  };

  const decrementCounter = (field) => {
    updateHouseholdCounter(field, -1);
  };
  
  const updateHouseholdCounter = (field, delta) => {
    setWizardForm(prev => {
      const newCount = prev.household[field] + delta;
      if (newCount < 0) return prev;

      const updatedHousehold = { ...prev.household, [field]: newCount };
      const details = [];
      if (updatedHousehold.adults > 0) details.push(`${updatedHousehold.adults} Adults`);
      if (updatedHousehold.children > 0) details.push(`${updatedHousehold.children} Kids`);
      if (updatedHousehold.elderly > 0) details.push(`${updatedHousehold.elderly} Elderly`);
      if (updatedHousehold.pets > 0) details.push(`${updatedHousehold.pets} Pets`);
      updatedHousehold.details = details.join(', ');

      return { ...prev, household: updatedHousehold };
    });
  };

  // -------------------------------------------------------------
  // DASHBOARD ACTIONS
  // -------------------------------------------------------------

  const handleEvaluateRoute = async () => {
    if (!routeOrigin || !routeDestination) return;
    setRouteAdvisoryLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ai-route-safety`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: routeOrigin,
          destination: routeDestination,
          weather: currentWeather,
          incidents: incidents,
          language: activeProfile?.language || 'en'
        })
      });
      const data = await res.json();
      setRouteAdvisory(data);
    } catch (e) {
      console.error('Error evaluating route safety', e);
    } finally {
      setRouteAdvisoryLoading(false);
    }
  };

  const handleNewsExpand = async (index, item) => {
    if (expandedNewsIdx === index) {
      setExpandedNewsIdx(null);
      return;
    }
    setExpandedNewsIdx(index);

    if (newsSummaries[index]) return;

    setNewsSummaries(prev => ({
      ...prev,
      [index]: { loading: true }
    }));

    try {
      const res = await fetch(`${API_BASE_URL}/ai-news-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          description: item.description,
          language: activeProfile?.language || 'en'
        })
      });
      const data = await res.json();
      setNewsSummaries(prev => ({
        ...prev,
        [index]: { bullets: data.bullets, loading: false }
      }));
    } catch (e) {
      console.error('Error getting news summary', e);
      setNewsSummaries(prev => ({
        ...prev,
        [index]: { bullets: ['Unable to retrieve summary.', 'Please try again later.'], loading: false }
      }));
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: chatMessages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          })),
          profile: activeProfile,
          weather: currentWeather,
          incidents: incidents
        })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
    } catch (e) {
      console.error('Error in chatbot', e);
      setChatMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I am having trouble connecting right now.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // -------------------------------------------------------------
  // INCIDENT MAP MODAL & LEAFLET LOGIC
  // -------------------------------------------------------------

  const openIncidentModal = () => {
    setReportingIncident(true);
    const initialCoords = gpsCoords || {
      lat: activeProfile?.latitude || 19.0760,
      lng: activeProfile?.longitude || 72.8777
    };
    setIncidentCoords(initialCoords);
  };

  useEffect(() => {
    if (reportingIncident && mapContainerRef.current) {
      setTimeout(() => {
        const { lat, lng } = incidentCoords;
        
        if (!mapInstanceRef.current) {
          const map = L.map(mapContainerRef.current).setView([lat, lng], 14);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          const redIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });

          const marker = L.marker([lat, lng], { draggable: true, icon: redIcon }).addTo(map);

          map.on('click', (e) => {
            const clickLat = e.latlng.lat;
            const clickLng = e.latlng.lng;
            marker.setLatLng([clickLat, clickLng]);
            setIncidentCoords({ lat: clickLat, lng: clickLng });
          });

          marker.on('dragend', () => {
            const position = marker.getLatLng();
            setIncidentCoords({ lat: position.lat, lng: position.lng });
          });

          mapInstanceRef.current = map;
          markerInstanceRef.current = marker;
        } else {
          mapInstanceRef.current.setView([lat, lng], 14);
          markerInstanceRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
    }
  }, [reportingIncident]);

  const handleBroadcastIncident = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: incidentCategory,
          latitude: incidentCoords.lat,
          longitude: incidentCoords.lng,
          reported_by: activeProfile?.name || 'Community Member'
        })
      });
      
      if (res.ok) {
        setReportingIncident(false);
        fetchIncidents();
        fetchWeather(activeProfile.latitude, activeProfile.longitude);
      }
    } catch (e) {
      console.error('Error reporting incident', e);
    }
  };

  const handleToggleWeatherZone = (zone) => {
    setWeatherZone(zone);
    if (zone === 'gps') {
      handleFetchGpsLocation(async (coords) => {
        fetchWeather(coords.lat, coords.lng);
        try {
          const res = await fetch(`${API_BASE_URL}/reverse-geocode?lat=${coords.lat}&lng=${coords.lng}`);
          const data = await res.json();
          setGpsCityName(data.city || 'Live GPS Location');
          fetchNews(data.city || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        } catch (e) {
          console.error('Error reverse geocoding GPS coordinates', e);
          setGpsCityName('Live GPS Location');
        }
      });
    } else {
      if (activeProfile) {
        setGpsCityName('');
        fetchWeather(activeProfile.latitude, activeProfile.longitude);
        fetchNews(activeProfile.location);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-on-background bg-background">
      {/* Global View Switcher (Only visible if logged in) */}
      {activeProfile && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-surface-container-high/90 backdrop-blur-md p-1 rounded-full shadow-lg border border-outline-variant flex gap-1">
          <button
            onClick={() => setActiveView('wizard')}
            className={`px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-standard active-scale ${
              activeView === 'wizard' ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            Wizard Config
          </button>
          <button
            onClick={() => setActiveView('dashboard')}
            className={`px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-standard active-scale ${
              activeView === 'dashboard' ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            Dashboard View
          </button>
          <button
            onClick={() => {
              setActiveProfile(null);
              setActiveView('login');
            }}
            className="px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-standard active-scale text-error hover:bg-error-container/20"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* VIEW 0: LOGIN VIEW */}
      {activeView === 'login' && (
        <main className="flex-grow flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-outline-variant shadow-lg overflow-hidden p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-primary text-3xl">thunderstorm</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-primary">MonsoonMind</h1>
              <p className="text-xs text-on-surface-variant font-medium">Real-Time Severe Weather Preparedness & Safety Coordinator</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] text-outline font-bold uppercase tracking-wider">Quick Select Seed Profile</label>
                <select
                  value={selectedSeededProfileId}
                  onChange={(e) => {
                    setSelectedSeededProfileId(e.target.value);
                    setLoginEmail('');
                    setLoginPassword('');
                  }}
                  className="w-full border border-outline-variant rounded-lg p-2.5 text-xs bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none focus:border-primary"
                >
                  <option value="">-- Choose Seed Profile --</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.location.split(',')[0]})</option>
                  ))}
                </select>
              </div>

              <div className="relative flex items-center justify-center py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/50"></div></div>
                <span className="relative bg-white px-2 text-[10px] font-bold text-outline uppercase tracking-widest">Or create new</span>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] text-outline font-bold uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    setSelectedSeededProfileId('');
                  }}
                  placeholder="e.g. name@domain.com"
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-xs bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] text-outline font-bold uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    setSelectedSeededProfileId('');
                  }}
                  placeholder="••••••••"
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-xs bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-container text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-standard active-scale shadow-md"
              >
                Sign In to Platform
              </button>
            </form>
          </div>
        </main>
      )}

      {/* VIEW 1: CONFIGURATION WIZARD */}
      {activeView === 'wizard' && (
        <main className="flex-grow flex items-center justify-center p-6 pt-24">
          <div className="max-w-2xl w-full bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col min-h-[550px]">
            {/* Header */}
            <div className="p-6 border-b border-outline-variant bg-surface-container-low">
              <h1 className="text-xl font-bold text-primary mb-4">Configure Your MonsoonMind Profile</h1>
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 font-semibold ${wizardStep >= 1 ? 'text-primary' : 'text-outline'}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${wizardStep >= 1 ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                    {wizardStep > 1 ? <span className="material-symbols-outlined text-sm">check</span> : '1'}
                  </span>
                  <span className="text-xs uppercase tracking-wider">Location</span>
                </div>
                <div className="h-[1px] w-8 bg-outline-variant"></div>
                <div className={`flex items-center gap-2 font-semibold ${wizardStep >= 2 ? 'text-primary' : 'text-outline'}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${wizardStep >= 2 ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                    {wizardStep > 2 ? <span className="material-symbols-outlined text-sm">check</span> : '2'}
                  </span>
                  <span className="text-xs uppercase tracking-wider">Household</span>
                </div>
                <div className="h-[1px] w-8 bg-outline-variant"></div>
                <div className={`flex items-center gap-2 font-semibold ${wizardStep >= 3 ? 'text-primary' : 'text-outline'}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${wizardStep >= 3 ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                    3
                  </span>
                  <span className="text-xs uppercase tracking-wider">Infrastructure</span>
                </div>
              </div>
            </div>

            {/* Form Canvas */}
            <div className="p-6 flex-grow flex flex-col justify-center">
              {/* Step 1: Location & Language */}
              {wizardStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2 text-left">
                    <label className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Your Full Name</label>
                    <input
                      type="text"
                      value={wizardForm.name}
                      onChange={(e) => setWizardForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Rajesh Kulkarni"
                      className="w-full border border-outline-variant rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Primary Location / Address</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={wizardForm.location}
                        onChange={(e) => setWizardForm(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Enter your street or neighborhood"
                        className="flex-grow border border-outline-variant rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                      <button
                        onClick={handleWizardGPS}
                        className="bg-primary hover:bg-primary/95 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-standard active-scale shrink-0"
                      >
                        <span className="material-symbols-outlined text-sm">my_location</span>
                        Use GPS
                      </button>
                    </div>
                    {(wizardForm.latitude !== 19.0760 || wizardForm.longitude !== 72.8777) && (
                      <p className="text-xs text-primary font-medium">GPS Selected: {wizardForm.latitude.toFixed(4)}, {wizardForm.longitude.toFixed(4)}</p>
                    )}
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider block">Preferred Language</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { code: 'en', label: 'English' },
                        { code: 'hi', label: 'हिंदी' },
                        { code: 'mr', label: 'मराठी' },
                        { code: 'ta', label: 'தமிழ்' },
                        { code: 'bn', label: 'বাংলা' },
                        { code: 'ml', label: 'മലയാളം' }
                      ].map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => setWizardForm(prev => ({ ...prev, language: lang.code }))}
                          className={`px-4 py-2 rounded-full border transition-standard active-scale text-sm font-medium ${
                            wizardForm.language === lang.code
                              ? 'border-2 border-primary bg-primary/10 text-primary font-bold'
                              : 'border-outline-variant hover:border-primary text-on-surface-variant'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Household Demographics */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  {[
                    { key: 'adults', label: 'Adults', desc: 'Ages 18+', icon: 'group' },
                    { key: 'children', label: 'Infants / Children', desc: 'Ages 0-17', icon: 'child_care' },
                    { key: 'elderly', label: 'Elderly members', desc: 'Ages 60+', icon: 'elderly' },
                    { key: 'mobility_needs', label: 'Mobility Needs', desc: 'Special assistance required', icon: 'accessible' },
                    { key: 'pets', label: 'Pets', desc: 'Dogs, cats, domestic animals', icon: 'pets' }
                  ].map((row) => (
                    <div key={row.key} className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-outline-variant/35 text-left">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-xl">{row.icon}</span>
                        <div>
                          <p className="font-semibold text-on-surface text-sm">{row.label}</p>
                          <p className="text-xs text-on-surface-variant">{row.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => decrementCounter(row.key)}
                          className="w-8 h-8 rounded-full border border-outline hover:bg-surface-variant active-scale transition-standard font-bold text-center flex items-center justify-center text-sm"
                        >
                          -
                        </button>
                        <span className="font-bold w-4 text-center text-sm">{wizardForm.household[row.key]}</span>
                        <button
                          onClick={() => incrementCounter(row.key)}
                          className="w-8 h-8 rounded-full border border-outline hover:bg-surface-variant active-scale transition-standard font-bold text-center flex items-center justify-center text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 3: Dwelling Infrastructure */}
              {wizardStep === 3 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { type: 'Ground Floor Independent', icon: 'home', label: 'Ground Floor' },
                      { type: 'High-Rise Apartment Block', icon: 'apartment', label: 'High-Rise' },
                      { type: 'Low-Lying Area Unit', icon: 'foundation', label: 'Low-Lying' }
                    ].map((card) => (
                      <button
                        key={card.type}
                        onClick={() => setWizardForm(prev => ({
                          ...prev,
                          infrastructure: { ...prev.infrastructure, type: card.type }
                        }))}
                        className={`p-4 rounded-xl border-2 transition-standard text-center flex flex-col items-center justify-center active-scale ${
                          wizardForm.infrastructure.type === card.type
                            ? 'border-primary bg-primary/10 text-primary font-bold'
                            : 'border-outline-variant hover:border-primary text-on-surface-variant'
                        }`}
                      >
                        <span className="material-symbols-outlined text-3xl mb-2">{card.icon}</span>
                        <p className="text-xs uppercase font-semibold">{card.label}</p>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-outline-variant/30">
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-outline text-lg">battery_charging_full</span>
                        <span className="text-sm font-semibold">Power Inverter Backup?</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wizardForm.infrastructure.power_backup}
                          onChange={(e) => setWizardForm(prev => ({
                            ...prev,
                            infrastructure: { ...prev.infrastructure, power_backup: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-outline text-lg">water_drop</span>
                        <span className="text-sm font-semibold">Water Source</span>
                      </div>
                      <select
                        value={wizardForm.infrastructure.water_source}
                        onChange={(e) => setWizardForm(prev => ({
                          ...prev,
                          infrastructure: { ...prev.infrastructure, water_source: e.target.value }
                        }))}
                        className="bg-surface border border-outline-variant text-on-surface-variant text-sm rounded-lg focus:ring-primary focus:border-primary block p-2 focus:outline-none"
                      >
                        <option value="Municipal Supply">Municipal Supply</option>
                        <option value="Independent Tank">Independent Tank</option>
                        <option value="Both Sources">Both Sources</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-outline text-lg">directions_car</span>
                        <span className="text-sm font-semibold">Primary Commute Vehicle</span>
                      </div>
                      <select
                        value={wizardForm.infrastructure.commute}
                        onChange={(e) => setWizardForm(prev => ({
                          ...prev,
                          infrastructure: { ...prev.infrastructure, commute: e.target.value }
                        }))}
                        className="bg-surface border border-outline-variant text-on-surface-variant text-sm rounded-lg focus:ring-primary focus:border-primary block p-2 focus:outline-none"
                      >
                        <option value="Motorbike">Motorbike / Scooter</option>
                        <option value="SUV">SUV / Jeep</option>
                        <option value="Sedan">Sedan / Hatchback</option>
                        <option value="Metro">Metro / Train</option>
                        <option value="Public Bus">Public Bus</option>
                        <option value="Remote Worker">No Commute (Remote)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-outline-variant bg-surface-container-low flex justify-between items-center">
              <button
                onClick={() => setWizardStep(prev => prev - 1)}
                className={`text-on-surface-variant hover:text-primary font-bold text-xs uppercase tracking-wider transition-standard ${wizardStep === 1 ? 'invisible' : ''}`}
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (wizardStep < 3) setWizardStep(prev => prev + 1);
                  else handleWizardSubmit();
                }}
                disabled={wizardStep === 1 && !wizardForm.name.trim()}
                className={`bg-primary hover:bg-primary-container text-white px-8 py-3 rounded-lg text-sm font-bold transition-standard active-scale shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {wizardStep === 3 ? 'Save & Launch Dashboard' : 'Next Step'}
              </button>
            </div>
          </div>
        </main>
      )}

      {/* VIEW 2: MAIN DASHBOARD */}
      {activeView === 'dashboard' && activeProfile && (
        <div className="flex-grow flex flex-col">
          {/* Sticky Top Header */}
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-outline-variant h-16 w-full flex items-center px-6">
            <div className="max-w-[1280px] mx-auto w-full flex justify-between items-center">
              <div className="flex items-center gap-6">
                <span className="text-xl font-black text-primary tracking-tight">MonsoonMind</span>
                {/* Active profile & switch selector */}
                <div 
                  onClick={() => setProfileDropdownOpen(prev => !prev)}
                  className="relative flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full border border-outline-variant cursor-pointer hover:bg-surface-container transition-standard"
                >
                  <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                  <span className="text-xs font-bold text-on-surface">
                    {activeProfile.name} ({weatherZone === 'gps' && gpsCityName ? `GPS: ${gpsCityName}` : activeProfile.location.split(',')[0]})
                  </span>
                  <span className="material-symbols-outlined text-xs text-outline">arrow_drop_down</span>
                  
                  {/* Dropdown containing the 5 profiles */}
                  <div className={`absolute top-8 left-0 bg-white border border-outline-variant rounded-xl shadow-lg w-56 py-2 z-50 ${profileDropdownOpen ? 'block' : 'hidden'}`}>
                    <p className="px-4 py-1 text-[10px] font-bold text-outline uppercase tracking-wider border-b border-outline-variant/35 mb-1 text-left">Switch Profile Context</p>
                    {profiles.map((p) => (
                      <button
                        key={p.id}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent toggling open again
                          setActiveProfile(p);
                          setProfileDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs transition-standard hover:bg-surface-container flex flex-col ${
                          activeProfile.id === p.id ? 'bg-primary/5 font-bold text-primary' : 'text-on-surface-variant'
                        }`}
                      >
                        <span>{p.name}</span>
                        <span className="text-[10px] text-outline font-normal">{p.location}</span>
                      </button>
                    ))}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveView('wizard');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-primary font-bold border-t border-outline-variant/35 mt-1 hover:bg-primary/5 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">add</span> Add New Profile
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Tools */}
              <div className="flex items-center gap-4">
                {/* Real-time active language switcher dropdown */}
                <select
                  value={activeProfile.language}
                  onChange={(e) => {
                    const nextLang = e.target.value;
                    setActiveProfile(prev => ({ ...prev, language: nextLang }));
                  }}
                  className="bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold uppercase tracking-widest px-2.5 py-1 focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                >
                  <option value="en">EN</option>
                  <option value="hi">HI</option>
                  <option value="mr">MR</option>
                  <option value="ta">TA</option>
                  <option value="bn">BN</option>
                  <option value="ml">ML</option>
                </select>

                <button
                  onClick={openIncidentModal}
                  className="bg-error text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-[#93000a] active-scale transition-standard shadow-sm border border-transparent"
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  Report Incident
                </button>
              </div>
            </div>
          </header>

          {/* Main Panel grid (60/40 Split) */}
          <main className="max-w-[1280px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 p-6 flex-grow">
            {/* Left Column (Advisory & Route Safety) */}
            <div className="space-y-6">
              {/* Module A: AI Preparedness & Guidance */}
              <section className="bg-white rounded-xl border-l-4 border-primary shadow-sm overflow-hidden border border-outline-variant/50">
                <div className="p-4 bg-primary/5 flex justify-between items-center border-b border-outline-variant/50 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-sm">
                      <span className="material-symbols-outlined text-lg">psychology</span>
                    </div>
                    <div>
                      <h2 className="font-bold text-sm text-on-surface uppercase tracking-wider">AI Sentinel Preparedness</h2>
                      <p className="text-xs text-on-surface-variant font-medium">
                        Personalized safety guidelines for {activeProfile.name} ({getLanguageLabel(activeProfile.language)} context)
                      </p>
                    </div>
                  </div>
                  <button className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-primary hover:text-white transition-standard active-scale group relative">
                    <span className="material-symbols-outlined text-lg">mic</span>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full pulse-effect"></span>
                  </button>
                </div>

                <div className="p-6 space-y-4 text-left">
                  {aiAdviceLoading ? (
                    <div className="flex flex-col items-center justify-center py-6 space-y-2">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs text-outline font-semibold">Consulting AI weather models...</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/35 text-sm leading-relaxed text-on-surface font-medium italic">
                        "{aiAdvice.advice}"
                      </div>
                      
                      <div className="space-y-2 pt-2">
                        <p className="text-xs uppercase font-bold text-outline tracking-wider mb-2">Household Priority Action Checklist</p>
                        {(aiAdvice?.checklist || []).map((item, idx) => (
                          <label key={idx} className="flex items-start gap-3 p-3 hover:bg-surface-container-low rounded-lg transition-standard cursor-pointer border border-transparent hover:border-outline-variant/35">
                            <input
                              type="checkbox"
                              className="mt-0.5 w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                            />
                            <span className="text-sm font-medium text-on-surface">{item}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* Module B: AI Monsoon Travel Advisory */}
              <section className="bg-white rounded-xl border border-outline-variant/80 shadow-sm p-6 text-left">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary text-xl">route</span>
                  <h2 className="font-bold text-sm uppercase tracking-wider">Route Safety Intelligence</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-outline font-bold uppercase tracking-wider">Origin (Start point)</label>
                    <input
                      type="text"
                      value={routeOrigin}
                      onChange={(e) => setRouteOrigin(e.target.value)}
                      className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-outline font-bold uppercase tracking-wider">Destination</label>
                    <input
                      type="text"
                      value={routeDestination}
                      onChange={(e) => setRouteDestination(e.target.value)}
                      placeholder="e.g. HAL Airport Road"
                      className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleEvaluateRoute}
                  disabled={!routeOrigin.trim() || !routeDestination.trim() || routeAdvisoryLoading}
                  className="w-full bg-primary text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-primary-container active-scale transition-standard mb-4 disabled:opacity-50"
                >
                  {routeAdvisoryLoading ? 'Evaluating Safety Risks...' : 'Evaluate Route Safety'}
                </button>

                {routeAdvisory && (
                  <div className={`p-4 rounded-xl border flex gap-4 transition-standard ${
                    routeAdvisory.safetyStatus === 'Safe'
                      ? 'bg-primary/5 border-primary/30'
                      : routeAdvisory.safetyStatus === 'Caution'
                      ? 'bg-[#fffbeb] border-[#fde68a]'
                      : 'bg-error-container/30 border-error-container'
                  }`}>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                      routeAdvisory.safetyStatus === 'Safe'
                        ? 'bg-primary/10 text-primary'
                        : routeAdvisory.safetyStatus === 'Caution'
                        ? 'bg-[#fef3c7] text-[#d97706]'
                        : 'bg-error-container text-error'
                    }`}>
                      <span className="material-symbols-outlined text-2xl font-bold">
                        {routeAdvisory.safetyStatus === 'Safe' ? 'check_circle' : routeAdvisory.safetyStatus === 'Caution' ? 'info' : 'cancel'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm uppercase tracking-wide">
                        Status: {routeAdvisory.safetyStatus}
                      </h3>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {routeAdvisory.detailedWarning}
                      </p>
                      {routeAdvisory.alternateRoute && (
                        <p className="text-xs text-primary font-semibold mt-1">
                          Alternative: {routeAdvisory.alternateRoute}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Right Column (Dynamic Weather Monitoring & Community News) */}
            <div className="space-y-6">
              <section className="bg-white rounded-xl border border-outline-variant/80 shadow-sm overflow-hidden flex flex-col">
                {/* Zone toggle */}
                <div className="p-4 bg-surface-container-low flex justify-center border-b border-outline-variant/30">
                  <div className="inline-flex p-1 bg-surface-container-high rounded-full border border-outline-variant/35">
                    <button
                      onClick={() => handleToggleWeatherZone('home')}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-standard active-scale ${
                        weatherZone === 'home' ? 'bg-white shadow-sm text-primary font-bold' : 'text-on-surface-variant'
                      }`}
                    >
                      Home Zone
                    </button>
                    <button
                      onClick={() => handleToggleWeatherZone('gps')}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-standard active-scale ${
                        weatherZone === 'gps' ? 'bg-white shadow-sm text-primary font-bold' : 'text-on-surface-variant'
                      }`}
                    >
                      Live GPS Zone
                    </button>
                  </div>
                </div>

                {/* Weather details */}
                <div className="px-6 pb-6 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
                  
                  {currentWeather ? (
                    <div className="relative z-10 pt-4">
                      <p className="text-[64px] font-black text-on-surface leading-none tracking-tighter">
                        {Math.round(currentWeather.current?.temperature_2m ?? 24)}°
                        <span className="text-2xl font-bold text-outline align-top">C</span>
                      </p>
                      <div className="flex items-center justify-center gap-1.5 text-on-surface-variant mb-6 font-semibold text-xs uppercase tracking-wider">
                        <span className="material-symbols-outlined text-primary text-sm">water_drop</span>
                        <span>Rainfall Rate: {currentWeather.current?.rain ?? 0} mm/hr</span>
                      </div>

                      {/* Animated circular weather gauge */}
                      <div className="relative w-40 h-40 mx-auto flex items-center justify-center mb-6">
                        <div className="absolute inset-0 border-4 border-outline-variant rounded-full opacity-20"></div>
                        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" style={{ animationDuration: '3s' }}></div>
                        <div className="absolute inset-3 bg-primary/10 rounded-full pulse-effect"></div>
                        <div className="relative flex flex-col items-center">
                          <span className="material-symbols-outlined text-primary text-4xl mb-1">
                            {currentWeather.current?.rain > 5 ? 'thunderstorm' : currentWeather.current?.rain > 0 ? 'rainy' : 'cloudy'}
                          </span>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                            {currentWeather.current?.rain > 10 ? 'HEAVY' : currentWeather.current?.rain > 2 ? 'MODERATE' : 'NORMAL'}
                          </span>
                        </div>
                      </div>

                      {/* Warning indicators */}
                      <h3 className={`text-md font-bold uppercase tracking-wider ${currentWeather.current?.rain > 5 ? 'text-error' : 'text-primary'}`}>
                        {currentWeather.current?.rain > 10 ? 'Severe Alert: Rain Incoming' : currentWeather.current?.rain > 0 ? 'Rain Active' : 'Conditions Stable'}
                      </h3>
                      <p className="text-xs text-outline font-medium mt-1">
                        Forecast parameters monitored via Open-Meteo API proxies.
                      </p>
                    </div>
                  ) : (
                    <div className="py-12 flex justify-center">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                {/* Local News RSS Feed */}
                <div className="border-t border-outline-variant">
                  <div className="p-3 bg-surface-container-low font-bold text-[10px] text-outline uppercase tracking-widest border-b border-outline-variant/35 text-left">
                    Neighborhood Bulletins (Google News)
                  </div>
                  <div className="divide-y divide-outline-variant/30 max-h-[300px] overflow-y-auto">
                    {news.length > 0 ? (
                      news.map((item, idx) => (
                        <div key={idx} className="text-left font-medium">
                          <button
                            onClick={() => handleNewsExpand(idx, item)}
                            className="w-full flex justify-between items-center p-4 hover:bg-surface-container-low transition-standard focus:outline-none"
                          >
                            <span className="text-xs font-semibold text-on-surface truncate pr-4">{item.title}</span>
                            <span className="material-symbols-outlined text-outline transition-transform duration-200" style={{ transform: expandedNewsIdx === idx ? 'rotate(180deg)' : 'none' }}>
                              expand_more
                            </span>
                          </button>

                          {expandedNewsIdx === idx && (
                            <div className="px-4 pb-4 text-xs text-on-surface-variant bg-surface-container-low/40">
                              {newsSummaries[idx]?.loading ? (
                                <div className="flex items-center gap-2 py-2">
                                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-[10px] text-outline">Generating AI news bullets...</span>
                                </div>
                              ) : (
                                <ul className="list-disc pl-5 space-y-1 py-1 font-normal text-on-surface-variant/90">
                                  {newsSummaries[idx]?.bullets?.map((bullet, bIdx) => (
                                    <li key={bIdx}>{bullet}</li>
                                  ))}
                                </ul>
                              )}
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-primary hover:underline font-bold mt-2 inline-block"
                              >
                                View original bulletin article
                              </a>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="p-4 text-xs text-outline italic text-center">No reports active for this location.</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Incidents Board */}
              <section className="bg-white rounded-xl border border-outline-variant/80 shadow-sm p-4 text-left">
                {(() => {
                  const userLat = activeProfile?.latitude || 19.0760;
                  const userLng = activeProfile?.longitude || 72.8777;
                  const localIncidents = (incidents || []).filter(inc => {
                    const latDiff = Math.abs(inc.latitude - userLat);
                    const lngDiff = Math.abs(inc.longitude - userLng);
                    return latDiff < 0.25 && lngDiff < 0.25;
                  });
                  return (
                    <>
                      <p className="text-xs uppercase font-bold text-outline tracking-wider mb-2">Neighborhood Reported Incidents ({localIncidents.length})</p>
                      <div className="max-h-[150px] overflow-y-auto space-y-2">
                        {localIncidents.length > 0 ? (
                          localIncidents.map((incident) => (
                            <div key={incident.id} className="p-3 bg-error-container/10 border border-error-container/30 rounded-lg text-xs flex justify-between items-start">
                              <div>
                                <p className="font-bold text-error">{incident.category}</p>
                                <p className="text-[10px] text-outline mt-0.5">By: {incident.reported_by} | Lat: {incident.latitude.toFixed(4)}, Lng: {incident.longitude.toFixed(4)}</p>
                              </div>
                              <span className="text-[9px] text-outline font-semibold">{new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-outline italic py-2">No emergency reports active in this sector.</p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </section>
            </div>
          </main>
        </div>
      )}

      {/* VIEW 3: INCIDENT REPORTING MODAL */}
      {reportingIncident && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-outline-variant shadow-xl overflow-hidden flex flex-col">
            <div className="bg-error text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined font-bold">warning</span>
                <span className="font-bold text-sm uppercase tracking-wider">Broadcast Local Emergency Alert</span>
              </div>
              <button
                onClick={() => setReportingIncident(false)}
                className="hover:bg-white/20 rounded-full p-1 transition-standard focus:outline-none"
              >
                <span className="material-symbols-outlined text-sm font-bold">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 text-left">
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                Center the map marker pin onto the exact location of the emergency. You can drag the red marker pin or click anywhere on the tile grid surface to snap the marker coordinates instantly.
              </p>

              {/* Map viewport container */}
              <div className="h-64 border border-outline-variant rounded-xl overflow-hidden shadow-inner relative">
                <div id="leaflet-incident-map" ref={mapContainerRef} className="w-full h-full" style={{ height: '250px', minHeight: '250px' }}></div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-outline font-bold uppercase tracking-wider block">Incident Classification</label>
                <select
                  value={incidentCategory}
                  onChange={(e) => setIncidentCategory(e.target.value)}
                  className="w-full border border-outline-variant rounded-lg p-2.5 text-sm bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="Severe Waterlogging">Severe Waterlogging</option>
                  <option value="Active Landslide/Debris Flow">Active Landslide/Debris Flow</option>
                  <option value="Fallen Tree/Blockage">Fallen Tree/Blockage</option>
                  <option value="Utility Power Grid Failure">Utility Power Grid Failure</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-surface-container-low border-t border-outline-variant flex justify-end gap-3">
              <button
                onClick={() => setReportingIncident(false)}
                className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-semibold hover:bg-surface-variant transition-standard active-scale"
              >
                Cancel
              </button>
              <button
                onClick={handleBroadcastIncident}
                className="px-6 py-2 bg-error hover:bg-[#93000a] text-white rounded-lg text-xs font-bold transition-standard active-scale shadow-sm"
              >
                Broadcast Alert to Neighborhood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERSISTENT WEATHERMAN CHAT BOT (FAB) */}
      {activeProfile && (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
          {chatOpen && (
            <div className="w-80 h-96 bg-white rounded-2xl shadow-xl border border-outline-variant flex flex-col overflow-hidden transition-standard">
              {/* Chat Header */}
              <div className="bg-primary p-4 flex items-center justify-between text-white shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined">psychology</span>
                  <span className="font-bold text-xs uppercase tracking-wider">WeatherMan Bot</span>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="hover:bg-white/20 rounded-full p-1 transition-standard focus:outline-none"
                >
                  <span className="material-symbols-outlined text-sm font-bold">close</span>
                </button>
              </div>

              {/* Message History Container */}
              <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-surface-container-low/50">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'bot' && (
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-sm">
                        <span className="material-symbols-outlined text-[14px]">psychology</span>
                      </div>
                    )}
                    <div className={`p-3 rounded-lg text-xs leading-relaxed max-w-[80%] border shadow-inner text-left ${
                      msg.sender === 'user'
                        ? 'bg-primary text-white border-primary/20 rounded-tr-none'
                        : 'bg-white text-on-surface border-outline-variant/35 rounded-tl-none font-medium'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white shrink-0 animate-pulse">
                      <span className="material-symbols-outlined text-[14px]">psychology</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg rounded-tl-none border border-outline-variant/35 shadow-inner text-xs italic text-outline flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-outline-variant bg-white flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder="Ask WeatherMan..."
                  className="flex-grow border border-outline-variant rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-primary text-white p-2 rounded-lg hover:bg-primary-container transition-standard active-scale flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-sm font-bold">send</span>
                </button>
              </div>
            </div>
          )}

          {/* Floating Action Button (FAB) */}
          <button
            id="chat-fab"
            onClick={() => setChatOpen(prev => !prev)}
            className="w-14 h-14 bg-primary hover:bg-primary-container text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-standard active-scale"
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: chatOpen ? "'FILL' 1" : "'FILL' 0" }}>
              {chatOpen ? 'chat_bubble' : 'chat'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
          <div className="max-w-md w-full bg-white border border-outline-variant p-8 rounded-2xl shadow-lg text-center space-y-4">
            <span className="material-symbols-outlined text-error text-5xl">error</span>
            <h2 className="text-xl font-bold text-primary">Something went wrong</h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              An unexpected error occurred in the layout interface. Please reload the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-white rounded-lg text-xs font-bold active-scale transition-standard hover:bg-primary-container"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
