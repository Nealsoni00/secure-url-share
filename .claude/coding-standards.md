# Coding Standards for Secure URL Share

## TypeScript Standards

### Type Safety
1. **ALWAYS add explicit types** - Never use `any` unless absolutely necessary
2. **Prefer interfaces over types** for object shapes
3. **Use type inference wisely** - Let TypeScript infer simple types, but be explicit for function returns
4. **Create shared type definitions** in `types/` directory for reusable types

### Type Usage Examples

#### ❌ BAD - Using 'any'
```typescript
const updateData: any = {}
const handleSubmit = async (data: any) => {
  // ...
}
```

#### ✅ GOOD - Explicit types
```typescript
interface UpdateData {
  name?: string
  email?: string
  role?: UserRole
}

const updateData: UpdateData = {}

const handleSubmit = async (data: FormData): Promise<void> => {
  // ...
}
```

## Component Architecture

### File Organization
1. **Keep files under 300 lines** - Split large components into smaller ones
2. **Create shared components** in `components/` directory
3. **One component per file** - No multi-component files
4. **Colocate related files** - Keep components with their types and utilities

### Component Structure
```
components/
├── ui/              # Shared UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Modal.tsx
├── layouts/         # Layout components
│   ├── Header.tsx
│   └── Sidebar.tsx
└── features/        # Feature-specific components
    └── users/
        ├── UserCard.tsx
        └── UserList.tsx
```

### Shared Components Guidelines

1. **Extract repeated UI patterns** into shared components
2. **Make components reusable** with props
3. **Document props** with TypeScript interfaces
4. **Use composition** over inheritance

#### Example: Shared Button Component
```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  children: React.ReactNode
  disabled?: boolean
  loading?: boolean
}

export function Button({
  variant,
  size = 'md',
  onClick,
  children,
  disabled,
  loading
}: ButtonProps) {
  // Implementation
}
```

## Code Quality Rules

### DRY (Don't Repeat Yourself)
- If code is used 2+ times, extract it to a shared function/component
- Create utility functions in `lib/` directory
- Use custom hooks for repeated logic

### File Size Limits
- **Components**: Max 300 lines
- **API Routes**: Max 200 lines per endpoint
- **Utility Functions**: Max 150 lines per file

When exceeding these limits:
1. Split into multiple files
2. Extract shared logic
3. Create helper functions
4. Use composition

### Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Functions**: camelCase (e.g., `getUserById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Types/Interfaces**: PascalCase (e.g., `UserRole`, `ApiResponse`)

## API Routes

### Type Safety in API Routes
Always define request/response types:

```typescript
// types/api.ts
export interface CreateUserRequest {
  email: string
  name?: string
  role?: UserRole
}

export interface CreateUserResponse {
  id: string
  email: string
  role: UserRole
}

export interface ApiError {
  error: string
  code?: string
}

// app/api/users/route.ts
import type { CreateUserRequest, CreateUserResponse, ApiError } from '@/types/api'

export async function POST(request: NextRequest): Promise<NextResponse<CreateUserResponse | ApiError>> {
  const body: CreateUserRequest = await request.json()
  // ...
}
```

### Error Handling
Always type error responses:

```typescript
// ❌ BAD
} catch (error: any) {
  return NextResponse.json({ error: 'Failed' }, { status: 500 })
}

// ✅ GOOD
} catch (error) {
  console.error('Error creating user:', error)
  const errorMessage = error instanceof Error ? error.message : 'Failed to create user'
  return NextResponse.json({
    error: errorMessage
  } satisfies ApiError, { status: 500 })
}
```

## Common Patterns to Extract

### Repeated UI Components
Extract these into shared components:
- Buttons with loading states
- Form inputs with validation
- Modal dialogs
- Toast notifications
- Loading spinners
- Empty states
- Error messages
- Cards and containers
- Navigation items
- Badge/Tag components

### Repeated Logic
Extract into custom hooks or utilities:
- Data fetching patterns
- Form handling
- Authentication checks
- Permission validation
- Date formatting
- URL manipulation

### Example: Custom Hook
```typescript
// hooks/useUser.ts
import { useSession } from 'next-auth/react'

interface UseUserReturn {
  user: User | null
  isAdmin: boolean
  isSuperAdmin: boolean
  isLoading: boolean
  canManageUsers: boolean
}

export function useUser(): UseUserReturn {
  const { data: session, status } = useSession()

  return {
    user: session?.user ?? null,
    isAdmin: session?.user?.isAdmin ?? false,
    isSuperAdmin: session?.user?.isSuperAdmin ?? false,
    isLoading: status === 'loading',
    canManageUsers: session?.user?.role === 'ADMINISTRATOR' || session?.user?.role === 'SUPERADMIN'
  }
}
```

## Type Definitions Location

### Where to Put Types

1. **Global types** → `types/` directory
   - `types/api.ts` - API request/response types
   - `types/models.ts` - Database model types
   - `types/next-auth.d.ts` - NextAuth extensions

2. **Component-specific types** → Same file as component
   ```typescript
   // UserCard.tsx
   interface UserCardProps {
     user: User
     onEdit?: (id: string) => void
   }

   export function UserCard({ user, onEdit }: UserCardProps) {
     // ...
   }
   ```

3. **Shared types** → `types/common.ts`
   ```typescript
   export type Status = 'idle' | 'loading' | 'success' | 'error'
   export type SortDirection = 'asc' | 'desc'
   export type Permission = 'read' | 'write' | 'admin'
   ```

## Prisma Types

Use generated Prisma types:

```typescript
import type { User, Organization, UserRole } from '@prisma/client'

// For partial types
import type { Prisma } from '@prisma/client'

type UserWithOrganization = Prisma.UserGetPayload<{
  include: { organization: true }
}>
```

## Checklist for New Code

Before submitting/committing:

- [ ] All types are explicitly defined (no `any`)
- [ ] Repeated UI patterns extracted to components
- [ ] Repeated logic extracted to utilities/hooks
- [ ] File is under size limit (300 lines for components)
- [ ] Component props have interface definitions
- [ ] API routes have typed request/response
- [ ] Error handling is typed
- [ ] Imports use TypeScript path aliases (`@/`)
- [ ] No console.logs in production code (use proper logging)
- [ ] Component is documented if complex

## Resources

- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Prisma Type Safety](https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety)

---

**Remember**: Type safety prevents bugs. Shared components prevent duplication. Small files are maintainable files.
