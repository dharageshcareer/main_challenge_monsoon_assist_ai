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
        <Login
          handleLogin={handleLogin}
          selectedSeededProfileId={selectedSeededProfileId}
          setSelectedSeededProfileId={setSelectedSeededProfileId}
          loginEmail={loginEmail}
          setLoginEmail={setLoginEmail}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          profiles={profiles}
        />
      )}

      {/* VIEW 1: CONFIGURATION WIZARD */}
      {activeView === 'wizard' && (
        <Wizard
          wizardStep={wizardStep}
          setWizardStep={setWizardStep}
          wizardForm={wizardForm}
          setWizardForm={setWizardForm}
          handleWizardGPS={handleWizardGPS}
          handleWizardSubmit={handleWizardSubmit}
          incrementCounter={incrementCounter}
          decrementCounter={decrementCounter}
        />
      )}

      {/* VIEW 2: MAIN DASHBOARD */}
      {activeView === 'dashboard' && activeProfile && (
        <Dashboard
          activeProfile={activeProfile}
          setActiveProfile={setActiveProfile}
          openIncidentModal={openIncidentModal}
          currentWeather={currentWeather}
          weatherZone={weatherZone}
          handleToggleWeatherZone={handleToggleWeatherZone}
          aiAdvice={aiAdvice}
          aiAdviceLoading={aiAdviceLoading}
          routeOrigin={routeOrigin}
          setRouteOrigin={setRouteOrigin}
          routeDestination={routeDestination}
          setRouteDestination={setRouteDestination}
          routeAdvisory={routeAdvisory}
          routeAdvisoryLoading={routeAdvisoryLoading}
          handleEvaluateRoute={handleEvaluateRoute}
          news={news}
          expandedNewsIdx={expandedNewsIdx}
          handleNewsExpand={handleNewsExpand}
          newsSummaries={newsSummaries}
          incidents={incidents}
        />
      )}

      <Chatbot
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        chatMessages={chatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        handleSendMessage={handleSendMessage}
        chatLoading={chatLoading}
      />

      <IncidentReportModal
        reportingIncident={reportingIncident}
        setReportingIncident={setReportingIncident}
        incidentCoords={incidentCoords}
        setIncidentCoords={setIncidentCoords}
        incidentCategory={incidentCategory}
        setIncidentCategory={setIncidentCategory}
        handleBroadcastIncident={handleBroadcastIncident}
        mapContainerRef={mapContainerRef}
        mapInstanceRef={mapInstanceRef}
        markerInstanceRef={markerInstanceRef}
      />
    </div>
  );
}

export default MainApp;
