# VidTube Frontend

Modern React 19 frontend for VidTube video sharing platform, built with Vite and Tailwind CSS.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env  # Create .env file
# Add: VITE_API_URL=http://localhost:5000/api/v1

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **React 19** - Latest React with concurrent features
- **Vite 7** - Next-generation build tool
- **Tailwind CSS 4** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React Router DOM 7** - Client-side routing
- **React Hook Form + Zod** - Form validation
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications
- **Lucide React** - Icon library

## Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── common/         # Shared components (ErrorBoundary, Loading, etc.)
│   ├── layout/         # Layout components (Header)
│   ├── social/         # Social features (Likes, Comments, Subscriptions)
│   ├── ui/             # UI primitives (Button, Input)
│   ├── user/           # User-related components
│   └── video/          # Video-related components
│
├── pages/              # Route pages
│   ├── auth/           # Login, Register
│   ├── channel/        # Channel/Profile pages
│   ├── dashboard/      # Creator dashboard
│   ├── video/          # Video pages (Detail, Upload, Edit, Search)
│   └── ...
│
├── store/              # Zustand stores
│   ├── authStore.js    # Authentication state
│   ├── videoStore.js   # Video state & caching
│   └── uiStore.js      # UI preferences
│
├── hooks/              # Custom React hooks
│   ├── useAuth.js      # Auth hook
│   ├── useDebounce.js  # Debounce hook
│   ├── useFetchWithCache.js  # API caching hook
│   ├── useLocalStorage.js    # LocalStorage hook
│   └── useVideoPagination.js # Video pagination hook
│
├── services/           # API service layer
│   ├── authService.js
│   ├── videoService.js
│   ├── userService.js
│   └── ...
│
├── utils/              # Utility functions
│   ├── apiErrorHandler.js  # Centralized error handling
│   ├── formatters.js       # Data formatting utilities
│   └── constants.js        # App constants
│
└── validators/         # Zod validation schemas
    └── auth.validator.js
```

## Key Features

### State Management (Zustand)
- **AuthStore**: User authentication state
- **VideoStore**: Video data, search, caching
- **UIStore**: Theme, player preferences, UI state

### Performance Optimizations
- **Code Splitting**: Route-based lazy loading
- **Image Lazy Loading**: LazyImage component
- **Response Caching**: Video caching in store
- **Debounced Search**: Optimized search inputs
- **Bundle Optimization**: Vendor chunk separation

### User Experience
- **Loading States**: Skeleton loaders for all views
- **Empty States**: User-friendly empty state components
- **Error Handling**: Centralized error handling with retry
- **Toast Notifications**: React Hot Toast for feedback

### Accessibility
- **WCAG AA Compliant**: Full accessibility support
- **Keyboard Navigation**: Full keyboard support including video player shortcuts
- **Screen Readers**: ARIA labels and semantic HTML
- **Focus Management**: Proper focus handling
- **Skip to Content**: Accessibility navigation

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

For production:
```env
VITE_API_URL=https://api.yourdomain.com/api/v1
```

## Available Scripts

- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Development Guidelines

### Component Structure
```jsx
import { useState, useEffect } from 'react';
import { useCustomHook } from '../hooks/useCustomHook';
import Button from '../ui/Button';

export default function ComponentName() {
  // 1. Hooks
  const [state, setState] = useState();
  
  // 2. Event handlers
  const handleClick = () => { ... };
  
  // 3. Effects
  useEffect(() => { ... }, []);
  
  // 4. Render
  return <div>...</div>;
}
```

### State Management
- Use Zustand for global state (auth, videos, UI)
- Use useState for component-local state
- Use custom hooks for reusable logic

### Styling
- Use Tailwind CSS utility classes
- Follow existing component patterns
- Maintain dark theme consistency

### Form Validation
- Use React Hook Form with Zod resolvers
- Validate on both client and server
- Show clear error messages

## Keyboard Shortcuts

### Video Player
- `Space` - Play/Pause
- `Arrow Left/Right` - Seek backward/forward 5 seconds
- `Arrow Up/Down` - Volume up/down
- `M` - Toggle mute
- `F` - Toggle fullscreen

## Performance Tips

- Components are lazy-loaded by route
- Images use lazy loading
- API responses are cached in Zustand store
- Search inputs are debounced (500ms)
- Large lists use pagination

## Accessibility Features

- All interactive elements are keyboard accessible
- ARIA labels on all components
- Screen reader support
- Focus visible indicators
- Reduced motion support
- High contrast mode support

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Development Server Issues
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

## Related Documentation

- [Main README](../README.md)
- [API Documentation](../API_DOCUMENTATION.md)
- [Architecture](../ARCHITECTURE.md)
- [Contributing](../CONTRIBUTING.md)

## License

[Add your license]
