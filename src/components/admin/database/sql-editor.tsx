'use client';

import * as React from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { Play, Save, Trash2, Copy, Download, Upload, History, Bookmark } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDatabaseStore } from '@/stores/database-store';

interface SqlEditorProps {
  onExecute?: (sql: string) => void;
  onSave?: (name: string, description: string) => void;
  readOnly?: boolean;
}

export function SqlEditor({ onExecute, onSave, readOnly = false }: SqlEditorProps) {
  const {
    currentQuery,
    setCurrentQuery,
    queryHistory,
    executeQuery,
    isExecutingQuery,
    savedQueries,
  } = useDatabaseStore();

  const editorRef = React.useRef<Parameters<OnMount>[0] | null>(null);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleEditorChange: OnChange = (value) => {
    if (value !== undefined) {
      setCurrentQuery(value);
    }
  };

  const handleExecute = () => {
    if (currentQuery.trim()) {
      executeQuery(currentQuery);
      onExecute?.(currentQuery);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentQuery);
  };

  const handleClear = () => {
    setCurrentQuery('');
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  const handleHistorySelect = (sql: string) => {
    setCurrentQuery(sql);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={handleExecute}
                  disabled={isExecutingQuery || !currentQuery.trim()}
                >
                  <Play className="h-4 w-4 mr-1" />
                  {isExecutingQuery ? 'Running...' : 'Run'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Execute query (Ctrl+Enter)</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={handleFormat}>
                  Format
                </Button>
              </TooltipTrigger>
              <TooltipContent>Format SQL (Shift+Alt+F)</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="h-6 w-px bg-border mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy query</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" onClick={handleClear}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear editor</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            SQL
          </Badge>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="sql"
          value={currentQuery}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          theme="vs"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            readOnly,
            padding: { top: 10, bottom: 10 },
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
          }}
        />
      </div>

      {/* History Panel */}
      {queryHistory.length > 0 && (
        <div className="border-t">
          <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
            <div className="flex items-center gap-2 text-sm font-medium">
              <History className="h-4 w-4" />
              Query History
            </div>
            <Badge variant="secondary" className="text-xs">
              {queryHistory.length} queries
            </Badge>
          </div>
          <ScrollArea className="h-32">
            <div className="p-2 space-y-1">
              {queryHistory.slice(0, 10).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleHistorySelect(item.sql)}
                  className="w-full text-left p-2 rounded-md hover:bg-muted text-xs font-mono truncate"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={item.status === 'success' ? 'default' : 'destructive'}
                      className="text-[10px] px-1"
                    >
                      {item.status}
                    </Badge>
                    <span className="truncate flex-1">{item.sql}</span>
                    <span className="text-muted-foreground shrink-0">
                      {item.executionTime}ms
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
