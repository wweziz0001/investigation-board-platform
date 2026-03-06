# Version 2.1.3 Changelog

## Bug Fixes and Improvements

### 1. Added Delete Button for Relationship Edges
- Added a delete button that appears when hovering over a relationship edge label
- The delete button allows users to easily remove connections between events
- Added confirmation dialog before deletion

### 2. Support for Side Handle Connections
- Event nodes now support connections from left and right handles
- Previously, connections could only be made from top (target) and bottom (source) handles
- Added `sourceHandle` and `targetHandle` fields to the Relationship model
- Updated API endpoints to handle handle information

### 3. Improved Non-Curved Edge Rendering
- Changed non-curved edges from straight lines to smooth step paths with 90-degree bends
- Uses `getSmoothStepPath` instead of `getStraightPath` for better visual appearance
- Added `borderRadius: 8` for smooth corners on step edges

## Technical Changes

### Database Schema
- Added `sourceHandle` (String?) field to Relationship model
- Added `targetHandle` (String?) field to Relationship model

### API Updates
- Updated POST /api/relationships to accept sourceHandle and targetHandle
- Updated PUT /api/relationships/[id] to accept sourceHandle and targetHandle

### Component Updates
- `relationship-edge.tsx`: 
  - Added delete button with hover state
  - Changed from getStraightPath to getSmoothStepPath for non-curved edges
  - Added onDelete callback to edge data
  
- `investigation-board.tsx`:
  - Added handleDeleteRelationship function
  - Updated createRelationship to accept handle parameters
  - Updated onConnect to pass handle information

- `project-store.ts`:
  - Added sourceHandle and targetHandle to RelationshipEdge interface
