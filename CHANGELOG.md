# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.7] - 2025-01-XX

### Fixed
- Project dropdown menu actions now work correctly
  - Edit Project opens dialog with name, description, status, and priority fields
  - Manage Members shows member list with add/remove functionality
  - Share displays copyable project link
  - Archive sets project as archived
  - Delete shows confirmation dialog before permanent deletion

### Added
- User search API endpoint for adding members to projects

## [2.0.6] - 2025-01-XX

### Fixed
- Event node action buttons (Edit, Connect, Delete) now work correctly
  - Added onClick handlers with proper event propagation stopping
  - Pass callback functions from InvestigationBoard to EventNode
  - Edit button opens the event dialog for editing
  - Connect button initiates connection mode
  - Delete button shows confirmation before deleting

## [2.0.5] - 2025-01-XX

### Fixed
- Standardized date format to dd/MM/yyyy across event components
- Fixed inconsistent date display in event nodes and dialogs

## [2.0.4] - 2025-01-XX

### Fixed
- Fixed undefined properties error when accessing events array elements
- Added .filter(Boolean) checks before filtering events and relationships

## [2.0.3] - 2025-01-XX

### Fixed
- Improved WebSocket collaboration connection error handling
- Added graceful offline mode when collaboration service is unavailable
- Reduced reconnection attempts and timeout for better UX

## [2.0.0] - 2025-01-XX

### Added
- Initial release of Investigation Board Platform
- Project management with drag-and-drop board
- Event nodes with customizable types and statuses
- Relationship connections between events
- Real-time collaboration support
- AI analysis integration
- Evidence management
- Timeline view
- Comments system
