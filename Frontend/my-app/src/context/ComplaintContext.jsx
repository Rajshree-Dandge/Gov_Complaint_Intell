import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ComplaintContext = createContext();

export function ComplaintProvider({ children }) {
  const { user, isGovernment } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Complaints from Python Backend
  const fetchComplaints = useCallback(async (category = "Roads") => {
    if (!user) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const ward = user.ward || user.zone || "Ward 1";
      
      const response = await axios.get("http://127.0.0.1:8000/get-complaints", {
        params: { ward, category },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (Array.isArray(response.data)) {
        setComplaints(response.data);
      }
    } catch (error) {
      console.error("Error fetching complaints from backend:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user, fetchComplaints]);

  // 2. Add Complaint (Stub - handled by CitizenComplaint.jsx directly usually)
  const addComplaint = async (complaintData) => {
    // In this unified architecture, CitizenComplaint.jsx handles the multi-part form directly.
    // This context function can be used to refresh the list.
    await fetchComplaints();
    return { success: true };
  };

  // 3. Update Status (Needs backend endpoint, currently stubs)
  const updateStatus = async (complaintId, newStatus) => {
    try {
      console.log(`Updating complaint ${complaintId} to ${newStatus}`);
      // In a real scenario, call: await axios.post("http://127.0.0.1:8000/update-status", { id: complaintId, status: newStatus });
      
      // Update local state for immediate feedback
      setComplaints(prev => prev.map(c => 
        (c.id === complaintId || c.complaint_number === complaintId) ? { ...c, status: newStatus } : c
      ));
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <ComplaintContext.Provider value={{ complaints, loading, addComplaint, updateStatus, fetchComplaints }}>
      {children}
    </ComplaintContext.Provider>
  );
}

export function useComplaints() {
  return useContext(ComplaintContext);
}