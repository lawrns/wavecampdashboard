# Claude Code Agent Context - Heiwa Booking Suite

## Project Overview
Heiwa is a surf camp booking platform with a Next.js admin dashboard and WordPress-integrated booking widget. The current project focuses on migrating the WordPress widget from UMD bundles to Web Components with Shadow DOM for better CSS isolation and React compatibility.

## Technology Stack

### Frontend (Next.js Dashboard)
- **Framework**: Next.js 15, TypeScript, React 18
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: React hooks, Context API
- **Testing**: Jest, React Testing Library, Playwright E2E

### Backend (Firebase)
- **Platform**: Firebase (Firestore, Auth, Functions, Storage)
- **APIs**: REST endpoints via Next.js API routes
- **Security**: Firebase Rules, API key authentication

### WordPress Integration (Web Components)
- **Technology**: Custom Elements v1, Shadow DOM
- **Build Tool**: esbuild (IIFE bundles)
- **Styling**: Isolated CSS via shadowRoot injection
- **Communication**: Fetch API with CORS-enabled endpoints

### Development Tools
- **Linting**: ESLint, Stylelint
- **Formatting**: Prettier
- **CI/CD**: GitHub Actions with Lighthouse CI
- **Testing**: Playwright for E2E, Vitest for unit tests

## Key Patterns & Conventions

### Code Organization
```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable React components
├── lib/                 # Utilities and configurations
└── hooks/               # Custom React hooks

wordpress-server/        # Local WordPress development
├── wp-content/plugins/heiwa-booking-widget/
└── wp-content/themes/   # WordPress themes for testing
```

### API Communication (WordPress Widget)
```typescript
// wpApi.ts pattern maintained in Web Component
const wpFetch = async (endpoint: string, options?: RequestInit) => {
  const config = window.heiwaWidgetConfig;
  const response = await fetch(`${config.settings.apiEndpoint}${endpoint}`, {
    headers: {
      'X-Heiwa-API-Key': config.settings.apiKey,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  return response.json();
};
```

### Web Component Architecture
```typescript
// Custom element with Shadow DOM
class HeiwaBookingWidget extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });

    // CSS injection for isolation
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = `${pluginUrl}/assets/heiwa-widget.tailwind.css`;
    shadow.appendChild(cssLink);

    // React mounting
    const root = ReactDOM.createRoot(shadow);
    root.render(<BookingWidget />);
  }
}
```

### Testing Strategy
- **Unit Tests**: Component logic, utilities, API functions
- **Integration Tests**: API endpoints, Firebase operations
- **E2E Tests**: Complete booking flows in WordPress environment
- **Visual Tests**: Playwright screenshots for UI consistency

## Recent Changes (Last 3)

### 2024-09-27: Web Component Migration Planning
- Completed implementation planning for Web Component widget migration
- Established Shadow DOM CSS isolation strategy
- Defined API contracts and data models for WordPress integration
- Set up testing scenarios for complete booking flows

### 2024-09-27: Specification Finalization
- Resolved all clarification markers in feature specification
- Confirmed Stripe + bank wire payment methods
- Established < 100ms widget load time performance target
- Set existing WordPress instance as test environment

### 2024-09-27: Architecture Decision
- Selected Web Component + Shadow DOM approach over UMD bundles
- Confirmed CSS isolation prevents WordPress theme interference
- Validated API communication compatibility with existing patterns
- Established migration path with feature flag rollback capability

## Common Development Workflows

### Building Web Component Bundle
```bash
# Build for production
npm run build:widget

# Development with watch
npm run dev:widget

# Deploy to WordPress plugin
cp dist/heiwa-widget.web.js wordpress-server/wp-content/plugins/heiwa-booking-widget/
```

### Testing WordPress Integration
```bash
# Start Next.js API
npm run dev

# Start WordPress (in separate terminal)
cd wordpress-server && php -S localhost:8000

# Run E2E tests
npx playwright test wordpress-widget.spec.ts
```

### Adding New Booking Features
1. Update data models in `data-model.md`
2. Add API endpoints in Next.js `/api/`
3. Update React components in `src/components/BookingWidget/`
4. Add corresponding Web Component integration
5. Write tests for all layers
6. Update contracts and quickstart documentation

## Quality Gates & Standards

### Code Quality
- **Linting**: Must pass ESLint with zero errors
- **TypeScript**: Strict type checking enabled
- **Testing**: 70%+ coverage, all E2E tests passing
- **Performance**: Lighthouse scores ≥ 90

### WordPress Integration
- **Security**: All inputs sanitized, nonces verified
- **Compatibility**: Works with WordPress 5.0+, modern browsers
- **Performance**: < 100ms initial load, < 120KB bundle
- **Accessibility**: WCAG AA compliant, keyboard navigation

### Deployment
- **CI**: Automated testing and building
- **CD**: Preview deployments for all PRs
- **Monitoring**: Error tracking with Sentry
- **Rollback**: Feature flags for safe deployments

## Troubleshooting Guide

### Web Component Issues
- **Not loading**: Check WordPress enqueue, verify bundle path
- **Styling broken**: Inspect shadow DOM, verify CSS links
- **API failures**: Check CORS headers, API key configuration
- **React errors**: Verify React version compatibility

### Common Build Issues
- **Bundle size**: Check for unused imports, optimize assets
- **TypeScript errors**: Run `npm run type-check` for details
- **Test failures**: Use `npx playwright test --debug` for E2E issues

### Performance Problems
- **Slow loading**: Check bundle size, optimize images
- **Layout shifts**: Verify CSS containment in shadow DOM
- **Memory leaks**: Check React component cleanup

Remember: Always follow the Research → Plan → Implement workflow. Never jump straight to coding without proper planning and documentation.



