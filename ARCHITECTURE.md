# BunkSafe Mobile - Architecture Documentation

## 🏗️ Architecture Overview

BunkSafe follows **Clean Architecture** principles with clear separation of concerns across multiple layers. The architecture is designed to be scalable, maintainable, and testable.

## 📁 Project Structure

```
src/
├── core/                    # Core functionality and shared utilities
│   ├── constants/          # Application constants
│   ├── di/                 # Dependency injection container
│   ├── errors/             # Error handling and custom exceptions
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions and helpers
│   └── index.ts            # Core module exports
│
├── domain/                  # Business logic layer (Clean Architecture)
│   ├── model/              # Domain models and entities
│   ├── repository/         # Repository interfaces
│   ├── usecase/            # Business use cases
│   └── index.ts            # Domain layer exports
│
├── data/                    # Data access layer
│   ├── local/              # Local storage implementations
│   ├── repository/         # Repository implementations
│   ├── services/           # External service integrations
│   └── index.ts            # Data layer exports
│
├── presentation/            # UI and presentation layer
│   ├── navigation/         # Navigation logic
│   ├── ui/                 # UI components and screens
│   │   ├── components/     # Reusable UI components
│   │   └── screens/        # Screen components
│   ├── viewmodel/          # View models and state management
│   └── index.ts            # Presentation layer exports
│
├── config/                  # Configuration files
└── index.ts                # Main source exports
```

## 🔄 Architecture Layers

### 1. Core Layer (`src/core/`)
**Purpose**: Shared functionality, utilities, and cross-cutting concerns

- **Constants**: Application-wide constants and configuration
- **DI Container**: Dependency injection for loose coupling
- **Error Handling**: Centralized error management
- **Types**: TypeScript definitions for navigation and common types
- **Utils**: Validation, string manipulation, and helper functions

### 2. Domain Layer (`src/domain/`)
**Purpose**: Business logic and rules (framework-independent)

- **Models**: Core business entities (User, etc.)
- **Repository Interfaces**: Contracts for data access
- **Use Cases**: Business operations and workflows
- **No dependencies** on external frameworks or UI

### 3. Data Layer (`src/data/`)
**Purpose**: Data access and external service integration

- **Repository Implementations**: Concrete data access implementations
- **Services**: Firebase, API, and external service integrations
- **Local Storage**: Device storage management
- **Implements domain repository interfaces**

### 4. Presentation Layer (`src/presentation/`)
**Purpose**: UI components, screens, and user interaction

- **Navigation**: App routing and screen management
- **UI Components**: Reusable interface elements
- **Screens**: Full-screen components organized by feature
- **View Models**: State management and UI logic

## 🔧 Key Design Patterns

### Dependency Injection
```typescript
// DIContainer manages all dependencies
const loginUseCase = DIContainer.loginUseCase;
const authRepo = DIContainer.authRepository;
```

### Repository Pattern
```typescript
// Domain defines interface
interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthResult>;
}

// Data layer implements
class AuthRepositoryImpl implements AuthRepository {
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    // Implementation details
  }
}
```

### Use Case Pattern
```typescript
// Each business operation is a use case
class LoginUseCase {
  constructor(private authRepository: AuthRepository) {}
  
  async execute(credentials: LoginCredentials): Promise<AuthResult> {
    // Business logic here
  }
}
```

### MVVM Pattern
```typescript
// View Model manages UI state
export const useAuthViewModel = (loginUseCase, getCurrentUserUseCase) => {
  const [state, setState] = useState<AuthState>({...});
  
  const login = async (credentials) => {
    // Handle UI state and call use case
  };
  
  return { state, login };
};
```

## 🚀 Benefits of This Architecture

### ✅ Separation of Concerns
- Each layer has a single responsibility
- Business logic is isolated from UI and data access
- Easy to modify one layer without affecting others

### ✅ Testability
- Domain layer can be tested without UI or database
- Use cases can be tested in isolation
- Mock implementations for testing

### ✅ Scalability
- Easy to add new features following established patterns
- Clear structure for team development
- Modular design allows parallel development

### ✅ Maintainability
- Clear file organization and naming conventions
- Centralized error handling and validation
- Consistent patterns across the application

### ✅ Flexibility
- Easy to swap implementations (e.g., different databases)
- Framework-independent business logic
- Configurable dependency injection

## 📋 Development Guidelines

### Adding New Features
1. **Define domain models** in `src/domain/model/`
2. **Create use cases** in `src/domain/usecase/`
3. **Implement repositories** in `src/data/repository/`
4. **Build UI components** in `src/presentation/ui/`
5. **Add to DI container** in `src/core/di/DIContainer.ts`

### File Naming Conventions
- **PascalCase** for classes and components: `LoginUseCase.ts`, `LoginScreen.tsx`
- **camelCase** for functions and variables: `validateEmail`, `userState`
- **UPPER_CASE** for constants: `APP_CONFIG`, `VALIDATION_RULES`
- **kebab-case** for file names when needed: `auth-repository.ts`

### Import/Export Guidelines
- Use **barrel exports** (`index.ts`) for clean imports
- Import from layer index files: `import { LoginUseCase } from '../domain'`
- Avoid deep imports: ❌ `import { User } from '../domain/model/User'`
- Use clean imports: ✅ `import { User } from '../domain'`

## 🔍 Error Handling Strategy

### Centralized Error Management
```typescript
// Custom error types
class AuthenticationError extends AppError {
  readonly code = 'AUTH_ERROR';
  readonly statusCode = 401;
}

// Error handler utility
const error = ErrorHandler.handle(unknownError);
const message = ErrorHandler.getDisplayMessage(error);
```

### Error Propagation
- **Domain layer**: Throws specific business errors
- **Data layer**: Catches and wraps external errors
- **Presentation layer**: Handles errors for user display

## 🧪 Testing Strategy

### Unit Tests
- **Domain layer**: Test use cases and business logic
- **Data layer**: Test repository implementations
- **Utils**: Test validation and utility functions

### Integration Tests
- **API integration**: Test Firebase service integration
- **Navigation flow**: Test screen transitions
- **End-to-end**: Test complete user workflows

## 🔄 State Management

### Local State
- Component-level state with `useState`
- Form state management
- UI interaction state

### Global State
- User authentication state via view models
- App-wide configuration
- Navigation state

### Persistent State
- User preferences in local storage
- Authentication tokens
- Offline data caching

## 📱 Platform Considerations

### React Native Specific
- Platform-specific imports when needed
- Native module integration through data layer
- Performance optimization for mobile

### Web Compatibility
- Responsive design patterns
- Web-specific navigation handling
- Progressive Web App features

This architecture provides a solid foundation for building scalable, maintainable mobile applications while following industry best practices and clean code principles.