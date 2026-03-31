import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
<<<<<<< HEAD
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
=======
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  doc, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

// Remove any old imports from '../integrations/firebase/config'
import { auth, db, googleProvider } from '../lib/Firebase';
import { useAuth } from './AuthContext';

const ComplaintContext = createContext();
// const db = getFirestore();

export function ComplaintProvider({ children }) {
  const { user, isGovernment } = useAuth();
  // const { user, isGovernment } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Complaints (Related to current user)
  const fetchComplaints = useCallback(async () => {
  // GUARD: If user is not logged in yet, stop here.
  if (!user || !user.id) {
    console.log("Waiting for user ID...");
    return; 
  }

  setLoading(true);
  try {
    const complaintsRef = collection(db, "complaints");
    let q;

    if (isGovernment) {
      q = query(complaintsRef, orderBy("created_at", "desc"));
    } else {
      // Now user.id is guaranteed to be a string, not undefined
      q = query(
        complaintsRef, 
        where("user_id", "==", user.id), 
        orderBy("created_at", "desc")
      );
    }

    const querySnapshot = await getDocs(q);
    const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setComplaints(fetched);
  } catch (error) {
    console.error("Error fetching complaints:", error);
  } finally {
    setLoading(false);
  }
}, [user, isGovernment]);

  useEffect(() => {
  // Only fetch if we actually have a valid user ID
  if (user?.id) {
    fetchComplaints();
  }
}, [user?.id, fetchComplaints]); // Dependency on user.id specifically

  // 2. Add Complaint (Storing the User's UID for the link)
  const addComplaint = async (complaintData) => {
    if (!user) return null;

    try {
      const complaintNumber = `GRV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      const newComplaint = {
        user_id: user.id, // CRITICAL: This links the complaint to the User Document
        complaint_number: complaintNumber,
        citizen_email: user.email,
        citizen_name: complaintData.citizenName || user.name || 'Anonymous',
        description: complaintData.description,
        category: complaintData.category || 'General',
        location: complaintData.location,
        status: 'Pending',
        created_at: serverTimestamp(),
        history: [{
          status: 'Pending',
          note: 'Complaint registered in system',
          timestamp: Date.now()
        }]
      };

      const docRef = await addDoc(collection(db, "complaints"), newComplaint);
      await fetchComplaints();
      return { id: docRef.id, ...newComplaint };
    } catch (error) {
      console.error("Error adding complaint:", error);
      return null;
    }
  };

  // 3. Update Status & Trigger Notification Logic
  const updateStatus = async (complaintDocId, newStatus) => {
    try {
      const complaintRef = doc(db, "complaints", complaintDocId);
      const complaintSnap = await getDoc(complaintRef);
      
      if (!complaintSnap.exists()) return;
      const complaintData = complaintSnap.data();

      // Update the complaint status and history
      await updateDoc(complaintRef, {
        status: newStatus,
        history: [...(complaintData.history || []), {
          status: newStatus,
          note: `Officer updated status to ${newStatus}`,
          timestamp: Date.now()
        }]
      });

      // RELATION LINKAGE: Find the user to notify them
      const userRef = doc(db, "users", complaintData.user_id);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log(`Ready to notify ${userData.name} at ${userData.email}`);
        
        // TRIGGER NOTIFICATION: Call your FastAPI endpoint here
        // await fetch('http://localhost:8000/send-notification', {
        //   method: 'POST',
        //   body: JSON.stringify({ email: userData.email, status: newStatus })
        // });
      }

      await fetchComplaints();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <ComplaintContext.Provider value={{ complaints, loading, addComplaint, updateStatus, fetchComplaints }}>
>>>>>>> 86870950f126e5db52c8b2efa8826687186f41e5
      {children}
    </ComplaintContext.Provider>
  );
}

export function useComplaints() {
  return useContext(ComplaintContext);
}