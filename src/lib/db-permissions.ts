// Database Manager Permission Definitions

// Permission types for database operations
export type DbPermission =
  | 'db:view'           // View database dashboard
  | 'db:tables:view'    // View table list and structure
  | 'db:tables:edit'    // Edit table structure (DDL)
  | 'db:query:select'   // Execute SELECT queries
  | 'db:query:insert'   // Execute INSERT queries
  | 'db:query:update'   // Execute UPDATE queries
  | 'db:query:delete'   // Execute DELETE queries
  | 'db:query:ddl'      // Execute DDL (CREATE, ALTER, DROP, TRUNCATE)
  | 'db:schema:view'    // View schema visualization
  | 'db:import'         // Import data
  | 'db:export'         // Export data
  | 'db:backup:create'  // Create backups
  | 'db:backup:restore' // Restore from backup
  | 'db:backup:delete'  // Delete backups
  | 'db:monitor'        // View performance monitoring
  | 'db:audit:view'     // View audit logs
  | 'db:audit:export';  // Export audit logs

// Permission categories
export const PERMISSION_CATEGORIES = {
  view: ['db:view', 'db:tables:view', 'db:schema:view', 'db:monitor', 'db:audit:view'],
  query: ['db:query:select', 'db:query:insert', 'db:query:update', 'db:query:delete', 'db:query:ddl'],
  data: ['db:import', 'db:export'],
  backup: ['db:backup:create', 'db:backup:restore', 'db:backup:delete'],
  audit: ['db:audit:view', 'db:audit:export'],
  admin: ['db:tables:edit'],
} as const;

// Role definitions
export type SystemRole = 'ADMIN' | 'INVESTIGATOR' | 'VIEWER';

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<SystemRole, DbPermission[]> = {
  ADMIN: [
    // Full access to all database operations
    'db:view',
    'db:tables:view',
    'db:tables:edit',
    'db:query:select',
    'db:query:insert',
    'db:query:update',
    'db:query:delete',
    'db:query:ddl',
    'db:schema:view',
    'db:import',
    'db:export',
    'db:backup:create',
    'db:backup:restore',
    'db:backup:delete',
    'db:monitor',
    'db:audit:view',
    'db:audit:export',
  ],
  INVESTIGATOR: [
    // Read-only + SELECT queries + export
    'db:view',
    'db:tables:view',
    'db:query:select',
    'db:schema:view',
    'db:export',
    'db:monitor',
  ],
  VIEWER: [
    // Read-only access
    'db:view',
    'db:tables:view',
    'db:schema:view',
  ],
};

// Permission labels for UI
export const PERMISSION_LABELS: Record<DbPermission, string> = {
  'db:view': 'View Database Dashboard',
  'db:tables:view': 'View Tables',
  'db:tables:edit': 'Edit Table Structure',
  'db:query:select': 'Execute SELECT Queries',
  'db:query:insert': 'Execute INSERT Queries',
  'db:query:update': 'Execute UPDATE Queries',
  'db:query:delete': 'Execute DELETE Queries',
  'db:query:ddl': 'Execute DDL Commands',
  'db:schema:view': 'View Schema Diagram',
  'db:import': 'Import Data',
  'db:export': 'Export Data',
  'db:backup:create': 'Create Backups',
  'db:backup:restore': 'Restore from Backup',
  'db:backup:delete': 'Delete Backups',
  'db:monitor': 'View Performance Monitor',
  'db:audit:view': 'View Audit Logs',
  'db:audit:export': 'Export Audit Logs',
};

// Permission descriptions for UI
export const PERMISSION_DESCRIPTIONS: Record<DbPermission, string> = {
  'db:view': 'Access to the database manager dashboard',
  'db:tables:view': 'View list of database tables and their structure',
  'db:tables:edit': 'Modify table structure (add/remove columns, indexes)',
  'db:query:select': 'Run SELECT queries to retrieve data',
  'db:query:insert': 'Run INSERT queries to add new data',
  'db:query:update': 'Run UPDATE queries to modify existing data',
  'db:query:delete': 'Run DELETE queries to remove data',
  'db:query:ddl': 'Run DDL commands (CREATE, ALTER, DROP, TRUNCATE)',
  'db:schema:view': 'View the database schema visualization (ER diagram)',
  'db:import': 'Import data from external files',
  'db:export': 'Export data to external files',
  'db:backup:create': 'Create database backups',
  'db:backup:restore': 'Restore database from a backup',
  'db:backup:delete': 'Delete existing backups',
  'db:monitor': 'View database performance metrics and monitoring',
  'db:audit:view': 'View database operation audit logs',
  'db:audit:export': 'Export audit logs to external files',
};

// Check if a role has a specific permission
export function hasPermission(role: SystemRole | undefined | null, permission: DbPermission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// Check if a role has all specified permissions
export function hasAllPermissions(role: SystemRole | undefined | null, permissions: DbPermission[]): boolean {
  if (!role) return false;
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return permissions.every((p) => rolePermissions.includes(p));
}

// Check if a role has any of the specified permissions
export function hasAnyPermission(role: SystemRole | undefined | null, permissions: DbPermission[]): boolean {
  if (!role) return false;
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return permissions.some((p) => rolePermissions.includes(p));
}

// Get all permissions for a role
export function getRolePermissions(role: SystemRole): DbPermission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// Get permissions by category for a role
export function getPermissionsByCategory(role: SystemRole): Record<keyof typeof PERMISSION_CATEGORIES, DbPermission[]> {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];

  return {
    view: rolePermissions.filter((p) => PERMISSION_CATEGORIES.view.includes(p as typeof PERMISSION_CATEGORIES.view[number])),
    query: rolePermissions.filter((p) => PERMISSION_CATEGORIES.query.includes(p as typeof PERMISSION_CATEGORIES.query[number])),
    data: rolePermissions.filter((p) => PERMISSION_CATEGORIES.data.includes(p as typeof PERMISSION_CATEGORIES.data[number])),
    backup: rolePermissions.filter((p) => PERMISSION_CATEGORIES.backup.includes(p as typeof PERMISSION_CATEGORIES.backup[number])),
    audit: rolePermissions.filter((p) => PERMISSION_CATEGORIES.audit.includes(p as typeof PERMISSION_CATEGORIES.audit[number])),
    admin: rolePermissions.filter((p) => PERMISSION_CATEGORIES.admin.includes(p as typeof PERMISSION_CATEGORIES.admin[number])),
  };
}

// Check if query type requires specific permission
export function getQueryPermission(sql: string): DbPermission | null {
  const normalizedSql = sql.trim().toUpperCase();

  if (normalizedSql.startsWith('SELECT')) {
    return 'db:query:select';
  }
  if (normalizedSql.startsWith('INSERT')) {
    return 'db:query:insert';
  }
  if (normalizedSql.startsWith('UPDATE')) {
    return 'db:query:update';
  }
  if (normalizedSql.startsWith('DELETE')) {
    return 'db:query:delete';
  }
  if (
    normalizedSql.startsWith('CREATE') ||
    normalizedSql.startsWith('ALTER') ||
    normalizedSql.startsWith('DROP') ||
    normalizedSql.startsWith('TRUNCATE')
  ) {
    return 'db:query:ddl';
  }

  return null;
}

// Check if role can execute a SQL query
export function canExecuteQuery(role: SystemRole | undefined | null, sql: string): boolean {
  const permission = getQueryPermission(sql);
  if (!permission) return false;
  return hasPermission(role, permission);
}

// Get list of allowed SQL operations for a role
export function getAllowedSqlOperations(role: SystemRole): string[] {
  const permissions = ROLE_PERMISSIONS[role] || [];
  const operations: string[] = [];

  if (permissions.includes('db:query:select')) operations.push('SELECT');
  if (permissions.includes('db:query:insert')) operations.push('INSERT');
  if (permissions.includes('db:query:update')) operations.push('UPDATE');
  if (permissions.includes('db:query:delete')) operations.push('DELETE');
  if (permissions.includes('db:query:ddl')) {
    operations.push('CREATE', 'ALTER', 'DROP', 'TRUNCATE');
  }

  return operations;
}

// Admin-only feature guard helper
export function requireAdmin<T>(role: SystemRole | undefined | null, callback: () => T): T | null {
  if (role === 'ADMIN') {
    return callback();
  }
  return null;
}

// Permission check with redirect for UI components
export function checkPermissionWithMessage(
  role: SystemRole | undefined | null,
  permission: DbPermission
): { allowed: boolean; message?: string } {
  if (!role) {
    return { allowed: false, message: 'Authentication required' };
  }

  if (hasPermission(role, permission)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    message: `Permission denied: ${PERMISSION_LABELS[permission]} is required`,
  };
}
