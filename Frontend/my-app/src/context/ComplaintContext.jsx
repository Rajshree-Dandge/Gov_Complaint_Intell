import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './AuthContext';

const ComplaintContext = createContext();

export function ComplaintProvider({ children }) {
  const { session, isGovernment } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchComplaints = useCallback(async () => {
    if (!session) { setComplaints([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('complaints')
      .select('*, complaint_history(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setComplaints(data.map(c => ({
        ...c,
        id: c.complaint_number,
        date: c.created_at?.split('T')[0],
        citizenName: c.citizen_name || c.citizen_email,
        imageUrl: c.image_url,
        history: (c.complaint_history || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(h => ({
          status: h.status,
          timestamp: h.created_at,
          note: h.note,
        })),
      })));
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const addComplaint = async (complaint) => {
    if (!session) return null;
    const seqRes = await supabase.rpc('nextval', { seq_name: 'complaint_number_seq' }).single();
    const num = seqRes.data || Math.floor(Math.random() * 9999);
    const complaintNumber = `GRV-${String(num).padStart(3, '0')}`;

    const { data, error } = await supabase
      .from('complaints')
      .insert({
        user_id: session.user.id,
        complaint_number: complaintNumber,
        citizen_email: session.user.email,
        citizen_name: complaint.citizenName || session.user.user_metadata?.name || '',
        phone: complaint.phone || '',
        description: complaint.description,
        category: complaint.category || 'Other',
        location: complaint.location,
        ward: complaint.ward || '',
        language: complaint.language || 'en',
        image_url: complaint.imageUrl || null,
        status: 'Pending',
        priority: 'Medium',
        sentiment: 'Neutral',
      })
      .select()
      .single();

    if (!error && data) {
      // Insert initial history
      await supabase.from('complaint_history').insert({
        complaint_id: data.id,
        status: 'Pending',
        note: 'Complaint registered',
      });

      // Trigger email notification
      try {
        await supabase.functions.invoke('send-notification', {
          body: { type: 'complaint_submitted', complaint_id: data.id },
        });
      } catch (e) { console.log('Email notification failed:', e); }

      await fetchComplaints();
      return data;
    }
    return null;
  };

  const updateStatus = async (complaintNumber, newStatus) => {
    const complaint = complaints.find(c => c.id === complaintNumber || c.complaint_number === complaintNumber);
    if (!complaint) return;

    const dbId = complaint.complaint_number === complaintNumber ? complaints.find(c => c.complaint_number === complaintNumber) : complaint;
    const realId = dbId?.id !== complaintNumber ? complaint.id : null;

    // Get the actual UUID
    const { data: found } = await supabase
      .from('complaints')
      .select('id')
      .eq('complaint_number', complaintNumber)
      .single();

    if (!found) return;

    await supabase
      .from('complaints')
      .update({ status: newStatus })
      .eq('id', found.id);

    await supabase.from('complaint_history').insert({
      complaint_id: found.id,
      status: newStatus,
      note: `Status changed to ${newStatus}`,
    });

    // Trigger email notification
    try {
      await supabase.functions.invoke('send-notification', {
        body: { type: 'status_update', complaint_id: found.id, new_status: newStatus },
      });
    } catch (e) { console.log('Email notification failed:', e); }

    await fetchComplaints();
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
