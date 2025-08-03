# CC Webapp - Frontend

This directory contains the Next.js frontend for the CC Webapp built with TypeScript/TSX for type safety and maintainability.

## Prerequisites
- Node.js (version 18.x or as specified in `.nvmrc` if present, or `frontend/Dockerfile`)
- npm (comes with Node.js)

## Technology Stack
- **Next.js 15+**: React framework with App Router
- **TypeScript/TSX**: Strict type checking and enhanced developer experience
- **ESLint with TypeScript**: Enforced code quality and type safety rules
- **Tailwind CSS**: Utility-first CSS framework
- **Jest & React Testing Library**: Unit and component testing
- **Cypress**: End-to-end testing

## Environment Configuration

Before starting development, create a `.env.local` file in the frontend directory to configure environment variables:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Important:** 
- Environment variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Never include sensitive data in `NEXT_PUBLIC_` variables
- The `.env.local` file is ignored by git for security

## TypeScript Configuration

This project uses strict TypeScript configuration for enhanced type safety:

### Key TypeScript Features:
- **Strict Mode**: Enabled for maximum type safety
- **No Implicit Any**: All variables must have explicit types
- **Unused Variables Check**: Prevents unused imports and variables
- **Path Mapping**: Clean imports using `@/` prefix for root directory

### Type Definitions:
- `types/card.ts`: Card component interfaces
- `types/api.ts`: Backend API response types
- `utils/api.ts`: Type-safe API client

### TypeScript Commands:
```bash
# Type checking (without compilation)
npm run type-check

# Watch mode for continuous type checking
npm run type-check:watch
```

## Code Quality & Linting

### ESLint Configuration
The project enforces strict TypeScript rules through ESLint:

```bash
# Run linting
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Enforced Rules:
- **@typescript-eslint/no-unused-vars**: Prevents unused variables
- **@typescript-eslint/no-explicit-any**: Discourages use of `any` type
- **@typescript-eslint/prefer-const**: Enforces const for non-reassigned variables
- **@typescript-eslint/no-non-null-assertion**: Prevents risky non-null assertions

**Note:** TypeScript rules are NOT to be disabled or removed. If you encounter linting errors, fix the underlying code issue rather than disabling the rule.

## Local Development

1.  Navigate to the `frontend` directory:
    ```bash
    cd cc-webapp/frontend
    # Or from project root: cd frontend
    ```

2.  Create environment configuration:
    ```bash
    # Create .env.local file with required environment variables
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
    ```

3.  Install dependencies:
    ```bash
    npm install
    # Or 'npm ci' for cleaner installs if package-lock.json is up-to-date
    ```

4.  Verify TypeScript and linting setup:
    ```bash
    # Check for type errors
    npm run type-check
    
    # Check for linting issues
    npm run lint
    ```

5.  Run the Next.js development server:
    ```bash
    npm run dev
    ```
The frontend will be available at `http://localhost:3000`. It expects the backend to be running, typically on `http://localhost:8000`.

## Building for Production
To create a production build:
```bash
npm run build
```
To serve the production build locally (after running `npm run build`):
```bash
npm start
# (This usually runs 'next start')
```

## Testing

The frontend includes both unit tests (Jest & React Testing Library) and end-to-end tests (Cypress).

-   **Unit/Component Tests (Jest):**
    ```bash
    npm test
    ```
    To run in watch mode:
    ```bash
    npm run test:watch
    ```
    Coverage reports are generated if configured in Jest setup.

-   **End-to-End Tests (Cypress):**
    *   To open the Cypress Test Runner (interactive mode):
        ```bash
        npm run cy:open
        ```
    *   To run Cypress tests headlessly (e.g., for CI):
        ```bash
        npm run cy:run
        ```
    *   Note: E2E tests expect the backend and frontend development servers to be running.

To run tests via Docker Compose (ensure services are up, e.g., `docker-compose up -d frontend backend` or the full stack):
-   **Unit/Component Tests (Jest):**
    ```bash
    # From the project root (cc-webapp directory)
    docker-compose exec frontend npm test -- --watchAll=false
    ```
-   **End-to-End Tests (Cypress):**
    Cypress tests require a running application. Ensure the full stack is up:
    ```bash
    # From the project root (cc-webapp directory)
    docker-compose up --build -d
    # Then open Cypress runner (from cc-webapp/frontend directory):
    # npm run cy:open
    # Or run headlessly via Docker Compose:
    docker-compose exec frontend npm run cy:run
    # Note: Running Cypress headlessly inside `docker-compose exec` might require
    # the frontend container to have browser dependencies (see frontend/Dockerfile comments)
    # or for Cypress to be configured to connect to a browser elsewhere.
    # For simplicity, `npm run cy:open` on the host against `http://localhost:3000` is often easiest for local E2E.
    ```

### Vulnerability Scanning (Frontend)

To check for known vulnerabilities in frontend dependencies, run the following command from the `cc-webapp/frontend` directory:

```bash
npm audit
```

For a CI environment, you might want the command to fail if vulnerabilities of a certain level are found:
```bash
npm audit --audit-level=high # Example: Fails if 'high' or 'critical' severity vulnerabilities are found
```
Alternatively, tools like `audit-ci` or `better-npm-audit` can be integrated into CI pipelines for more configurable behavior.

Regularly review the audit output and update packages as necessary, paying attention to breaking changes.

## Backend API Integration

### Type-Safe API Client

The frontend uses a type-safe API client located in `utils/api.ts`:

```typescript
import { apiClient } from '@/utils/api';
import type { ApiResponse, UserProfile } from '@/types/api';

// Example API call with type safety
const fetchUserProfile = async (): Promise<UserProfile> => {
  const response = await apiClient.get<ApiResponse<UserProfile>>('/api/user/profile');
  return response.data;
};
```

### Environment Variables

The API client automatically uses the `NEXT_PUBLIC_API_URL` environment variable:

```typescript
// Configured in utils/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

### Backend API Endpoints

The frontend application interacts with the backend services running on the configured API URL (default: `http://localhost:8000`).

Key API endpoints include:
-   `GET /health`: Backend health status
-   `GET /metrics`: Application metrics (Prometheus format)
-   `POST /api/auth/login`: User authentication
-   `GET /api/user/profile`: User profile data
-   Additional game logic, rewards, and notification endpoints

For full API documentation, visit `http://localhost:8000/docs` when the backend is running.

### Example API Usage

```typescript
// Type-safe login request
import { apiClient } from '@/utils/api';
import type { LoginRequest, LoginResponse } from '@/types/api';

const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
  return response.data;
};
```

## Backend Interaction

## Project Structure

-   `app/`: Next.js App Router pages and layouts (TypeScript/TSX)
-   `components/`: Shared React components with TypeScript interfaces
-   `hooks/`: Custom React hooks with TypeScript
-   `types/`: TypeScript type definitions and interfaces
    -   `card.ts`: Card component interfaces
    -   `api.ts`: Backend API response types
-   `utils/`: Utility functions and API client
    -   `api.ts`: Type-safe HTTP client for backend communication
-   `public/`: Static assets (images, sounds, etc.)
-   `__tests__/`: Jest unit/component tests (TypeScript)
-   `cypress/`: Cypress E2E tests
-   `jest.config.js`, `jest.setup.js`: Configuration for Jest
-   `cypress.json` (or `cypress.config.js`): Configuration for Cypress
-   `tailwind.config.js`, `postcss.config.mjs`: Configuration for Tailwind CSS
-   `tsconfig.json`: TypeScript configuration with strict rules
-   `.eslintrc.json`: ESLint configuration with TypeScript rules
-   `.env.local`: Environment variables (not tracked in git)

## Development Guidelines

### TypeScript Best Practices
1. **Always define explicit types** - Avoid `any` type
2. **Use interfaces for component props** - Create reusable type definitions
3. **Leverage type inference** - Let TypeScript infer types when possible
4. **Use strict null checks** - Handle undefined/null cases explicitly

### ESLint Compliance
- **Never disable TypeScript rules** - Fix code issues instead
- **Run linting before commits** - Ensure clean code quality
- **Address warnings promptly** - Don't let technical debt accumulate

### Environment Variables
- **Use NEXT_PUBLIC_ prefix** for client-side variables
- **Never commit .env.local** - Keep sensitive data secure
- **Document required variables** - Update this README when adding new env vars

### API Integration
- **Use the type-safe API client** - Located in `utils/api.ts`
- **Define response types** - Add interfaces to `types/api.ts`
- **Handle errors gracefully** - Implement proper error handling

## New Developer Onboarding

### Quick Start Checklist
1. ✅ **Clone the repository** and navigate to `cc-webapp/frontend`
2. ✅ **Create `.env.local`** with `NEXT_PUBLIC_API_URL=http://localhost:8000`
3. ✅ **Install dependencies** with `npm install`
4. ✅ **Verify setup** with `npm run type-check` and `npm run lint`
5. ✅ **Start development** with `npm run dev`

### Common Setup Issues

**TypeScript Errors:**
```bash
# If you see TypeScript errors, run:
npm run type-check
# Fix any type issues before proceeding
```

**ESLint Errors:**
```bash
# Check and fix linting issues:
npm run lint
npm run lint:fix  # Auto-fix when possible
```

**Environment Variables Missing:**
```bash
# Ensure .env.local exists with:
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

**Backend Connection Issues:**
- Ensure backend is running on `http://localhost:8000`
- Check network connectivity and firewall settings
- Verify API endpoints in browser: `http://localhost:8000/health`

### Code Quality Standards

All code must pass these checks before commit:
```bash
# Required checks
npm run type-check     # No TypeScript errors
npm run lint          # No ESLint errors
npm test             # All tests passing
```

**Remember:** 
- TypeScript rules are enforced and should NOT be disabled
- Use type-safe API client for all backend communication
- Follow the established project structure and naming conventions
