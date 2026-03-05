'use client';

import * as React from 'react';
import {
  Table,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Plus,
  Search,
  Filter,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table as DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDatabaseStore, TableInfo } from '@/stores/database-store';
import { cn } from '@/lib/utils';

interface DataEditorProps {
  selectedTable?: string | null;
}

export function DataEditor({ selectedTable }: DataEditorProps) {
  const { tables, fetchTables, isLoadingTables, executeQuery, queryResult, isExecutingQuery } = useDatabaseStore();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [searchColumn, setSearchColumn] = React.useState('');
  const [searchValue, setSearchValue] = React.useState('');

  // Fetch tables on mount
  React.useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // Load table data when table is selected
  React.useEffect(() => {
    if (selectedTable) {
      const table = tables.find((t) => t.name === selectedTable || t.sqliteName === selectedTable);
      if (table) {
        const offset = (currentPage - 1) * pageSize;
        let sql = `SELECT * FROM "${table.sqliteName}"`;
        
        if (searchColumn && searchValue) {
          sql += ` WHERE "${searchColumn}" LIKE '%${searchValue}%'`;
        }
        
        sql += ` LIMIT ${pageSize} OFFSET ${offset}`;
        executeQuery(sql);
      }
    }
  }, [selectedTable, currentPage, pageSize, searchColumn, searchValue, tables, executeQuery]);

  const handleRefresh = () => {
    if (selectedTable) {
      const table = tables.find((t) => t.name === selectedTable || t.sqliteName === selectedTable);
      if (table) {
        executeQuery(`SELECT * FROM "${table.sqliteName}" LIMIT ${pageSize}`);
      }
    }
  };

  const totalPages = queryResult ? Math.ceil(queryResult.rowCount / pageSize) : 1;

  if (!selectedTable) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Table className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Table Selected</h3>
        <p className="text-muted-foreground">
          Select a table from the list to view and edit its data
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isExecutingQuery}
          >
            <RefreshCw className={cn('h-4 w-4 mr-1', isExecutingQuery && 'animate-spin')} />
            Refresh
          </Button>

          <div className="h-6 w-px bg-border mx-1" />

          <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(parseInt(v))}>
            <SelectTrigger className="w-[80px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {queryResult && (
            <Badge variant="outline">
              {queryResult.rowCount} rows
              {queryResult.truncated && ' (truncated)'}
            </Badge>
          )}
          <Badge variant="secondary">
            Page {currentPage} of {totalPages}
          </Badge>
        </div>
      </div>

      {/* Search Bar */}
      {queryResult && queryResult.columns.length > 0 && (
        <div className="flex items-center gap-2 border-b px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Select value={searchColumn} onValueChange={setSearchColumn}>
            <SelectTrigger className="w-[150px] h-8">
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent>
              {queryResult.columns.map((col) => (
                <SelectItem key={col.name} value={col.name}>
                  {col.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Search value..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="h-8 w-[200px]"
          />
          {searchColumn && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearchColumn('');
                setSearchValue('');
              }}
            >
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Data Table */}
      <div className="flex-1 overflow-hidden">
        {isExecutingQuery ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : queryResult && queryResult.rows.length > 0 ? (
          <ScrollArea className="h-full">
            <DataTable>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  {queryResult.columns.map((col) => (
                    <TableHead key={col.name} className="font-medium">
                      {col.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {queryResult.rows.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-muted-foreground">
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                    {queryResult.columns.map((col) => (
                      <TableCell key={col.name} className="max-w-[200px] truncate">
                        {formatCellValue(row[col.name])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No data found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t px-4 py-2">
        <div className="text-sm text-muted-foreground">
          {queryResult && `Execution time: ${queryResult.executionTime}ms`}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatCellValue(value: unknown): string {
  if (value === null) return 'NULL';
  if (value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
