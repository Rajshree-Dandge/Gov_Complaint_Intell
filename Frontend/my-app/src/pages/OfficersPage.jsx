import { useState } from 'react';
import { mockOfficers } from '../data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Mail, Phone, FileText, CheckCircle, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

export default function OfficersPage() {
  const { generatedReports, selectedReport, setSelectedReport } = useApp();
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const handleAllocateReport = (officerId) => {
    if (!selectedReport) {
      toast.error('Please generate a report from the visualization page first');
      return;
    }

    setSelectedOfficer(officerId);
    setShowReportDialog(true);
  };

  const handleSendReport = () => {
    const officer = mockOfficers.find(o => o.id === selectedOfficer);
    toast.success(`Report allocated to ${officer?.name} successfully!`);
    setShowReportDialog(false);
    setSelectedReport(null);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Desk Officers</h2>
          <p className="text-muted-foreground">
            Manage officers working under you and allocate complaints
          </p>
        </div>

        {/* Reports Status */}
        {generatedReports.length > 0 && (
          <Card className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">
                      {generatedReports.length} Report(s) Generated
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click "Allocate Report" on any officer card to assign
                    </p>
                  </div>
                </div>
                {selectedReport && (
                  <Badge className="bg-primary">
                    Report Selected: {selectedReport.complaint.id}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Officers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockOfficers.map((officer) => (
            <Card key={officer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 border-4 border-primary/20">
                    <AvatarImage src={officer.avatar} alt={officer.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {officer.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{officer.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{officer.designation}</p>
                    <Badge variant="outline" className="mt-1">
                      {officer.role}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground truncate">{officer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{officer.phone}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {officer.assignedComplaints}
                    </p>
                    <p className="text-xs text-muted-foreground">Assigned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {officer.resolvedComplaints}
                    </p>
                    <p className="text-xs text-muted-foreground">Resolved</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-4">
                  <Button
                    onClick={() => {
                      if (generatedReports.length > 0) {
                        if (!selectedReport) {
                          setSelectedReport(generatedReports[0]);
                        }
                        handleAllocateReport(officer.id);
                      } else {
                        toast.error('No reports available. Generate a report first.');
                      }
                    }}
                    disabled={generatedReports.length === 0}
                    className="w-full"
                    variant={generatedReports.length > 0 ? "default" : "secondary"}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Allocate Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Report Allocation Dialog */}
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Allocate Report to Officer</DialogTitle>
              <DialogDescription>
                Review the report details before sending to the officer
              </DialogDescription>
            </DialogHeader>

            {selectedReport && selectedOfficer && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Officer Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={mockOfficers.find(o => o.id === selectedOfficer)?.avatar} />
                        <AvatarFallback>
                          {mockOfficers.find(o => o.id === selectedOfficer)?.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">
                          {mockOfficers.find(o => o.id === selectedOfficer)?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {mockOfficers.find(o => o.id === selectedOfficer)?.designation}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Report Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Complaint ID</p>
                        <p className="font-semibold">{selectedReport.complaint.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Location</p>
                        <p className="font-semibold">{selectedReport.complaint.location.address}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Type</p>
                        <p className="font-semibold">{selectedReport.complaint.type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Category</p>
                        <p className="font-semibold">{selectedReport.complaint.category}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Severity</p>
                        <Badge className={
                          selectedReport.complaint.severity === 'Critical' ? 'bg-red-500' :
                          selectedReport.complaint.severity === 'High' ? 'bg-orange-500' :
                          selectedReport.complaint.severity === 'Medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }>
                          {selectedReport.complaint.severity}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Affected Citizens</p>
                        <p className="font-semibold">{selectedReport.complaint.numberOfComplaints}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendReport}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Report
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
