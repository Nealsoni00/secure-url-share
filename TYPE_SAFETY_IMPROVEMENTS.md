# Type Safety Improvements Required

## Current Issues

The following files contain `any` types that should be replaced with proper TypeScript types:

### API Routes

1. **`app/api/users/route.ts`** ✅ FIXED
   - ✅ Added `CreateUserRequest` type import
   - ✅ Used type guards for Prisma errors
   - ✅ All error responses use `satisfies ApiError`

2. **`app/api/users/[id]/route.ts`** ✅ FIXED
   - ✅ Added `UpdateUserRequest` type import
   - ✅ Changed `updateData: any = {}` to `updateData: Partial<UpdateUserRequest> = {}`
   - ✅ Used type guards for error handling
   - ✅ All error responses use `satisfies ApiError`

3. **`app/api/protected/urls/route.ts`** ✅ FIXED
   - ✅ Added `CreateProtectedUrlRequest` type import
   - ✅ Removed `as any` from Prisma data object
   - ✅ Used type guards for Prisma errors
   - ✅ All error responses use `satisfies ApiError`

4. **`app/api/protected/urls/[id]/links/[linkId]/route.ts`** ✅ FIXED
   - ✅ Added `UpdateAccessLinkData` type import
   - ✅ Changed `updateData: any = {}` to `updateData: UpdateAccessLinkData = {}`
   - ✅ All error responses use `satisfies ApiError`

5. **`app/api/organizations/route.ts`** ✅ FIXED
   - ✅ Added `CreateOrganizationRequest` type import
   - ✅ Used type guards for Prisma errors
   - ✅ All error responses use `satisfies ApiError`

## Fixes Applied

### ✅ Fixed Files

1. **`app/api/organizations/[id]/route.ts`**
   - Added proper type imports
   - Replaced `any` with `UpdateOrganizationRequest`
   - Used type guards for error handling
   - Added `satisfies ApiError` for type-safe responses

2. **`app/api/users/route.ts`**
   - Added `CreateUserRequest` and `ApiError` type imports
   - Replaced implicit any with proper types
   - Used type guards for Prisma error handling
   - All error responses use `satisfies ApiError`

3. **`app/api/users/[id]/route.ts`**
   - Added `UpdateUserRequest` and `ApiError` type imports
   - Changed `updateData: any = {}` to `updateData: Partial<UpdateUserRequest> = {}`
   - Used type guards for error handling
   - All error responses use `satisfies ApiError`

4. **`app/api/protected/urls/route.ts`**
   - Added `CreateProtectedUrlRequest` and `ApiError` type imports
   - Removed `as any` from Prisma data object
   - Used explicit default values instead of spread with `as any`
   - Used type guards for Prisma errors
   - All error responses use `satisfies ApiError`

5. **`app/api/protected/urls/[id]/links/[linkId]/route.ts`**
   - Added `UpdateAccessLinkData` and `ApiError` type imports
   - Changed `updateData: any = {}` to `updateData: UpdateAccessLinkData = {}`
   - All error responses use `satisfies ApiError`

6. **`app/api/organizations/route.ts`**
   - Added `CreateOrganizationRequest` and `ApiError` type imports
   - Used type guards for Prisma errors
   - All error responses use `satisfies ApiError`

7. **`types/api.ts`** (NEW)
   - Created centralized API type definitions
   - Request/Response types for all endpoints
   - Error response types
   - Common utility types

8. **`.claude/coding-standards.md`** (NEW)
   - Comprehensive coding standards document
   - Type safety requirements
   - Component architecture guidelines
   - Code quality rules
   - Examples of good vs bad patterns

## ✅ API Routes Type Safety - COMPLETED

All API routes have been updated with proper TypeScript types! The pattern used:

```typescript
// Import types
import type { UpdateUserRequest, ApiError } from '@/types/api'

// Type request body
const body = await request.json() as UpdateUserRequest

// Type update data
const updateData: Partial<UpdateUserRequest> = {}

// Type error responses
} catch (error) {
  console.error('Error:', error)

  // Type guard for Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    if (error.code === 'P2002') {
      return NextResponse.json({
        error: 'Duplicate entry'
      } satisfies ApiError, { status: 409 })
    }
  }

  return NextResponse.json({
    error: 'Operation failed'
  } satisfies ApiError, { status: 500 })
}
```

### Summary of Changes

**All `any` types removed from API routes:**
- ✅ 5 routes fixed
- ✅ 0 `any` types remaining in API routes
- ✅ All error responses properly typed with `satisfies ApiError`
- ✅ Type guards used for Prisma error handling

### 2. Create Shared Components

Extract repeated UI patterns:

#### Suggested Shared Components

1. **`components/ui/Badge.tsx`**
   - For role badges (USER, ADMINISTRATOR, SUPERADMIN)
   - Currently duplicated in multiple files

2. **`components/ui/UserAvatar.tsx`**
   - For user photo/avatar display
   - Currently duplicated in navigation, profile, users page

3. **`components/ui/LoadingSpinner.tsx`**
   - For loading states
   - Currently duplicated across pages

4. **`components/ui/EmptyState.tsx`**
   - For "no data" states
   - Currently duplicated in lists

5. **`components/layouts/PageHeader.tsx`**
   - For page titles and descriptions
   - Currently duplicated in every page

6. **`components/ui/Card.tsx`**
   - For content containers
   - Currently using raw divs everywhere

7. **`components/forms/FormField.tsx`**
   - For form inputs with labels
   - Currently duplicated in forms

### 3. Create Custom Hooks

Extract repeated logic:

1. **`hooks/useUser.ts`**
   ```typescript
   export function useUser() {
     const { data: session, status } = useSession()
     return {
       user: session?.user ?? null,
       isLoading: status === 'loading',
       isAdmin: session?.user?.isAdmin ?? false,
       isSuperAdmin: session?.user?.isSuperAdmin ?? false,
       canManageUsers: /* logic */
     }
   }
   ```

2. **`hooks/useFetch.ts`**
   ```typescript
   export function useFetch<T>(url: string) {
     const [data, setData] = useState<T | null>(null)
     const [loading, setLoading] = useState(true)
     const [error, setError] = useState<Error | null>(null)
     // ... fetch logic
     return { data, loading, error, refetch }
   }
   ```

3. **`hooks/useToast.ts`**
   ```typescript
   export function useToast() {
     return {
       success: (message: string) => toast.success(message),
       error: (message: string) => toast.error(message),
       loading: (message: string) => toast.loading(message)
     }
   }
   ```

### 4. Prisma Type Usage

Use generated Prisma types properly:

```typescript
import type { User, Organization, Prisma } from '@prisma/client'

// For queries with includes
type UserWithOrganization = Prisma.UserGetPayload<{
  include: { organization: true }
}>

// For partial selects
type UserBasic = Pick<User, 'id' | 'email' | 'name'>

// For create/update operations
type UserCreateInput = Prisma.UserCreateInput
type UserUpdateInput = Prisma.UserUpdateInput
```

## Priority Order

### High Priority (Do Before Production)
1. ✅ Create coding standards document
2. ✅ Create API types file
3. ✅ Fix all `any` types in API routes
4. ✅ Add error type guards

### Medium Priority (Next Sprint)
1. ⏳ Create shared Badge component
2. ⏳ Create shared UserAvatar component
3. ⏳ Create shared LoadingSpinner component
4. ⏳ Extract useUser hook
5. ⏳ Extract useFetch hook

### Low Priority (Technical Debt)
1. ⏳ Create all suggested shared components
2. ⏳ Refactor large files (>300 lines)
3. ⏳ Add JSDoc comments to complex functions
4. ⏳ Create Storybook stories for components

## Benefits of These Improvements

### Type Safety
- **Catch errors at compile time** instead of runtime
- **Better IDE autocomplete** and IntelliSense
- **Self-documenting code** - types show what's expected
- **Easier refactoring** - TypeScript catches breaking changes

### Code Reusability
- **DRY principle** - Don't Repeat Yourself
- **Consistent UI** - Shared components ensure consistency
- **Faster development** - Reuse instead of rewrite
- **Easier testing** - Test components once, use everywhere

### Maintainability
- **Smaller files** - Easier to understand and modify
- **Clear separation of concerns** - Each file has one purpose
- **Reduced bugs** - Less duplication means fewer places for bugs
- **Easier onboarding** - New developers can understand code faster

## Monitoring Progress

Track these metrics:
- [x] Number of `any` types in API routes: ~~Currently **~20**~~ → **0** ✅
- [ ] Average file size: Currently **~250 lines** → Target: **<200 lines**
- [ ] Number of shared components: Currently **0** → Target: **15+**
- [ ] TypeScript strict mode: Currently **false** → Target: **true**

## Resources

- See `.claude/coding-standards.md` for detailed guidelines
- See `types/api.ts` for API type examples
- See `app/api/organizations/[id]/route.ts` for fixed API route example

---

**Status**: All `any` types in API routes have been fixed! ✅

**Next Actions**:
1. Create shared UI components (Badge, UserAvatar, LoadingSpinner, etc.)
2. Extract custom hooks (useUser, useFetch, useToast)
3. Consider enabling TypeScript strict mode
