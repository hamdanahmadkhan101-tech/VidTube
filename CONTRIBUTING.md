# Contributing to VidTube

Thank you for your interest in contributing to VidTube! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Follow the project's coding standards
- Write clear, maintainable code

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit with clear messages
7. Push to your fork
8. Create a Pull Request

## Development Setup

Follow the setup instructions in [README.md](./README.md).

## Coding Standards

### JavaScript/React

- Use ES6+ features
- Follow existing code style
- Use meaningful variable/function names
- Add comments for complex logic
- Keep functions small and focused

### File Naming

- Components: `PascalCase.jsx` (e.g., `VideoCard.jsx`)
- Utilities: `camelCase.js` (e.g., `apiErrorHandler.js`)
- Constants: `camelCase.js` (e.g., `constants.js`)

### Code Organization

```javascript
// 1. Imports (external first, then internal)
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';

// 2. Component/Function definition
export default function ComponentName() {
  // 3. Hooks
  const [state, setState] = useState();
  
  // 4. Handlers
  const handleClick = () => { ... };
  
  // 5. Effects
  useEffect(() => { ... }, []);
  
  // 6. Render
  return <div>...</div>;
}
```

## Commit Messages

Follow conventional commits:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(video): add video caching to store
fix(auth): resolve token refresh issue
docs(api): update authentication endpoint docs
```

## Pull Request Process

1. **Update Documentation**: Update relevant docs if needed
2. **Test Changes**: Ensure all tests pass (when implemented)
3. **Check Linting**: Run `npm run lint` and fix issues
4. **Write Clear PR Description**:
   - What changes were made?
   - Why were they made?
   - How to test?
   - Screenshots (for UI changes)

5. **Keep PRs Focused**: One feature/fix per PR

## Testing Guidelines

### Backend Testing (Future)

```javascript
// Example test structure
describe('Video Service', () => {
  it('should create a video', async () => {
    // Test implementation
  });
});
```

### Frontend Testing (Future)

```javascript
// Example component test
import { render, screen } from '@testing-library/react';
import VideoCard from './VideoCard';

test('renders video title', () => {
  render(<VideoCard video={mockVideo} />);
  expect(screen.getByText('Video Title')).toBeInTheDocument();
});
```

## Code Review Checklist

- [ ] Code follows project standards
- [ ] Tests pass (when implemented)
- [ ] No linting errors
- [ ] Documentation updated
- [ ] Breaking changes documented
- [ ] Performance considerations addressed
- [ ] Security implications reviewed

## Reporting Issues

Use GitHub Issues with:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Screenshots/logs if applicable

## Feature Requests

- Clearly describe the feature
- Explain the use case
- Consider implementation complexity
- Discuss with maintainers first for large features

## Questions?

Open a GitHub Discussion or contact maintainers.

---

Thank you for contributing! 🎉
