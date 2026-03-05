'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  FolderKanban,
  Database,
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  FileText,
  Link2,
} from 'lucide-react';

interface DashboardStats {
  users: { total: number; active: number; admins: number };
  projects: { total: number; active: number; completed: number };
  events: { total: number; verified: number };
  relationships: number;
  database: { size: string; tables: number };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    users: { total: 0, active: 0, admins: 0 },
    projects: { total: 0, active: 0, completed: 0 },
    events: { total: 0, verified: 0 },
    relationships: 0,
    database: { size: '0 MB', tables: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch users
        const usersRes = await fetch('/api/users?limit=1000');
        const usersData = await usersRes.json();
        
        // Fetch projects
        const projectsRes = await fetch('/api/projects?limit=1000');
        const projectsData = await projectsRes.json();
        
        // Fetch database metrics
        const dbRes = await fetch('/api/admin/db/metrics');
        const dbData = await dbRes.json();

        setStats({
          users: {
            total: usersData.pagination?.total || usersData.users?.length || 0,
            active: usersData.users?.filter((u: { isActive: boolean }) => u.isActive).length || 0,
            admins: usersData.users?.filter((u: { role: string }) => u.role === 'ADMIN').length || 0,
          },
          projects: {
            total: projectsData.pagination?.total || projectsData.projects?.length || 0,
            active: projectsData.projects?.filter((p: { status: string }) => p.status === 'ACTIVE').length || 0,
            completed: projectsData.projects?.filter((p: { status: string }) => p.status === 'COMPLETED').length || 0,
          },
          events: {
            total: dbData.metrics?.totalEvents || 0,
            verified: dbData.metrics?.verifiedEvents || 0,
          },
          relationships: dbData.metrics?.totalRelationships || 0,
          database: {
            size: dbData.metrics?.totalSize ? `${(dbData.metrics.totalSize / 1024 / 1024).toFixed(2)} MB` : '0 MB',
            tables: dbData.metrics?.totalTables || 0,
          },
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your investigation platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.users.active} active, {stats.users.admins} admins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.projects.active} active, {stats.projects.completed} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.events.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.events.verified} verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connections</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.relationships}</div>
            <p className="text-xs text-muted-foreground">
              Event relationships
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>Current system health and metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database Status</span>
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Online
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database Size</span>
              <span className="text-sm font-medium">{stats.database.size}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Tables</span>
              <span className="text-sm font-medium">{stats.database.tables}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Storage Usage</span>
                <span>~{(parseFloat(stats.database.size) / 100 * 100).toFixed(1)}%</span>
              </div>
              <Progress value={25} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used admin operations</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <a href="/admin/users">
                <Users className="h-5 w-5" />
                <span>Manage Users</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <a href="/admin/projects">
                <FolderKanban className="h-5 w-5" />
                <span>View Projects</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <a href="/admin/db-manager">
                <Database className="h-5 w-5" />
                <span>Database Manager</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <a href="/admin/code-editor">
                <FileText className="h-5 w-5" />
                <span>Code Editor</span>
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 py-2 border-b last:border-0">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">System activity log</p>
                  <p className="text-xs text-muted-foreground">
                    Activity tracking coming soon...
                  </p>
                </div>
                <Badge variant="secondary">--</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
