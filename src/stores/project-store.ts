import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Event Types
export type EventType = 
  | 'GENERAL'
  | 'INCIDENT'
  | 'EVIDENCE'
  | 'SUSPECT'
  | 'WITNESS'
  | 'LOCATION'
  | 'TIMELINE'
  | 'DOCUMENT'
  | 'COMMUNICATION'
  | 'FINANCIAL'
  | 'TRAVEL'
  | 'MEETING'
  | 'CUSTOM';

// Event Status
export type EventStatus = 
  | 'NEW'
  | 'INVESTIGATING'
  | 'VERIFIED'
  | 'DISPUTED'
  | 'DISMISSED'
  | 'ARCHIVED';

// Types
export interface EventNode {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  eventDate?: string;
  eventTime?: string;
  location?: string;
  eventType: string;
  status: string;
  confidence: number;
  importance: number;
  verified: boolean;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  zIndex: number;
  isExpanded: boolean;
  isLocked: boolean;
  color?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RelationshipEdge {
  id: string;
  projectId: string;
  sourceEventId: string;
  targetEventId: string;
  relationType: string;
  label?: string;
  description?: string;
  strength: number;
  confidence: number;
  color?: string;
  lineStyle: string;
  lineWidth: number;
  isAnimated: boolean;
  isCurved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Cluster {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  color: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  isCollapsed: boolean;
  eventIds: string[];
}

export interface ProjectState {
  projectId: string | null;
  project: {
    id: string;
    name: string;
    description?: string;
    status: string;
    priority: string;
    boardViewport?: string;
    boardSettings?: string;
  } | null;
  events: EventNode[];
  relationships: RelationshipEdge[];
  clusters: Cluster[];
  selectedEventIds: string[];
  selectedRelationshipIds: string[];
  hoveredEventId: string | null;
  searchQuery: string;
  filters: {
    eventTypes: string[];
    statuses: string[];
    dateRange: { start?: string; end?: string };
    tags: string[];
  };
  boardSettings: {
    showGrid: boolean;
    snapToGrid: boolean;
    gridSize: number;
    showMinimap: boolean;
    showControls: boolean;
    showLabels: boolean;
    theme: 'light' | 'dark';
  };
  filterState: {
    eventType: EventType | 'ALL';
    status: EventStatus | 'ALL';
    searchQuery: string;
    dateRange: { from?: string; to?: string };
    showUnverified: boolean;
    showVerified: boolean;
    showDisputed: boolean;
    minConfidence: number;
    minImportance: number;
  };
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  viewport: { x: number; y: number; zoom: number };
}

export interface ProjectActions {
  // Project
  setProject: (project: ProjectState['project']) => void;
  loadProject: (projectId: string) => Promise<void>;
  
  // Board Settings
  setBoardSettings: (settings: Partial<ProjectState['boardSettings']>) => void;
  setFilterState: (filterState: Partial<ProjectState['filterState']>) => void;
  
  // Events
  setEvents: (events: EventNode[]) => void;
  addEvent: (event: EventNode) => void;
  updateEvent: (id: string, updates: Partial<EventNode>) => void;
  updateEventPosition: (id: string, x: number, y: number) => void;
  deleteEvent: (id: string) => void;
  
  // Relationships
  setRelationships: (relationships: RelationshipEdge[]) => void;
  addRelationship: (relationship: RelationshipEdge) => void;
  updateRelationship: (id: string, updates: Partial<RelationshipEdge>) => void;
  deleteRelationship: (id: string) => void;
  
  // Clusters
  setClusters: (clusters: Cluster[]) => void;
  addCluster: (cluster: Cluster) => void;
  updateCluster: (id: string, updates: Partial<Cluster>) => void;
  deleteCluster: (id: string) => void;
  
  // Selection
  selectEvent: (id: string, multi?: boolean) => void;
  selectRelationship: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  setHoveredEvent: (id: string | null) => void;
  
  // Search & Filter
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<ProjectState['filters']>) => void;
  clearFilters: () => void;
  getFilteredEvents: () => EventNode[];
  
  // Viewport
  setViewport: (viewport: Partial<ProjectState['viewport']>) => void;
  saveViewport: () => Promise<void>;
  
  // State
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: ProjectState = {
  projectId: null,
  project: null,
  events: [],
  relationships: [],
  clusters: [],
  selectedEventIds: [],
  selectedRelationshipIds: [],
  hoveredEventId: null,
  searchQuery: '',
  filters: {
    eventTypes: [],
    statuses: [],
    dateRange: {},
    tags: [],
  },
  boardSettings: {
    showGrid: true,
    snapToGrid: false,
    gridSize: 20,
    showMinimap: true,
    showControls: true,
    showLabels: true,
    theme: 'light',
  },
  filterState: {
    eventType: 'ALL',
    status: 'ALL',
    searchQuery: '',
    dateRange: {},
    showUnverified: true,
    showVerified: true,
    showDisputed: true,
    minConfidence: 0,
    minImportance: 0,
  },
  isLoading: false,
  isSaving: false,
  error: null,
  viewport: { x: 0, y: 0, zoom: 1 },
};

export const useProjectStore = create<ProjectState & ProjectActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Project
      setProject: (project) => set({ project }),
      
      setBoardSettings: (settings) => set((state) => ({
        boardSettings: { ...state.boardSettings, ...settings },
      })),
      
      setFilterState: (filterState) => set((state) => ({
        filterState: { ...state.filterState, ...filterState },
      })),
      
      loadProject: async (projectId) => {
        set({ isLoading: true, error: null, projectId });
        try {
          const [projectRes, eventsRes, relationshipsRes] = await Promise.all([
            fetch(`/api/projects/${projectId}`),
            fetch(`/api/events?projectId=${projectId}`),
            fetch(`/api/relationships?projectId=${projectId}`),
          ]);

          const projectData = await projectRes.json();
          const eventsData = await eventsRes.json();
          const relationshipsData = await relationshipsRes.json();

          if (projectData.success && projectData.data) {
            set({ project: projectData.data });
            if (projectData.data.boardViewport) {
              try {
                const viewport = JSON.parse(projectData.data.boardViewport);
                set({ viewport });
              } catch {
                // Invalid JSON
              }
            }
          }

          if (eventsData.success && eventsData.data) {
            set({ events: eventsData.data });
          }

          if (relationshipsData.success && relationshipsData.data) {
            set({ relationships: relationshipsData.data });
          }
        } catch (error) {
          set({ error: 'Failed to load project' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Events
      setEvents: (events) => set({ events }),
      
      addEvent: (event) => set((state) => ({ 
        events: [...state.events, event] 
      })),
      
      updateEvent: (id, updates) => set((state) => ({
        events: state.events.map((e) => 
          e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
        ),
      })),
      
      updateEventPosition: async (id, x, y) => {
        set((state) => ({
          events: state.events.map((e) => 
            e.id === id ? { ...e, positionX: x, positionY: y } : e
          ),
        }));
        
        // Debounced save
        try {
          await fetch(`/api/events/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ positionX: x, positionY: y }),
          });
        } catch (error) {
          console.error('Failed to save position:', error);
        }
      },
      
      deleteEvent: async (id) => {
        try {
          await fetch(`/api/events/${id}`, { method: 'DELETE' });
          set((state) => ({
            events: state.events.filter((e) => e.id !== id),
            relationships: state.relationships.filter(
              (r) => r.sourceEventId !== id && r.targetEventId !== id
            ),
            selectedEventIds: state.selectedEventIds.filter((eid) => eid !== id),
          }));
        } catch (error) {
          set({ error: 'Failed to delete event' });
        }
      },

      // Relationships
      setRelationships: (relationships) => set({ relationships }),
      
      addRelationship: (relationship) => set((state) => ({ 
        relationships: [...state.relationships, relationship] 
      })),
      
      updateRelationship: (id, updates) => set((state) => ({
        relationships: state.relationships.map((r) => 
          r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
        ),
      })),
      
      deleteRelationship: async (id) => {
        try {
          await fetch(`/api/relationships/${id}`, { method: 'DELETE' });
          set((state) => ({
            relationships: state.relationships.filter((r) => r.id !== id),
            selectedRelationshipIds: state.selectedRelationshipIds.filter((rid) => rid !== id),
          }));
        } catch (error) {
          set({ error: 'Failed to delete relationship' });
        }
      },

      // Clusters
      setClusters: (clusters) => set({ clusters }),
      addCluster: (cluster) => set((state) => ({ clusters: [...state.clusters, cluster] })),
      updateCluster: (id, updates) => set((state) => ({
        clusters: state.clusters.map((c) => c.id === id ? { ...c, ...updates } : c),
      })),
      deleteCluster: (id) => set((state) => ({
        clusters: state.clusters.filter((c) => c.id !== id),
      })),

      // Selection
      selectEvent: (id, multi = false) => set((state) => {
        if (multi) {
          const isSelected = state.selectedEventIds.includes(id);
          return {
            selectedEventIds: isSelected
              ? state.selectedEventIds.filter((eid) => eid !== id)
              : [...state.selectedEventIds, id],
          };
        }
        return { selectedEventIds: [id], selectedRelationshipIds: [] };
      }),
      
      selectRelationship: (id, multi = false) => set((state) => {
        if (multi) {
          const isSelected = state.selectedRelationshipIds.includes(id);
          return {
            selectedRelationshipIds: isSelected
              ? state.selectedRelationshipIds.filter((rid) => rid !== id)
              : [...state.selectedRelationshipIds, id],
          };
        }
        return { selectedRelationshipIds: [id], selectedEventIds: [] };
      }),
      
      clearSelection: () => set({ selectedEventIds: [], selectedRelationshipIds: [] }),
      
      setHoveredEvent: (id) => set({ hoveredEventId: id }),

      // Search & Filter
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters },
      })),
      
      clearFilters: () => set({
        filters: initialState.filters,
        searchQuery: '',
      }),
      
      getFilteredEvents: () => {
        const state = get();
        let filtered = [...state.events];
        
        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase();
          filtered = filtered.filter((e) => 
            e.title.toLowerCase().includes(query) ||
            e.description?.toLowerCase().includes(query) ||
            e.location?.toLowerCase().includes(query)
          );
        }
        
        if (state.filters.eventTypes.length > 0) {
          filtered = filtered.filter((e) => 
            state.filters.eventTypes.includes(e.eventType)
          );
        }
        
        if (state.filters.statuses.length > 0) {
          filtered = filtered.filter((e) => 
            state.filters.statuses.includes(e.status)
          );
        }
        
        if (state.filters.dateRange.start) {
          filtered = filtered.filter((e) => 
            e.eventDate && e.eventDate >= state.filters.dateRange.start!
          );
        }
        
        if (state.filters.dateRange.end) {
          filtered = filtered.filter((e) => 
            e.eventDate && e.eventDate <= state.filters.dateRange.end!
          );
        }
        
        return filtered;
      },

      // Viewport
      setViewport: (viewport) => set((state) => ({
        viewport: { ...state.viewport, ...viewport },
      })),
      
      saveViewport: async () => {
        const state = get();
        if (!state.projectId) return;
        
        try {
          await fetch(`/api/projects/${state.projectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boardViewport: JSON.stringify(state.viewport) }),
          });
        } catch (error) {
          console.error('Failed to save viewport:', error);
        }
      },

      // State
      setLoading: (loading) => set({ isLoading: loading }),
      setSaving: (saving) => set({ isSaving: saving }),
      setError: (error) => set({ error }),
      reset: () => set(initialState),
    }),
    {
      name: 'investigation-board-storage',
      partialize: (state) => ({
        viewport: state.viewport,
        filters: state.filters,
      }),
    }
  )
);
