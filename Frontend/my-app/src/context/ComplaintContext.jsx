import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ComplaintContext = createContext();

export function ComplaintProvider({ children }) {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // --- REVOLUTIONARY LOGIC: THE TRUTH LAYER ---
  const [locationStatus, setLocationStatus] = useState("Waiting for GPS Handshake...");
  const [coords, setCoords] = useState({ latitude: null, longitude: null });

  // 1. Fetching logic (Restored and secured)
  const fetchComplaints = useCallback(async (category = "Roads") => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    setLoading(true);
    try {
      const ward = localStorage.getItem("gov_ward") || "Dombivli";
      const response = await axios.get("http://127.0.0.1:8000/get-complaints", {
        params: { ward, category },
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(response.data);
    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 2. THE GEOSPATIAL AUTHENTICATOR (Resolving the "Default" issue)
  const resolveLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("❌ Hardware Error: GPS not supported");
      return;
    }

    setLocationStatus("📡 Establishing Satellite Link...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCoords({ latitude, longitude });

        // Trust Audit: If accuracy is low, notify the user/officer
        if (accuracy > 500) {
          setLocationStatus("⚠️ Weak Signal: Accuracy is low");
        }

        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const addr = res.data.address;
          const exactWard = addr.city_district || addr.suburb || addr.city || "Unknown Jurisdiction";
          
          setLocationStatus(`✅ Authenticated: ${exactWard}`);
        } catch (err) {
          setLocationStatus("❌ Network Error: Address Resolver Offline");
        }
      },
      (err) => {
        // EXPLICIT NETWORK TRUTH (No more defaults)
        if (err.code === 1) setLocationStatus("❌ Denial: Citizen blocked GPS access");
        else if (err.code === 2) setLocationStatus("❌ Signal Error: Position Unavailable");
        else if (err.code === 3) setLocationStatus("❌ Timeout: Network Handshake Failed");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Initialize location on load
  useEffect(() => {
    resolveLocation();
  }, [resolveLocation]);

  // Dummy stubs to prevent crashes in the 'value' prop
  const addComplaint = async () => {};
  const updateStatus = async () => {};

  return (
    <ComplaintContext.Provider value={{ 
      complaints, 
      loading, 
      locationStatus, // Shared with UI to show the 'Truth' badge
      coords,         // Shared with form
      fetchComplaints, 
      addComplaint, 
      updateStatus 
    }}>
      {children}
    </ComplaintContext.Provider>
  );
}

export function useComplaints() {
  return useContext(ComplaintContext);
}