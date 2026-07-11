import React, { useRef, useEffect } from 'react';
import L from 'leaflet';

const IncidentReportModal = ({
  reportingIncident,
  setReportingIncident,
  incidentCoords,
  setIncidentCoords,
  incidentCategory,
  setIncidentCategory,
  handleBroadcastIncident,
  mapContainerRef,
  mapInstanceRef,
  markerInstanceRef
}) => {

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
  }, [reportingIncident, incidentCoords, mapContainerRef, mapInstanceRef, markerInstanceRef, setIncidentCoords]);

  if (!reportingIncident) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-outline-variant shadow-xl overflow-hidden flex flex-col">
        <div className="bg-error text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined font-bold">warning</span>
            <span className="font-bold text-sm uppercase tracking-wider">Broadcast Local Emergency Alert</span>
          </div>
          <button onClick={() => setReportingIncident(false)} className="w-8 h-8 rounded-full hover:bg-black/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-on-surface-variant">Click on the map to place a pin or drag the existing pin to the exact location of the incident.</p>
          <div className="w-full h-[250px] rounded-lg overflow-hidden border border-outline-variant" ref={mapContainerRef}></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={incidentCategory}
              onChange={(e) => setIncidentCategory(e.target.value)}
              className="w-full border border-outline-variant rounded-lg p-2.5 text-xs"
            >
              <option>Waterlogging</option>
              <option>Road Blockage</option>
              <option>Landslide</option>
              <option>Power Outage</option>
            </select>
            <div className="text-xs text-center p-2.5 rounded-lg bg-surface-container-low">
              <span className="font-bold">Lat:</span> {incidentCoords.lat.toFixed(4)}, <span className="font-bold">Lng:</span> {incidentCoords.lng.toFixed(4)}
            </div>
          </div>
        </div>
        <div className="p-4 bg-surface-container-low border-t border-outline-variant">
          <button
            onClick={handleBroadcastIncident}
            className="w-full bg-error text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider"
          >
            Broadcast Emergency Alert
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncidentReportModal;
