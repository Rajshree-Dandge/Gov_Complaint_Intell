import { mockStatistics } from '../data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';

const COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6'];

export default function StatisticsPage() {
  const getDailyChartData = () => [
    { name: 'Total', value: mockStatistics.daily.total, fill: '#3b82f6' },
    { name: 'Pending', value: mockStatistics.daily.pending, fill: '#eab308' },
    { name: 'Resolved', value: mockStatistics.daily.resolved, fill: '#22c55e' },
    { name: 'Rejected', value: mockStatistics.daily.rejected, fill: '#ef4444' },
  ];

  const getWeeklyChartData = () => [
    { name: 'Total', value: mockStatistics.weekly.total, fill: '#3b82f6' },
    { name: 'Pending', value: mockStatistics.weekly.pending, fill: '#eab308' },
    { name: 'Resolved', value: mockStatistics.weekly.resolved, fill: '#22c55e' },
    { name: 'Rejected', value: mockStatistics.weekly.rejected, fill: '#ef4444' },
  ];

  const getYearlyChartData = () => [
    { name: 'Total', value: mockStatistics.yearly.total, fill: '#3b82f6' },
    { name: 'Pending', value: mockStatistics.yearly.pending, fill: '#eab308' },
    { name: 'Resolved', value: mockStatistics.yearly.resolved, fill: '#22c55e' },
    { name: 'Rejected', value: mockStatistics.yearly.rejected, fill: '#ef4444' },
  ];

  const getPieData = (stats) => [
    { name: 'Pending', value: stats.pending, color: '#eab308' },
    { name: 'Resolved', value: stats.resolved, color: '#22c55e' },
    { name: 'Rejected', value: stats.rejected, color: '#ef4444' },
  ];

  const StatCard = ({ title, value, icon: Icon, color, period }) => (
    <Card className={`border-l-4 ${color}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{period}</p>
          </div>
          <Icon className="h-10 w-10 opacity-20" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Complaint Statistics</h2>
          <p className="text-muted-foreground">
            View detailed analytics and trends for complaint management
          </p>
        </div>

        {/* Tabs for Different Time Periods */}
        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>

          {/* Daily Statistics */}
          <TabsContent value="daily" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Total Complaints"
                value={mockStatistics.daily.total}
                icon={Calendar}
                color="border-l-blue-500"
                period="Today"
              />
              <StatCard
                title="Pending"
                value={mockStatistics.daily.pending}
                icon={Clock}
                color="border-l-yellow-500"
                period="Awaiting Action"
              />
              <StatCard
                title="Resolved"
                value={mockStatistics.daily.resolved}
                icon={CheckCircle}
                color="border-l-green-500"
                period="Completed Today"
              />
              <StatCard
                title="Rejected"
                value={mockStatistics.daily.rejected}
                icon={XCircle}
                color="border-l-red-500"
                period="Not Actionable"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getDailyChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getPieData(mockStatistics.daily)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getPieData(mockStatistics.daily).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Weekly Statistics */}
          <TabsContent value="weekly" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Total Complaints"
                value={mockStatistics.weekly.total}
                icon={Calendar}
                color="border-l-blue-500"
                period="This Week"
              />
              <StatCard
                title="Pending"
                value={mockStatistics.weekly.pending}
                icon={Clock}
                color="border-l-yellow-500"
                period="Awaiting Action"
              />
              <StatCard
                title="Resolved"
                value={mockStatistics.weekly.resolved}
                icon={CheckCircle}
                color="border-l-green-500"
                period="Completed This Week"
              />
              <StatCard
                title="Rejected"
                value={mockStatistics.weekly.rejected}
                icon={XCircle}
                color="border-l-red-500"
                period="Not Actionable"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getWeeklyChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getPieData(mockStatistics.weekly)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getPieData(mockStatistics.weekly).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Yearly Statistics */}
          <TabsContent value="yearly" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Total Complaints"
                value={mockStatistics.yearly.total}
                icon={TrendingUp}
                color="border-l-blue-500"
                period="This Year"
              />
              <StatCard
                title="Pending"
                value={mockStatistics.yearly.pending}
                icon={Clock}
                color="border-l-yellow-500"
                period="Awaiting Action"
              />
              <StatCard
                title="Resolved"
                value={mockStatistics.yearly.resolved}
                icon={CheckCircle}
                color="border-l-green-500"
                period="Completed This Year"
              />
              <StatCard
                title="Rejected"
                value={mockStatistics.yearly.rejected}
                icon={XCircle}
                color="border-l-red-500"
                period="Not Actionable"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Yearly Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getYearlyChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getPieData(mockStatistics.yearly)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getPieData(mockStatistics.yearly).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
