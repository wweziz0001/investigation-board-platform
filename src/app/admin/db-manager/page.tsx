'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  Database,
  Table2,
  Code,
  Upload,
  Download,
  Save,
  Clock,
  BarChart3,
  FileJson,
  Play,
  Plus,
  Search,
  Trash2,
  Check,
  AlertTriangle,
  RefreshCw,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Network,
  Activity,
  Key,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDatabaseStore } from '@/stores/database-store';

export default function DatabaseManagerPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { 
    tables, 
    connectionStatus, 
    isLoadingTables, 
    metrics,
    actions 
  } = useDatabaseStore();

  useEffect(() => {
    actions.checkConnection();
    actions.fetchTables();
    actions.fetchMetrics();
  }, [actions]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Database Management</h1>
              <p className="text-sm text-muted-foreground">
                Enterprise-grade database administration
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={connectionStatus === 'connected' ? 'default' : 'destructive'}
              className="gap-1"
            >
              {connectionStatus === 'connected' ? (
                <>
                  <Check className="h-3 w-3" /> Connected
                </>
              ) : (
                <>
                  <X className="h-3 w-3" /> Disconnected
                </>
              )}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                actions.checkConnection();
                actions.fetchTables();
                actions.fetchMetrics();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <div className="border-b px-6 overflow-x-auto">
          <TabsList className="h-12">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="tables" className="gap-2">
              <Table2 className="h-4 w-4" /> Tables
            </TabsTrigger>
            <TabsTrigger value="query" className="gap-2">
              <Code className="h-4 w-4" /> Query Editor
            </TabsTrigger>
            <TabsTrigger value="backup" className="gap-2">
              <Save className="h-4 w-4" /> Backup
            </TabsTrigger>
            <TabsTrigger value="monitor" className="gap-2">
              <Activity className="h-4 w-4" /> Monitor
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <TabsContent value="dashboard" className="h-full m-0 overflow-auto">
            <DashboardTab
              metrics={metrics}
              tables={tables}
              setActiveTab={setActiveTab}
            />
          </TabsContent>
          <TabsContent value="tables" className="h-full m-0">
            <TablesTab tables={tables} isLoading={isLoadingTables} />
          </TabsContent>
          <TabsContent value="query" className="h-full m-0">
            <QueryEditorTab />
          </TabsContent>
          <TabsContent value="backup" className="h-full m-0 overflow-auto">
            <BackupTab />
          </TabsContent>
          <TabsContent value="monitor" className="h-full m-0">
            <PerformanceMonitorTab metrics={metrics} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// Dashboard Tab
function DashboardTab({
  metrics,
  tables,
  setActiveTab,
}: {
  metrics: { totalTables?: number; totalRows?: number; totalSize?: number; queryCount?: number; avgQueryTime?: number } | null;
  tables: any[];
  setActiveTab: (tab: string) => void;
}) {
  const [tablePage, setTablePage] = useState(1);
  const tablesPerPage = 10;
  const totalPages = Math.ceil(tables.length / tablesPerPage);
  const paginatedTables = tables.slice(
    (tablePage - 1) * tablesPerPage,
    tablePage * tablesPerPage
  );

  // Safe metrics access with defaults
  const safeMetrics = {
    totalTables: metrics?.totalTables ?? 0,
    totalRows: metrics?.totalRows ?? 0,
    totalSize: metrics?.totalSize ?? 0,
    queryCount: metrics?.queryCount ?? 0,
    avgQueryTime: metrics?.avgQueryTime ?? 0,
  };

  return (
    <ScrollArea className="h-full p-6">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
              <Table2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {safeMetrics.totalTables || tables.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {tables.filter((t) => t.type === 'table').length} tables,{' '}
                {tables.filter((t) => t.type === 'view').length} views
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rows</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {safeMetrics.totalRows.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Across all tables</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Size</CardTitle>
              <FileJson className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {safeMetrics.totalSize
                  ? (safeMetrics.totalSize / 1024 / 1024).toFixed(2)
                  : '0'}{' '}
                MB
              </div>
              <p className="text-xs text-muted-foreground">Storage used</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Query Count</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeMetrics.queryCount}</div>
              <p className="text-xs text-muted-foreground">
                Avg: {safeMetrics.avgQueryTime.toFixed(2)}ms
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tables Overview</CardTitle>
              <Badge variant="outline">{tables.length} total</Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Rows</TableHead>
                    <TableHead>Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTables.map((table) => (
                    <TableRow key={table.name}>
                      <TableCell className="font-mono">{table.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            table.type === 'table' ? 'default' : 'secondary'
                          }
                        >
                          {table.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{table.rowCount?.toLocaleString()}</TableCell>
                      <TableCell>
                        {table.sizeBytes
                          ? (table.sizeBytes / 1024).toFixed(2)
                          : 0}{' '}
                        KB
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    Page {tablePage} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                      disabled={tablePage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setTablePage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={tablePage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setActiveTab('query')}
              >
                <Code className="h-4 w-4 mr-2" /> New Query
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setActiveTab('backup')}
              >
                <Save className="h-4 w-4 mr-2" /> Create Backup
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}

// Tables Tab
function TablesTab({
  tables,
  isLoading,
}: {
  tables: any[];
  isLoading: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [tableData, setTableData] = useState<any>({
    data: [],
    columns: [],
    loading: false,
  });

  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const loadTableData = async () => {
      if (!selectedTable) return;
      setTableData((prev: any) => ({ ...prev, loading: true }));
      try {
        const response = await fetch(
          `/api/admin/db/query`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: `SELECT * FROM ${selectedTable.name} LIMIT 50` }),
          }
        );
        const result = await response.json();
        if (result.success) {
          setTableData({
            data: result.data || [],
            columns: result.columns || [],
            loading: false,
          });
        } else {
          setTableData({ data: [], columns: [], loading: false });
        }
      } catch {
        toast.error('Failed to fetch table data');
        setTableData({ data: [], columns: [], loading: false });
      }
    };
    loadTableData();
  }, [selectedTable]);

  return (
    <div className="h-full flex">
      <div className="w-80 border-r flex flex-col shrink-0">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tables..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="p-2">
              {filteredTables.map((table) => (
                <button
                  key={table.name}
                  className={`w-full text-left p-3 rounded-lg hover:bg-accent transition-colors ${
                    selectedTable?.name === table.name ? 'bg-accent' : ''
                  }`}
                  onClick={() => setSelectedTable(table)}
                >
                  <div className="flex items-center gap-2">
                    <Table2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{table.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{table.rowCount?.toLocaleString()} rows</span>
                    <span>•</span>
                    <span>{table.columns?.length || 0} cols</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        {selectedTable ? (
          <>
            <div className="border-b p-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-semibold font-mono">
                  {selectedTable.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedTable.rowCount?.toLocaleString()} rows •{' '}
                  {selectedTable.columns?.length || 0} columns
                </p>
              </div>
            </div>
            <ScrollArea className="flex-1">
              {tableData.loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : tableData.data.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Table2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No data found</p>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {(tableData.columns || []).map((col: any) => (
                          <TableHead
                            key={col.name}
                            className="font-mono whitespace-nowrap"
                          >
                            {col.name}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(tableData.data || []).map((row: any, i: number) => (
                        <TableRow key={i}>
                          {(tableData.columns || []).map((col: any) => (
                            <TableCell
                              key={col.name}
                              className="font-mono text-sm max-w-xs truncate"
                            >
                              {String(row[col.name] ?? 'NULL')}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Table2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a table to view its data</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Query Editor Tab
function QueryEditorTab() {
  const [query, setQuery] = useState('SELECT * FROM User LIMIT 10;');
  const [result, setResult] = useState<any>(null);
  const [executing, setExecuting] = useState(false);

  const executeQuery = async () => {
    if (!query.trim()) {
      toast.error('Please enter a query');
      return;
    }
    setExecuting(true);
    try {
      const response = await fetch('/api/admin/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      setResult(data);
    } catch {
      toast.error('Query execution failed');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Query Input */}
      <div className="border-b p-4 shrink-0">
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter SQL query..."
          className="min-h-[120px] font-mono text-sm resize-none"
        />
        <div className="mt-3 flex gap-2">
          <Button onClick={executeQuery} disabled={executing}>
            {executing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Execute
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setQuery('');
              setResult(null);
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        {result ? (
          <div className="p-4">
            {result.success ? (
              <>
                <div className="text-sm text-muted-foreground mb-4 flex items-center gap-4">
                  <Badge>{result.rowCount} rows</Badge>
                  <Badge variant="outline">
                    {result.executionTime?.toFixed(2)}ms
                  </Badge>
                  {result.warning && (
                    <Badge variant="secondary">Warning: {result.warning}</Badge>
                  )}
                </div>
                {result.data && result.data.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          {result.columns?.map((col: any) => (
                            <TableHead
                              key={col.name}
                              className="font-mono whitespace-nowrap"
                            >
                              {col.name}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.data.slice(0, 500).map((row: any, i: number) => (
                          <TableRow key={i}>
                            {result.columns?.map((col: any) => (
                              <TableCell
                                key={col.name}
                                className="font-mono text-sm max-w-xs truncate"
                              >
                                {row[col.name] === null ? (
                                  <span className="text-muted-foreground italic">
                                    NULL
                                  </span>
                                ) : (
                                  String(row[col.name])
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No results
                  </div>
                )}
              </>
            ) : (
              <div className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {result.error}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Execute a query to see results</p>
              <p className="text-xs mt-1">Press Ctrl+Enter to execute</p>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// Backup Tab
function BackupTab() {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [backupName, setBackupName] = useState('');

  useEffect(() => {
    fetch('/api/admin/db/backup')
      .then((r) => r.json())
      .then((d) => d.success && setBackups(d.backups || []))
      .finally(() => setLoading(false));
  }, []);

  const createBackup = async () => {
    if (!backupName) {
      toast.error('Please enter a backup name');
      return;
    }
    try {
      const response = await fetch('/api/admin/db/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: backupName, type: 'full' }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Backup created');
        setBackupName('');
        setBackups([result.backup, ...backups]);
      } else {
        toast.error(result.error || 'Backup failed');
      }
    } catch {
      toast.error('Backup failed');
    }
  };

  return (
    <ScrollArea className="h-full p-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Backup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Backup name..."
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={createBackup}>
                <Save className="h-4 w-4 mr-2" />
                Create Backup
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Existing Backups</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No backups yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">{backup.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{backup.type}</Badge>
                      </TableCell>
                      <TableCell>{(backup.size / 1024).toFixed(2)} KB</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            backup.status === 'completed' ? 'default' : 'destructive'
                          }
                        >
                          {backup.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(backup.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}

// Performance Monitor Tab
function PerformanceMonitorTab({ metrics }: { metrics: { totalSize?: number; totalTables?: number; avgQueryTime?: number } | null }) {
  const safeMetrics = {
    totalSize: metrics?.totalSize ?? 0,
    totalTables: metrics?.totalTables ?? 0,
    avgQueryTime: metrics?.avgQueryTime ?? 0,
  };

  return (
    <ScrollArea className="h-full p-6">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Database Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {safeMetrics.totalSize
                  ? (safeMetrics.totalSize / 1024 / 1024).toFixed(2)
                  : '0'}{' '}
                MB
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeMetrics.totalTables}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Query Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {safeMetrics.avgQueryTime.toFixed(2)}ms
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Detailed performance monitoring coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
