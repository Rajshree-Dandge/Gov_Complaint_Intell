import { Link } from "react-router";
import {
  Map,
  Users,
  BarChart3,
  Mail,
  FileText,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card.jsx";
import { mockStatistics } from "../data/mockData.js";

const actionButtons = [
  {
    id: "visualization",
    title: "Visualization",
    description: "View complaints on interactive map",
    icon: Map,
    path: "/visualization",
    color: "bg-emerald-500 hover:bg-emerald-600",
  },
  {
    id: "officers",
    title: "Desk Officers",
    description: "Manage officers and assignments",
    icon: Users,
    path: "/officers",
    color: "bg-teal-500 hover:bg-teal-600",
  },
  {
    id: "statistics",
    title: "Statistics",
    description: "View complaint analytics",
    icon: BarChart3,
    path: "/statistics",
    color: "bg-green-500 hover:bg-green-600",
  },
  {
    id: "email",
    title: "Send Email",
    description: "Communicate with citizens",
    icon: Mail,
    path: "/email",
    color: "bg-lime-600 hover:bg-lime-700",
  },
];

export function Dashboard() {
  const stats = mockStatistics.daily;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard Overview
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Manage citizen complaints and coordinate with your
            team
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Today
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {stats.total}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Pending
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.pending}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Resolved
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.resolved}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Rejected
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.rejected}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {actionButtons.map((button) => {
            const Icon = button.icon;
            return (
              <Link
                key={button.id}
                to={button.path}
                data-tutorial={button.id}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 hover:border-primary">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <div
                        className={`${button.color} text-white p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="h-8 w-8" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                        {button.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {button.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Additional Info */}
        <Card className="mt-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-1">
                  Need Help?
                </h3>
                <p className="text-green-100">
                  Click on any card above to navigate to the
                  respective section
                </p>
              </div>
              <FileText className="h-12 w-12 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}