# Research Findings: Web Component Shadow DOM Booking Widget

## Custom Elements v1 Browser Support

**Decision**: Target modern browsers with Custom Elements v1 support (Chrome 54+, Firefox 63+, Safari 10.1+, Edge 79+)

**Rationale**:
- WordPress 5.0+ (released December 2018) minimum requirement aligns with modern browser adoption
- Custom Elements v1 has 92%+ global browser support according to caniuse.com
- WordPress core itself requires similar browser support levels
- Progressive enhancement possible with fallback messaging

**Alternatives considered**:
- Custom Elements v0: Too old, inconsistent API, poor WordPress compatibility
- Polyfills: Would add complexity and bundle size without clear benefit
- iframe fallback: Technically simpler but UX inferior

## Shadow DOM CSS Injection Patterns

**Decision**: Use `<link rel="stylesheet">` elements injected into shadowRoot for CSS isolation

**Rationale**:
- Maintains exact visual parity with React app
- Prevents WordPress theme CSS interference
- Simple, reliable pattern with good browser support
- Allows separate caching of CSS assets

**Alternatives considered**:
- Inline `<style>` tags: Increases bundle size, harder to cache separately
- Constructable stylesheets: Excellent performance but Safari support still limited
- CSS modules: Would require significant refactoring of existing Tailwind setup

## esbuild React + Web Components Bundling

**Decision**: IIFE format with React bundled, external CSS assets

**Rationale**:
- IIFE ensures global registration of custom element
- React bundling avoids version conflicts with potential WP React instances
- External CSS allows separate caching and WordPress asset management
- esbuild provides fast builds and small bundle sizes

**Alternatives considered**:
- ESM modules: Browser support inconsistent, WordPress enqueue complexity
- UMD format: Previous approach that caused React hook issues
- Vite: Good for development but adds complexity for WordPress integration

## WordPress Plugin Enqueue Patterns

**Decision**: Standard WordPress enqueue with version-based cache busting

**Rationale**:
- Follows WordPress best practices for asset management
- File modification time for cache busting ensures updates propagate
- wp_localize_script preserves existing API configuration pattern
- Standard shortcode registration maintains WordPress conventions

**Alternatives considered**:
- Inline script injection: Harder to cache, violates WP best practices
- Dynamic script loading: Unnecessary complexity, potential race conditions
- Asset bundling in PHP: Mixes concerns, harder to maintain

## CORS Configuration for Web Component Context

**Decision**: Maintain existing CORS configuration, no changes needed

**Rationale**:
- Shadow DOM does not affect JavaScript networking layer
- fetch() API behavior identical to direct document scripts
- Existing CORS headers on Next.js API endpoints sufficient
- WordPress plugin wp_localize_script provides same config surface

**Alternatives considered**:
- Custom CORS proxy: Unnecessary complexity, potential performance impact
- JSONP fallback: Security concerns, deprecated pattern
- Server-side proxy: Adds infrastructure complexity without benefit

## Performance Implications

**Decision**: Target < 100ms initial render, < 120KB gzipped bundle

**Rationale**:
- Shadow DOM has negligible performance overhead
- Web Components avoid React mounting conflicts
- Bundle splitting opportunities for better caching
- Aligns with existing performance budgets

**Alternatives considered**:
- React.lazy for code splitting: May increase initial bundle complexity
- Service worker caching: Overkill for widget use case
- Pre-rendering: Not applicable for dynamic booking flows

## Security Considerations

**Decision**: Leverage existing security patterns, no changes required

**Rationale**:
- Firebase rules and Stripe validation remain unchanged
- WordPress sanitization/escaping applies to shortcode attributes
- API authentication via existing wpApi.ts patterns
- Shadow DOM provides additional CSS isolation security

**Alternatives considered**:
- Content Security Policy headers: May conflict with existing WordPress setups
- Subresource integrity: Complex for dynamic widget updates
- Additional nonce validation: Current patterns sufficient

## Migration Strategy

**Decision**: Feature flag deployment with rollback capability

**Rationale**:
- Allows gradual rollout and testing in production
- Easy rollback to existing UMD approach if issues arise
- Maintains backward compatibility during transition
- Follows established release patterns

**Alternatives considered**:
- Big bang deployment: Higher risk, harder to debug issues
- Parallel deployment: Unnecessary complexity for single widget
- A/B testing: Overkill for WordPress integration feature



