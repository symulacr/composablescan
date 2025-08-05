# Contributing to ComposableScan

Thank you for your interest in contributing to ComposableScan! This document provides guidelines and information about contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Community](#community)

## Code of Conduct

This project adheres to a code of conduct adapted from the [Contributor Covenant](https://www.contributor-covenant.org/). By participating, you are expected to uphold this code.

### Our Standards

**Positive behaviors include:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors include:**
- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Public or private harassment
- Publishing others' private information without permission
- Any conduct that could reasonably be considered inappropriate

## Getting Started

### Prerequisites

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (or yarn/pnpm equivalent)
- **Git**: Latest stable version
- **Code Editor**: VS Code recommended with TypeScript and ESLint extensions

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/composablescan.git
   cd composablescan
   ```

3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-owner/composablescan.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Set up environment variables**:
   ```bash
   cp env.example .env.local
   ```

6. **Start the development server**:
   ```bash
   npm run dev
   ```

7. **Verify the setup** by visiting [http://localhost:3000](http://localhost:3000)

## Development Workflow

### Branching Strategy

We use a simplified Git flow:

- **`main`**: Production-ready code
- **`feature/*`**: New features or enhancements
- **`fix/*`**: Bug fixes
- **`docs/*`**: Documentation updates
- **`refactor/*`**: Code refactoring without feature changes

### Creating a Feature Branch

```bash
# Ensure you're on main and have the latest changes
git checkout main
git pull upstream main

# Create a new feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Keep commits small and focused**: Each commit should represent a single logical change
2. **Write clear commit messages**: Use the conventional commit format:
   ```
   type(scope): brief description
   
   Longer explanation if needed
   
   Fixes #issue-number
   ```

3. **Test your changes**: Run tests before committing:
   ```bash
   npm test
   npm run type-check
   npm run lint
   ```

### Staying Up to Date

Regularly sync your fork with the upstream repository:

```bash
git checkout main
git pull upstream main
git push origin main
```

For long-running feature branches, rebase regularly:

```bash
git checkout feature/your-feature
git rebase main
```

## Coding Standards

### TypeScript Guidelines

- **Use strict TypeScript**: Enable all strict type checking options
- **Explicit types**: Prefer explicit types over `any` or implicit types
- **Interface over Type**: Use `interface` for object shapes, `type` for unions/intersections
- **Consistent naming**: Use PascalCase for components, camelCase for functions/variables

```typescript
// Good
interface SearchResult {
  type: 'block' | 'transaction' | 'rollup'
  data: unknown
  query: string
}

const handleSearch = (query: string): Promise<SearchResult[]> => {
  // implementation
}

// Avoid
const handleSearch = (query: any) => {
  // implementation
}
```

### React Component Guidelines

- **Functional components**: Use function declarations with TypeScript
- **Props interface**: Always define props interface
- **Component organization**: Props → hooks → handlers → render
- **Naming**: Use PascalCase for components, camelCase for props

```typescript
interface SearchInputProps {
  query: string
  onQueryChange: (query: string) => void
  isLoading?: boolean
}

export default function SearchInput({ query, onQueryChange, isLoading = false }: SearchInputProps) {
  // hooks
  const [isActive, setIsActive] = useState(false)
  
  // handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onQueryChange(e.target.value)
  }
  
  // render
  return (
    <input 
      value={query}
      onChange={handleInputChange}
      disabled={isLoading}
    />
  )
}
```

### Styling Guidelines

- **Tailwind CSS**: Use utility classes over custom CSS
- **Consistent spacing**: Use Tailwind's spacing scale (4, 8, 12, 16, etc.)
- **Responsive design**: Mobile-first approach with responsive utilities
- **Color palette**: Use the defined color palette from the theme

```typescript
// Good
<div className="flex items-center gap-4 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">

// Avoid custom CSS unless absolutely necessary
<div className="custom-card">
```

### API Integration Guidelines

- **Environment-based URLs**: Always use configuration for endpoints
- **Error handling**: Comprehensive error handling with user-friendly messages
- **Type safety**: Define response types for all API calls
- **Loading states**: Provide feedback for async operations

```typescript
// Good
import { getApiUrl } from '@/lib/config'

interface BlockResponse {
  height: number
  hash: string
  timestamp: number
}

const fetchBlock = async (height: number): Promise<BlockResponse> => {
  try {
    const response = await fetch(getApiUrl(`/availability/block/${height}`))
    if (!response.ok) {
      throw new Error(`Block ${height} not found`)
    }
    return await response.json()
  } catch (error) {
    throw new Error(`Failed to fetch block: ${error.message}`)
  }
}
```

## Testing Guidelines

### Unit Tests

- **Test file naming**: `*.test.ts` or `*.test.tsx`
- **Test organization**: Use `describe` blocks for grouping related tests
- **Assertions**: Use descriptive test names and clear assertions
- **Mocking**: Mock external dependencies and API calls

```typescript
describe('SearchInput', () => {
  it('should call onQueryChange when input value changes', () => {
    const mockOnQueryChange = vi.fn()
    render(<SearchInput query="" onQueryChange={mockOnQueryChange} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test query' } })
    
    expect(mockOnQueryChange).toHaveBeenCalledWith('test query')
  })
})
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test SearchInput.test.tsx
```

### Integration Tests

- Test user workflows end-to-end
- Focus on critical user paths (search, display results)
- Mock external APIs consistently

## Pull Request Process

### Before Submitting

1. **Ensure tests pass**: All tests should pass locally
2. **Update documentation**: Update README.md if needed
3. **Check TypeScript**: No type errors should exist
4. **Lint your code**: Follow the project's linting rules
5. **Test manually**: Verify your changes work as expected

### Pull Request Template

When creating a pull request, use this template:

```markdown
## Summary
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to change)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] All existing tests pass

## Screenshots (if applicable)
Include screenshots for UI changes.

## Checklist
- [ ] Code follows the project's coding standards
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console.log statements in production code
- [ ] Environment variables properly handled
```

### Review Process

1. **Automated checks**: CI/CD will run tests and linting
2. **Code review**: At least one maintainer will review your code
3. **Feedback**: Address any review comments
4. **Approval**: Once approved, a maintainer will merge your PR

## Issue Reporting

### Bug Reports

When reporting bugs, include:

- **Bug description**: Clear, concise description of the issue
- **Steps to reproduce**: Detailed steps to reproduce the bug
- **Expected behavior**: What you expected to happen
- **Actual behavior**: What actually happened
- **Environment**: Browser, OS, Node.js version
- **Screenshots**: If applicable
- **Error messages**: Full error messages or console logs

### Feature Requests

For feature requests, include:

- **Feature description**: Clear description of the proposed feature
- **Use case**: Why this feature would be valuable
- **Proposed solution**: If you have ideas for implementation
- **Alternatives**: Any alternative solutions you've considered

### Issue Labels

We use these labels to categorize issues:

- **`bug`**: Something isn't working correctly
- **`enhancement`**: New feature or improvement
- **`documentation`**: Documentation needs
- **`good first issue`**: Good for newcomers
- **`help wanted`**: Community help needed
- **`question`**: Further information requested

## Community

### Communication Channels

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For general questions and community discussion
- **Code Review**: Primary collaboration happens in pull requests

### Getting Help

- **Documentation**: Check the README.md and wiki first
- **Search Issues**: Your question might already be answered
- **Create Discussion**: For general questions about usage
- **Create Issue**: For specific bugs or feature requests

### Recognition

Contributors are recognized through:

- **Contributors file**: All contributors are listed
- **Release notes**: Significant contributions are highlighted
- **GitHub insights**: Contribution graphs show your impact

## Development Resources

### Useful Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run type-check      # Check TypeScript
npm run format          # Format code with Prettier

# Testing
npm test                # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
```

### Project Structure Reference

```
src/
├── app/                 # Next.js App Router
├── components/          # React components
│   ├── search/         # Search-related components
│   ├── scan/       # Data display components
│   └── ui/             # Reusable UI components
├── services/           # External integrations
├── hooks/              # Custom React hooks
├── contexts/           # React context providers
├── types/              # TypeScript definitions
└── lib/                # Utilities and configuration
```

### Key Dependencies

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **shadcn/ui**: Component library
- **Vitest**: Testing framework
- **ESLint**: Code linting
- **Prettier**: Code formatting

## Thank You

Thank you for contributing to ComposableScan! Your efforts help make blockchain exploration more accessible and user-friendly for the entire Espresso Network community.

---

*This contributing guide is a living document. If you find ways to improve it, please submit a pull request!*