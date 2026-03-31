import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, MapPin, Calendar, User, AlertCircle, Users } from 'lucide-react';
import { Button } from './ui2/button';
import { Badge } from './ui2/badge';
import { useApp } from '../context/AppContext.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui2/card';
import { Separator } from './ui2/separator';
import { toast } from 'sonner';

export function ComplaintSidebar() {
  const { 
    selectedComplaint, 
    setSelectedComplaint, 
    viewedComplaints,
    generateReport,
    generatedReports
  } = useApp();

  if (!selectedComplaint) return null;

  const hasBeenViewed = viewedComplaints.has(selectedComplaint.id);
  const hasGeneratedReport = generatedReports.some(r => r.complaintId === selectedComplaint.id);

  const handleUpdateStatus = () => {
    toast.success('Status updated successfully!');
  };

  const handleGenerateReport = () => {
    generateReport(selectedComplaint);
    toast.success('Report generated successfully! You can now allocate it to officers.');
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-96 bg-white dark:bg-gray-800 shadow-2xl overflow-y-auto border-l border-gray-200 dark:border-gray-700"
      >
        <div className="sticky top-0 bg-primary text-primary-foreground p-4 flex items-center justify-between z-10">
          <h3 className="font-semibold">Complaint Details</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedComplaint(null)}
            className="hover:bg-primary-foreground/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Title and ID */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-xl font-bold">{selectedComplaint.title}</h2>
              <Badge variant="outline" className="ml-2">{selectedComplaint.id}</Badge>
            </div>
            <div className="flex gap-2">
              <Badge className={getSeverityColor(selectedComplaint.severity)}>
                {selectedComplaint.severity}
              </Badge>
              <Badge className={getStatusColor(selectedComplaint.status)}>
                {selectedComplaint.status}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedComplaint.description}
              </p>
            </CardContent>
          </Card>

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Location</p>
                    <p className="text-sm font-medium">{selectedComplaint.location.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Submitted Date</p>
                    <p className="text-sm font-medium">
                      {new Date(selectedComplaint.submittedDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Submitted By</p>
                    <p className="text-sm font-medium">{selectedComplaint.submittedBy}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Category</p>
                    <p className="text-sm font-medium">{selectedComplaint.category}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Number of Complaints</p>
                    <p className="text-sm font-medium">
                      {selectedComplaint.numberOfComplaints} citizens affected
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Complaint Image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Attached Image</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={selectedComplaint.imageUrl}
                alt={selectedComplaint.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3 sticky bottom-0 bg-white dark:bg-gray-800 pt-4 pb-2">
            <Button
              onClick={handleUpdateStatus}
              disabled={!hasBeenViewed}
              className="w-full"
              variant={hasBeenViewed ? "default" : "secondary"}
            >
              Update Status
            </Button>
            {!hasBeenViewed && (
              <p className="text-xs text-center text-muted-foreground">
                Button will be enabled after viewing twice
              </p>
            )}

            <Button
              onClick={handleGenerateReport}
              disabled={hasGeneratedReport}
              className="w-full"
              variant="outline"
            >
              {hasGeneratedReport ? 'Report Generated' : 'Generate Report'}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}