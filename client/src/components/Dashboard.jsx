import React, { useRef, useEffect } from 'react';
import L from 'leaflet';

const API_BASE_URL = 'http://localhost:3000/api';

const Dashboard = ({
  activeProfile,
  setActiveProfile,
  openIncidentModal,
  currentWeather,
  weatherZone,
  handleToggleWeatherZone,
  aiAdvice,
  aiAdviceLoading,
  routeOrigin,
  setRouteOrigin,
  routeDestination,
  setRouteDestination,
  routeAdvisory,
  routeAdvisoryLoading,
  handleEvaluateRoute,
  news,
  expandedNewsIdx,
  handleNewsExpand,
  newsSummaries,
  incidents
}) => {
    
  const userLat = activeProfile?.latitude || 19.0760;
  const userLng = activeProfile?.longitude || 72.8777;
  const localIncidents = (incidents || []).filter(inc => {
    const latDiff = Math.abs(inc.latitude - userLat);
    const lngDiff = Math.abs(inc.longitude - userLng);
    return latDiff < 0.25 && lngDiff < 0.25;
  });

  return (
    <div className="flex-grow flex flex-col pt-24 bg-surface-container">
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-outline-variant">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">thunderstorm</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-primary">{activeProfile?.name}</h1>
              <p className="text-xs text-on-surface-variant font-medium">
                {weatherZone === 'gps'
                  ? `GPS: ${activeProfile.location}`
                  : `Home: ${activeProfile.location}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
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

      <main className="max-w-[1280px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 p-6 flex-grow">
        <div className="space-y-6">
          <section className="bg-white rounded-xl border-l-4 border-primary shadow-sm overflow-hidden border border-outline-variant/50">
            <div className="p-6">
              <h2 className="text-sm uppercase font-bold text-primary tracking-wider mb-1">AI Sentinel Advisory</h2>
              <p className="text-xs text-on-surface-variant mb-4">Personalized guidance based on your profile and live conditions.</p>
              {aiAdviceLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-outline italic">Analyzing safety parameters...</span>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-on-surface mb-4 leading-relaxed">{aiAdvice.advice}</p>
                  <div className="space-y-2">
                    {aiAdvice.checklist.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-surface-container-low rounded-lg">
                        <span className="material-symbols-outlined text-primary text-base mt-px">check_circle</span>
                        <span className="text-xs font-medium text-on-surface-variant">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-outline-variant/80 shadow-sm p-6 text-left">
            <h2 className="text-sm uppercase font-bold text-primary tracking-wider mb-1">Route Safety Evaluator</h2>
            <p className="text-xs text-on-surface-variant mb-4">Check transit safety before you travel.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={routeOrigin}
                onChange={(e) => setRouteOrigin(e.target.value)}
                placeholder="Origin"
                className="w-full border border-outline-variant rounded-lg px-3 py-2 text-xs bg-surface-container-lowest focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={routeDestination}
                onChange={(e) => setRouteDestination(e.target.value)}
                placeholder="Destination"
                className="w-full border border-outline-variant rounded-lg px-3 py-2 text-xs bg-surface-container-lowest focus:ring-2 focus:ring-primary"
              />
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
                  <h3 className="font-bold text-sm uppercase tracking-wide">Status: {routeAdvisory.safetyStatus}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{routeAdvisory.detailedWarning}</p>
                  {routeAdvisory.alternateRoute && (
                    <p className="text-xs text-primary font-semibold mt-1">Alternative: {routeAdvisory.alternateRoute}</p>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-outline-variant/80 shadow-sm overflow-hidden flex flex-col">
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
                </div>
              ) : (
                <div className="py-10 text-center text-xs text-outline">Loading weather data...</div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-outline-variant/80 shadow-sm p-4 text-left">
            <p className="text-xs uppercase font-bold text-outline tracking-wider mb-2">Google News Bulletins</p>
            <div className="max-h-[150px] overflow-y-auto space-y-2">
              {news.length > 0 ? (
                news.map((item, idx) => (
                  <div key={idx} className="border border-outline-variant/30 rounded-lg overflow-hidden bg-surface-container-lowest">
                    <button
                      onClick={() => handleNewsExpand(idx, item)}
                      className="w-full text-left p-2.5 flex justify-between items-center hover:bg-surface-variant/20"
                    >
                      <span className="text-xs font-semibold text-on-surface-variant flex-1 pr-2">{item.title}</span>
                      <span className={`material-symbols-outlined text-base text-outline transition-transform ${expandedNewsIdx === idx ? 'rotate-180' : ''}`}>
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
          </section>

          <section className="bg-white rounded-xl border border-outline-variant/80 shadow-sm p-4 text-left">
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
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
