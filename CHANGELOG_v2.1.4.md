# Version 2.1.4 Changelog

## Bug Fix

### Fixed: Relationship Connections Not Working

**Problem:** After v2.1.3, relationships/connections could not be created between events.

**Root Cause:** 
- Event node handles were missing IDs for top/bottom handles
- Connection mode was too restrictive

**Solution:**
1. Added `ConnectionMode.Loose` to ReactFlow configuration
   - Allows connections between any handle types
   - More flexible connection behavior

2. Simplified handle configuration:
   - Added IDs to all handles (top, bottom, left, right)
   - Added both source and target handles for each position
   - Handles are now positioned with slight offsets to avoid overlap

## Technical Changes

### event-node.tsx
- Added source handles: `top`, `bottom`, `left`, `right`
- Added target handles: `top-target`, `bottom-target`, `left-target`, `right-target`
- Positioned target handles slightly offset to avoid visual overlap

### investigation-board.tsx
- Added `ConnectionMode` import from `@xyflow/react`
- Added `connectionMode={ConnectionMode.Loose}` to ReactFlow component
