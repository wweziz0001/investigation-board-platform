'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  FolderOpen,
  File,
  FileCode,
  FileJson,
  FileText,
  FilePlus,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Save,
  RefreshCw,
  Search,
  X,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

// File type icons
const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileCode className="h-4 w-4 text-blue-500" />;
    case 'js':
    case 'jsx':
      return <FileCode className="h-4 w-4 text-yellow-500" />;
    case 'json':
      return <FileJson className="h-4 w-4 text-green-500" />;
    case 'md':
      return <FileText className="h-4 w-4 text-gray-500" />;
    case 'css':
    case 'scss':
      return <FileText className="h-4 w-4 text-purple-500" />;
    case 'prisma':
      return <FileCode className="h-4 w-4 text-cyan-500" />;
    default:
      return <File className="h-4 w-4 text-gray-400" />;
  }
};

// Get language from file extension
const getLanguage = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'css':
    case 'scss':
      return 'css';
    case 'html':
      return 'html';
    case 'prisma':
      return 'prisma';
    case 'sql':
      return 'sql';
    default:
      return 'plaintext';
  }
};

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileItem[];
}

interface EditorTab {
  id: string;
  path: string;
  name: string;
  content: string;
  isModified: boolean;
}

// Mock file structure - in real app, this would come from the server
const mockFileStructure: FileItem[] = [
  {
    name: 'src',
    path: '/src',
    type: 'folder',
    children: [
      {
        name: 'app',
        path: '/src/app',
        type: 'folder',
        children: [
          { name: 'page.tsx', path: '/src/app/page.tsx', type: 'file' },
          { name: 'layout.tsx', path: '/src/app/layout.tsx', type: 'file' },
          { name: 'globals.css', path: '/src/app/globals.css', type: 'file' },
        ],
      },
      {
        name: 'components',
        path: '/src/components',
        type: 'folder',
        children: [
          { name: 'ui', path: '/src/components/ui', type: 'folder' },
          { name: 'board', path: '/src/components/board', type: 'folder' },
          { name: 'admin', path: '/src/components/admin', type: 'folder' },
        ],
      },
      {
        name: 'lib',
        path: '/src/lib',
        type: 'folder',
        children: [
          { name: 'db.ts', path: '/src/lib/db.ts', type: 'file' },
          { name: 'auth.ts', path: '/src/lib/auth.ts', type: 'file' },
          { name: 'utils.ts', path: '/src/lib/utils.ts', type: 'file' },
        ],
      },
      {
        name: 'stores',
        path: '/src/stores',
        type: 'folder',
        children: [
          { name: 'auth-store.ts', path: '/src/stores/auth-store.ts', type: 'file' },
          { name: 'project-store.ts', path: '/src/stores/project-store.ts', type: 'file' },
        ],
      },
    ],
  },
  {
    name: 'prisma',
    path: '/prisma',
    type: 'folder',
    children: [{ name: 'schema.prisma', path: '/prisma/schema.prisma', type: 'file' }],
  },
];

export default function CodeEditorPage() {
  const [files, setFiles] = useState<FileItem[]>(mockFileStructure);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/src']));
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Open file in new tab
  const openFile = async (file: FileItem) => {
    const existingTab = tabs.find((t) => t.path === file.path);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    // In real app, fetch file content from server
    const mockContent = `// File: ${file.path}\n// Content would be loaded from server\n\nexport default function Example() {\n  return <div>Example</div>;\n}`;

    const newTab: EditorTab = {
      id: `tab-${Date.now()}`,
      path: file.path,
      name: file.name,
      content: mockContent,
      isModified: false,
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  // Close tab
  const closeTab = (tabId: string) => {
    setTabs((prev) => {
      const newTabs = prev.filter((t) => t.id !== tabId);
      if (activeTabId === tabId && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
      }
      return newTabs;
    });
  };

  // Update tab content
  const updateTabContent = (content: string) => {
    if (!activeTabId) return;
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, content, isModified: true } : t
      )
    );
  };

  // Save file
  const saveFile = async () => {
    if (!activeTab) return;
    setIsSaving(true);
    try {
      // In real app, save to server
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId ? { ...t, isModified: false } : t
        )
      );
      toast.success('File saved');
    } catch {
      toast.error('Failed to save file');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle editor mount
  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.updateOptions({
      minimap: { enabled: true },
      fontSize: 14,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
    });
  };

  // Render file tree
  const renderFileTree = (items: FileItem[], depth = 0) => {
    return items.map((item) => {
      const isExpanded = expandedFolders.has(item.path);
      const isFolder = item.type === 'folder';

      return (
        <div key={item.path}>
          <button
            className="flex items-center gap-2 w-full px-2 py-1 hover:bg-accent rounded text-sm text-left"
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => {
              if (isFolder) {
                toggleFolder(item.path);
              } else {
                openFile(item);
              }
            }}
          >
            {isFolder && (
              <span className="w-4 h-4 flex items-center justify-center">
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </span>
            )}
            {!isFolder && <span className="w-4" />}
            {isFolder ? (
              <FolderOpen className="h-4 w-4 text-amber-500" />
            ) : (
              getFileIcon(item.name)
            )}
            <span className="truncate">{item.name}</span>
          </button>
          {isFolder && isExpanded && item.children && (
            <div>{renderFileTree(item.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b px-4 py-2 flex items-center justify-between bg-background">
        <div className="flex items-center gap-2">
          <FileCode className="h-5 w-5 text-primary" />
          <h1 className="font-semibold">Code Editor</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={saveFile} disabled={!activeTab || isSaving}>
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal">
          {/* File explorer */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full flex flex-col border-r">
              <div className="p-2 border-b flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-7 h-7 text-xs"
                  />
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <FilePlus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-1">{renderFileTree(files)}</div>
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Editor area */}
          <ResizablePanel defaultSize={80}>
            <div className="h-full flex flex-col">
              {/* Tabs */}
              <div className="border-b flex items-center overflow-x-auto bg-muted/30">
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    className={`flex items-center gap-2 px-3 py-2 border-r cursor-pointer transition-colors ${
                      activeTabId === tab.id
                        ? 'bg-background border-b-2 border-b-primary'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setActiveTabId(tab.id)}
                  >
                    {getFileIcon(tab.name)}
                    <span className="text-sm truncate max-w-[120px]">{tab.name}</span>
                    {tab.isModified && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                    <button
                      className="hover:bg-muted rounded p-0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Editor */}
              <div className="flex-1">
                {activeTab ? (
                  <Editor
                    height="100%"
                    language={getLanguage(activeTab.name)}
                    value={activeTab.content}
                    onChange={(value) => updateTabContent(value || '')}
                    onMount={handleEditorMount}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: true },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a file to edit</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

// Add missing import
import { useRef } from 'react';
