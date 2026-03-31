import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { mockComplaints } from '../data/mockData.js';
import { useApp } from '../context/AppContext.jsx';
import { ComplaintSidebar } from '../components/ComplaintSidebar.jsx';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons based on severity
const getMarkerIcon = (severity) => {
  const color = severity === 'Critical' ? 'red' :
                severity === 'High' ? 'orange' :
                severity === 'Medium' ? 'yellow' : 'green';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export default function Visualization() {
  const { selectedComplaint, setSelectedComplaint, markComplaintAsViewed } = useApp();
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]);

  const handleComplaintClick = (complaint) => {
    setSelectedComplaint(complaint);
    markComplaintAsViewed(complaint.id);
    setMapCenter([complaint.location.lat, complaint.location.lng]);
  };

  return (
    <div className="h-[calc(100vh-80px)] relative flex">
      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <MapController center={mapCenter} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {mockComplaints.map((complaint) => (
            <Marker
              key={complaint.id}
              position={[complaint.location.lat, complaint.location.lng]}
              icon={getMarkerIcon(complaint.severity)}
              eventHandlers={{
                click: () => handleComplaintClick(complaint)
              }}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-semibold text-sm mb-1">{complaint.title}</h4>
                  <p className="text-xs text-gray-600 mb-1">{complaint.location.address}</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    complaint.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                    complaint.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                    complaint.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {complaint.severity}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-6 left-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-10">
          <h4 className="font-semibold mb-2 text-sm">Severity Legend</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span>Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span>High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span>Low</span>
            </div>
          </div>
        </div>

        {/* Complaint Count */}
        <div className="absolute top-6 left-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-10">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{mockComplaints.length}</p>
            <p className="text-xs text-muted-foreground">Total Complaints</p>
          </div>
        </div>
      </div>

      {/* Complaint Sidebar */}
      <ComplaintSidebar />
    </div>
  );
}