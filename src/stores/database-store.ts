import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface TableInfo {
  name: string;
  sqliteName: string;
  type: string;
  rowCount: number;
  sizeBytes: number;
  sizeFormatted: string;
  columns?: ColumnInfo[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  primaryKey: boolean;
}

export interface QueryResult {
  success: boolean;
  data: Record<string, unknown>[];
  rows: Record<string, unknown>[];
  columns: { name: string; type: string }[];
  rowCount: number;
  executionTime: number;
  affectedRows?: number;
  warning?: string;
  error?: string;
  truncated?: boolean;
}

export interface SavedQuery {
  id: string;
  name: string;
  description?: string;
  query: string;
  tags: string[];
  createdAt: string;
  lastUsed?: string;
  useCount: number;
  isFavorite: boolean;
}

export interface QueryHistoryItem {
  id: string;
  sql: string;
  query: string;
  status: 'success' | 'error';
  executionTime: number;
  timestamp: string;
}

export interface QueryTab {
  id: string;
  name: string;
  query: string;
  result?: QueryResult;
  isSaved: boolean;
}

export interface DatabaseMetrics {
  totalTables: number;
  totalRows: number;
  totalSize: number;
  queryCount: number;
  avgQueryTime: number;
}

export interface DatabaseState {
  tables: TableInfo[];
  savedQueries: SavedQuery[];
  queryHistory: QueryHistoryItem[];
  tabs: QueryTab[];
  activeTabId: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'checking';
  isLoadingTables: boolean;
  isExecuting: boolean;
  isExecutingQuery: boolean;
  currentQuery: string;
  queryResult: QueryResult | null;
  actions: string[];
  metrics: DatabaseMetrics;
}

export interface DatabaseActions {
  // Tables
  fetchTables: () => Promise<void>;
  
  // Queries
  executeQuery: (query: string, tabId?: string) => Promise<QueryResult>;
  fetchSavedQueries: () => Promise<void>;
  saveQuery: (name: string, query: string, description?: string) => Promise<void>;
  deleteSavedQuery: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  setCurrentQuery: (query: string) => void;
  
  // Tabs
  createTab: () => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabQuery: (id: string, query: string) => void;
  
  // History
  addToHistory: (query: string, status: 'success' | 'error', executionTime: number) => void;
  clearHistory: () => void;
  
  // Connection
  checkConnection: () => Promise<void>;
  
  // Metrics
  fetchMetrics: () => Promise<void>;
  
  // Reset
  reset: () => void;
}

const generateTabId = () => `tab-${Date.now()}`;

const initialState: DatabaseState = {
  tables: [],
  savedQueries: [],
  queryHistory: [],
  tabs: [{ id: 'tab-1', name: 'Query 1', query: '', isSaved: false }],
  activeTabId: 'tab-1',
  connectionStatus: 'checking',
  isLoadingTables: false,
  isExecuting: false,
  isExecutingQuery: false,
  currentQuery: '',
  queryResult: null,
  actions: [],
  metrics: {
    totalTables: 0,
    totalRows: 0,
    totalSize: 0,
    queryCount: 0,
    avgQueryTime: 0,
  },
};

export const useDatabaseStore = create<DatabaseState & DatabaseActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Tables
      fetchTables: async () => {
        set({ isLoadingTables: true });
        try {
          const response = await fetch('/api/admin/db/tables');
          const data = await response.json();
          if (data.success) {
            set({ tables: data.tables || [] });
          }
        } catch (error) {
          console.error('Failed to fetch tables:', error);
        } finally {
          set({ isLoadingTables: false });
        }
      },

      // Queries
      setCurrentQuery: (query) => set({ currentQuery: query }),

      executeQuery: async (query, tabId) => {
        set({ isExecuting: true, isExecutingQuery: true });
        const startTime = Date.now();
        
        try {
          const response = await fetch('/api/admin/db/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
          });
          const result = await response.json();
          
          const executionTime = Date.now() - startTime;
          
          // Add to history
          get().addToHistory(
            query,
            result.success ? 'success' : 'error',
            executionTime
          );
          
          // Update tab result
          if (tabId) {
            set((state) => ({
              tabs: state.tabs.map((tab) =>
                tab.id === tabId ? { ...tab, result } : tab
              ),
            }));
          }
          
          set({ isExecuting: false, isExecutingQuery: false, queryResult: result });
          return result;
        } catch (error) {
          set({ isExecuting: false, isExecutingQuery: false });
          return {
            success: false,
            data: [],
            columns: [],
            rowCount: 0,
            executionTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Query failed',
          };
        }
      },

      fetchSavedQueries: async () => {
        try {
          const response = await fetch('/api/admin/db/saved-queries');
          const data = await response.json();
          if (data.success) {
            set({ savedQueries: data.queries || [] });
          }
        } catch (error) {
          console.error('Failed to fetch saved queries:', error);
        }
      },

      saveQuery: async (name, query, description) => {
        try {
          const response = await fetch('/api/admin/db/saved-queries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, query, description }),
          });
          const data = await response.json();
          if (data.success) {
            set((state) => ({
              savedQueries: [...state.savedQueries, data.query],
            }));
          }
        } catch (error) {
          console.error('Failed to save query:', error);
        }
      },

      deleteSavedQuery: async (id) => {
        try {
          await fetch(`/api/admin/db/saved-queries/${id}`, { method: 'DELETE' });
          set((state) => ({
            savedQueries: state.savedQueries.filter((q) => q.id !== id),
          }));
        } catch (error) {
          console.error('Failed to delete saved query:', error);
        }
      },

      toggleFavorite: async (id) => {
        const query = get().savedQueries.find((q) => q.id === id);
        if (!query) return;
        
        set((state) => ({
          savedQueries: state.savedQueries.map((q) =>
            q.id === id ? { ...q, isFavorite: !q.isFavorite } : q
          ),
        }));
      },

      // Tabs
      createTab: () => {
        const id = generateTabId();
        const tabNumber = get().tabs.length + 1;
        set((state) => ({
          tabs: [
            ...state.tabs,
            { id, name: `Query ${tabNumber}`, query: '', isSaved: false },
          ],
          activeTabId: id,
        }));
      },

      closeTab: (id) => {
        const state = get();
        if (state.tabs.length <= 1) return;
        
        const tabIndex = state.tabs.findIndex((t) => t.id === id);
        const newTabs = state.tabs.filter((t) => t.id !== id);
        
        let newActiveId = state.activeTabId;
        if (state.activeTabId === id) {
          newActiveId = newTabs[Math.min(tabIndex, newTabs.length - 1)].id;
        }
        
        set({ tabs: newTabs, activeTabId: newActiveId });
      },

      setActiveTab: (id) => set({ activeTabId: id }),

      updateTabQuery: (id, query) => {
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === id ? { ...tab, query, isSaved: false } : tab
          ),
        }));
      },

      // History
      addToHistory: (query, status, executionTime) => {
        const item: QueryHistoryItem = {
          id: `history-${Date.now()}`,
          sql: query,
          query,
          status,
          executionTime,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          queryHistory: [item, ...state.queryHistory].slice(0, 100),
        }));
      },

      clearHistory: () => set({ queryHistory: [] }),

      // Connection
      checkConnection: async () => {
        set({ connectionStatus: 'checking' });
        try {
          const response = await fetch('/api/admin/db/tables');
          const data = await response.json();
          set({ connectionStatus: data.success ? 'connected' : 'disconnected' });
        } catch {
          set({ connectionStatus: 'disconnected' });
        }
      },

      // Metrics
      fetchMetrics: async () => {
        try {
          const response = await fetch('/api/admin/db/metrics');
          const data = await response.json();
          if (data.success) {
            set({ metrics: data.metrics });
          }
        } catch (error) {
          console.error('Failed to fetch metrics:', error);
        }
      },

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'database-manager-storage',
      partialize: (state) => ({
        savedQueries: state.savedQueries,
        queryHistory: state.queryHistory,
      }),
    }
  )
);
