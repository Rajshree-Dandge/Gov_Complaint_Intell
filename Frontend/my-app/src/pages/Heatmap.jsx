import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function GrievanceMap({ clusters }) {
  // Center map on the first cluster or a default location (e.g., Mumbai)
  const center = clusters.length > 0 ? [clusters[0].lat, clusters[0].lon] : [19.0760, 72.8777];

  return (
    <MapContainer center={center} zoom={15} style={{ height: "400px", width: "100%", borderRadius: "10px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      {clusters.map((cluster, idx) => (
        <CircleMarker 
          key={idx}
          center={[cluster.lat, cluster.lon]}
          // SIZE = VOLUME (Radius grows with count)
          radius={10 + (cluster.count * 5)} 
          // COLOR = SEVERITY
          pathOptions={{ 
            fillColor: cluster.color, 
            color: cluster.color, 
            fillOpacity: 0.6 
          }}
        >
          <Popup>
            <strong>AI Intelligence Alert</strong><br/>
            Severity: {cluster.severity.toFixed(1)}/10<br/>
            Reports in this zone: {cluster.count}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}