import React, { createContext, useContext, useState } from 'react';

const ComplaintContext = createContext();

const now = () => new Date().toISOString();

const initialComplaints = [
  {
    id: 'GRV-001',
    citizenName: 'Ramesh Kumar',
    description: 'Large pothole on MG Road near sector 5 junction causing accidents daily.',
    category: 'Roads',
    location: 'MG Road, Sector 5',
    ward: 'Ward 12',
    status: 'Pending',
    priority: 'High',
    date: '2026-02-01',
    imageUrl: null,
    sentiment: 'Angry',
    history: [{ status: 'Pending', timestamp: '2026-02-01T09:00:00Z', note: 'Complaint registered' }],
  },
  {
    id: 'GRV-002',
    citizenName: 'Sunita Devi',
    description: 'Garbage not collected from colony for 5 days. Terrible smell spreading.',
    category: 'Sanitation',
    location: 'Green Park Colony',
    ward: 'Ward 7',
    status: 'In Progress',
    priority: 'Medium',
    date: '2026-02-03',
    imageUrl: null,
    sentiment: 'Frustrated',
    history: [
      { status: 'Pending', timestamp: '2026-02-03T10:00:00Z', note: 'Complaint registered' },
      { status: 'In Progress', timestamp: '2026-02-05T14:30:00Z', note: 'Assigned to sanitation team' },
    ],
  },
  {
    id: 'GRV-003',
    citizenName: 'Ahmed Khan',
    description: 'Street light broken on Station Road. Very unsafe at night.',
    category: 'Electrical',
    location: 'Station Road',
    ward: 'Ward 3',
    status: 'Resolved',
    priority: 'Medium',
    date: '2026-01-20',
    imageUrl: null,
    sentiment: 'Concerned',
    history: [
      { status: 'Pending', timestamp: '2026-01-20T08:00:00Z', note: 'Complaint registered' },
      { status: 'In Progress', timestamp: '2026-01-22T11:00:00Z', note: 'Electrician dispatched' },
      { status: 'Resolved', timestamp: '2026-01-25T16:00:00Z', note: 'Street light replaced' },
    ],
  },
  {
    id: 'GRV-004',
    citizenName: 'Priya Sharma',
    description: 'Water pipeline leaking near main market. Water wastage for 3 days.',
    category: 'Water Supply',
    location: 'Main Market, Block A',
    ward: 'Ward 12',
    status: 'Pending',
    priority: 'Urgent',
    date: '2026-02-10',
    imageUrl: null,
    sentiment: 'Angry',
    history: [{ status: 'Pending', timestamp: '2026-02-10T07:30:00Z', note: 'Complaint registered' }],
  },
  {
    id: 'GRV-005',
    citizenName: 'Vikram Singh',
    description: 'Open drain overflowing near school. Health hazard for children.',
    category: 'Drainage',
    location: 'Govt. School Road, Sector 9',
    ward: 'Ward 5',
    status: 'Pending',
    priority: 'Urgent',
    date: '2026-02-11',
    imageUrl: null,
    sentiment: 'Angry',
    history: [{ status: 'Pending', timestamp: '2026-02-11T06:45:00Z', note: 'Complaint registered' }],
  },
  {
    id: 'GRV-006',
    citizenName: 'Meena Patel',
    description: 'Park bench broken and playground equipment rusted.',
    category: 'Parks',
    location: 'Central Park, Sector 2',
    ward: 'Ward 1',
    status: 'In Progress',
    priority: 'Low',
    date: '2026-01-28',
    imageUrl: null,
    sentiment: 'Neutral',
    history: [
      { status: 'Pending', timestamp: '2026-01-28T12:00:00Z', note: 'Complaint registered' },
      { status: 'In Progress', timestamp: '2026-02-01T09:00:00Z', note: 'Maintenance crew assigned' },
    ],
  },
];

export function ComplaintProvider({ children }) {
  const [complaints, setComplaints] = useState(initialComplaints);

  const addComplaint = (complaint) => {
    const newComplaint = {
      ...complaint,
      id: `GRV-${String(complaints.length + 1).padStart(3, '0')}`,
      status: 'Pending',
      priority: 'Medium',
      date: new Date().toISOString().split('T')[0],
      sentiment: 'Neutral',
      history: [{ status: 'Pending', timestamp: now(), note: 'Complaint registered' }],
    };
    setComplaints((prev) => [newComplaint, ...prev]);
  };

  const updateStatus = (id, newStatus) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: newStatus,
              history: [
                ...(c.history || []),
                { status: newStatus, timestamp: now(), note: `Status changed to ${newStatus}` },
              ],
            }
          : c
      )
    );
  };

  return (
    <ComplaintContext.Provider value={{ complaints, addComplaint, updateStatus }}>
      {children}
    </ComplaintContext.Provider>
  );
}

export function useComplaints() {
  return useContext(ComplaintContext);
}
