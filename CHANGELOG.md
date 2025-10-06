# Changelog - User Management & Organization Features

## Overview

This update adds comprehensive user management, organization support, and role-based access control to the Secure URL Share application.

## Major Features Added

### 1. Organization Management System

#### Database Changes
- **New Model**: `Organization`
  - Fields: id, name, domain, createdAt, updatedAt, createdBy
  - Unique domain constraint for auto-assignment

#### Features
- Auto-creation for company email domains (axon.com, prepared911.com)
- First user becomes Administrator
- Organization settings page (`/organization`)
- View/edit organization name and domain
- See all organization members

### 2. Role-Based Access Control

#### Three User Roles
1. **USER**
   - View organization members
   - Access own profile
   - Create and manage own protected URLs

2. **ADMINISTRATOR**
   - All USER permissions
   - Manage users in organization (create, edit, delete)
   - Promote users to Administrator
   - Edit organization settings

3. **SUPERADMIN**
   - All ADMINISTRATOR permissions
   - View and manage all organizations
   - Grant superadmin privileges to others
   - Access superadmin panel

#### Database Changes
- **New Enum**: `UserRole` (USER, ADMINISTRATOR, SUPERADMIN)
- **User Model Updates**:
  - Added `role` field (default: USER)
  - Added `organizationId` field (nullable)
  - Kept `isAdmin` and `isSuperAdmin` for backward compatibility

### 3. Authentication Enhancements

#### JWT Token Management
- Token expiration: 12 hours
- Embedded credentials: id, email, name, image, role, organization
- Session strategy: JWT-based
- Auto-refresh before expiration

#### Auto-Assignment Logic
- Users with company domains → auto-join organization
- First user in organization → becomes Administrator
- Admin email (nealsoni00@gmail.com) → becomes Superadmin
- All other users → default USER role

### 4. New Pages

#### User Profile (`/profile`)
- View own information (name, email, photo)
- Display role badge and permissions
- Show organization membership
- Activity stats (protected URLs, total views)

#### Organization Page (`/organization`)
- View organization details
- Edit settings (Administrators only)
- List all organization members
- Link to user management

#### User Management (`/users`)
- **For USERs**: View organization members (read-only)
- **For Administrators**: Create, edit, delete users
- **For Superadmins**: Manage users across all organizations
- Inline editing with role badges
- User statistics display

#### Superadmin Panel (`/superadmin`)
- View all organizations with stats
- Create new organizations
- Expandable organization views
- Grant/revoke superadmin privileges
- Organization analytics

### 5. Enhanced Navigation

#### User Menu Dropdown
- User photo display
- Full user information card
  - Name and email
  - Role badge (with icon)
  - Organization name and domain
- Context-aware menu items:
  - View Profile
  - Organization (if member)
  - User Management (all members can view)
  - Superadmin Panel (superadmins only)
  - Sign Out

### 6. API Updates

#### New Endpoints

**Organizations**
- `GET /api/organizations` - List all (superadmin)
- `POST /api/organizations` - Create (superadmin)
- `GET /api/organizations/[id]` - Get details (org admin/superadmin)
- `PATCH /api/organizations/[id]` - Update (org admin/superadmin)
- `DELETE /api/organizations/[id]` - Delete (superadmin)

**Users**
- `GET /api/users` - List users (all org members can view)
- `POST /api/users` - Create user (administrators)
- `GET /api/users/[id]` - Get user details
- `PATCH /api/users/[id]` - Update user (administrators)
- `DELETE /api/users/[id]` - Delete user (administrators)

#### Permission Enforcement
- All endpoints validate user role
- Proper error messages for unauthorized access
- Organization-scoped data access

### 7. UI/UX Improvements

#### Visual Enhancements
- Role badges with icons (User, Administrator, Superadmin)
- User photos throughout the interface
- Color-coded role indicators
- Gradient headers for profile and organization pages

#### Responsive Design
- Mobile-friendly navigation
- Adaptive menu layouts
- Photo displays on all screen sizes

#### Context-Aware Labels
- "Organization Members" vs "User Management"
- "Organization Information" vs "Organization Settings"
- "View All Members" vs "Manage Users"

## Files Modified

### Schema & Database
- `prisma/schema.prisma` - Added Organization model, UserRole enum
- `prisma/migrations/20251005000000_add_user_roles_and_organizations/migration.sql` - Migration file

### Authentication
- `lib/auth.ts` - JWT config, auto-assignment logic, role management
- `types/next-auth.d.ts` - Added role and organization to session

### API Routes
- `app/api/organizations/route.ts` - Organization CRUD (new)
- `app/api/organizations/[id]/route.ts` - Single organization (new)
- `app/api/users/route.ts` - User management (new)
- `app/api/users/[id]/route.ts` - Single user operations (new)
- `app/api/protected/urls/route.ts` - Enhanced error handling

### Pages
- `app/profile/page.tsx` - User profile page (new)
- `app/organization/page.tsx` - Organization settings (new)
- `app/users/page.tsx` - User management (new)
- `app/superadmin/page.tsx` - Superadmin panel (new)
- `app/dashboard/page.tsx` - Enhanced navigation dropdown

### Configuration
- `package.json` - Added migration to build process
- `.env` - No changes (uses existing variables)

## Migration Path

### Automatic on Deployment
When deploying to Vercel, the migration runs automatically:
1. `prisma generate` - Generates new client
2. `prisma migrate deploy` - Applies migration
3. `next build` - Builds application

### Manual (if needed)
```bash
npx prisma generate
npx prisma migrate deploy
```

## Breaking Changes

None. All changes are additive:
- New fields have default values
- Backward compatibility fields maintained (`isAdmin`, `isSuperAdmin`)
- Existing functionality unchanged

## Testing Checklist

- [x] Login assigns correct roles
- [x] Organization auto-creation works
- [x] Users can view organization members
- [x] Administrators can manage users
- [x] Superadmins can access all features
- [x] JWT tokens expire after 12 hours
- [x] Navigation shows user info correctly
- [x] Role-based UI elements display properly
- [x] API permissions enforced

## Documentation Added

- `DATABASE_MIGRATION_GUIDE.md` - Detailed migration instructions
- `DEPLOYMENT_INSTRUCTIONS.md` - Deployment steps and verification
- `CHANGELOG.md` - This file

## Security Considerations

- JWT tokens include minimal data (id, role, organization)
- Tokens expire after 12 hours (configurable)
- API routes validate permissions
- Organization scoping prevents cross-org data access
- Superadmin actions logged in database

## Performance Impact

- Minimal - one additional join for organization data
- JWT payload slightly larger (adds ~100 bytes)
- Database indexes on foreign keys for fast queries

## Future Enhancements

Potential future additions:
- Email invitations for new users
- Organization billing and usage limits
- Audit logs for administrator actions
- Custom role permissions
- SSO integration
- Multi-factor authentication

## Support

For issues or questions:
1. Check `DATABASE_MIGRATION_GUIDE.md`
2. Review `DEPLOYMENT_INSTRUCTIONS.md`
3. Verify environment variables in Vercel
4. Check Prisma client is regenerated
