import type { UserRole } from '@prisma/client'

// ============================================================================
// User API Types
// ============================================================================

export interface CreateUserRequest {
  email: string
  name?: string
  isAdmin?: boolean
  isSuperAdmin?: boolean
  organizationId?: string | null
}

export interface UpdateUserRequest {
  name?: string
  isAdmin?: boolean
  isSuperAdmin?: boolean
  organizationId?: string | null
  role?: UserRole
}

// ============================================================================
// Organization API Types
// ============================================================================

export interface CreateOrganizationRequest {
  name: string
  domain?: string | null
}

export interface UpdateOrganizationRequest {
  name?: string
  domain?: string | null
}

// ============================================================================
// Protected URL API Types
// ============================================================================

export interface CreateProtectedUrlRequest {
  originalUrl: string
  title?: string
  description?: string
  customSlug?: string
  displayMode?: 'iframe' | 'redirect' | 'auto'
  showUserInfo?: boolean
}

export interface UpdateProtectedUrlData {
  title?: string
  description?: string
  isActive?: boolean
  displayMode?: string
  showUserInfo?: boolean
}

// ============================================================================
// Access Link API Types
// ============================================================================

export interface UpdateAccessLinkData {
  isActive?: boolean
  recipientName?: string | null
  recipientEmail?: string | null
  recipientPhone?: string | null
  expiresAt?: Date | string | null
  maxAccesses?: number | null
}

// ============================================================================
// Error Response Types
// ============================================================================

export interface ApiError {
  error: string
  code?: string
  details?: unknown
}

// ============================================================================
// Common Response Types
// ============================================================================

export interface SuccessResponse {
  success: boolean
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
