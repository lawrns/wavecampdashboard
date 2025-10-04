
# Implementation Plan: Web Component Shadow DOM Booking Widget

**Branch**: `002-decision-selectedapproach-web` | **Date**: September 27, 2025 | **Spec**: specs/002-decision-selectedapproach-web/spec.md
**Input**: Feature specification from `/specs/002-decision-selectedapproach-web/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Found spec at /specs/002-decision-selectedapproach-web/spec.md
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → Created research.md with all technical decisions documented
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file
   → Created data-model.md with entity definitions and validation rules
   → Created contracts/bookings-api.yaml with OpenAPI specifications
   → Created quickstart.md with complete test scenario
   → Updated CLAUDE.md with Web Component technology context
7. Re-evaluate Constitution Check section
   → All requirements satisfied - no violations found
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
   → Defined 35-45 task generation strategy with TDD ordering
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
WordPress site owners need to embed a booking widget that maintains visual consistency and secure API communication. The Web Component Shadow DOM approach will isolate the React widget from WordPress theme CSS while preserving existing booking functionality, payment processing (Stripe + bank wire), and API authentication patterns.

## Technical Context
**Language/Version**: TypeScript, React 18, WordPress PHP
**Primary Dependencies**: React/ReactDOM, esbuild, Tailwind CSS, Firebase/Firestore
**Storage**: Firebase Firestore (existing), WordPress plugin configuration
**Testing**: Jest/Vitest for unit, Playwright for E2E (WordPress + widget)
**Target Platform**: WordPress 5.0+, modern browsers with Custom Elements v1 support
**Project Type**: web (frontend React widget + WordPress backend integration)
**Performance Goals**: < 100ms widget initial render, < 120KB gz bundle, LCP < 2.5s
**Constraints**: Shadow DOM CSS isolation, CORS-enabled API communication, existing booking flow preservation
**Scale/Scope**: Single widget instance per WordPress page, supports 2-10 guests per booking

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Quality Gates
- [x] Unit coverage ≥ 70%, integration ≥ 60%, e2e (Playwright) runs planned for all core journeys
- [x] Lighthouse ≥ 90 Perf/Best/SEO, Accessibility ≥ 95 targets established
- [x] Definition of Done includes code + tests + docs + telemetry + rollback plan
- [x] Every user story will map to ≥1 automated e2e test and acceptance checklist

### Testing Strategy
- [x] Unit tests: Vitest/Jest for domain utilities and React components
- [x] Integration tests: API + data flows via Firebase Emulator Suite
- [x] E2E tests: Playwright on dashboard and WP widget (Dockerized WP test env)
- [x] Visual regression: Playwright screenshots + trace
- [x] Contract tests where helpful (Firestore rules & Functions I/O)

### Security & Privacy
- [x] Firebase rules follow principle of least privilege; tests prove no over-read/over-write
- [x] Stripe webhooks validated; no card data stored
- [x] WordPress: sanitize/escape all inputs/outputs, nonce checks, CSRF/REST permissions
- [x] WP coding standards (PHPCS) compliance
- [x] Secrets via environment managers; no secrets in repo

### Performance Budgets
- [x] LCP < 2.5s (desktop/mobile), TTI < 3.5s, CLS < 0.1
- [x] Widget payload < 120KB gz core; code-split; no layout shift on open
- [x] Server costs monitored; indexes for all hot Firestore queries

### Accessibility & i18n
- [x] WCAG AA compliance; full keyboard flows; ARIA labels; focus management on widget drawer
- [x] i18n: en/es; copy lives in translation files; currency & date localized

### Release & Ops
- [x] CI: lint, typecheck, build, test (unit/integration/e2e), Lighthouse CI, bundle-size check
- [x] CD: Preview per PR; production requires green gates
- [x] Observability: structured logs, error boundaries, Sentry (or equivalent), basic RUM
- [x] Feature flags for risky features; migration & rollback playbooks

### Architecture Consistency
- [x] Firebase (not Supabase) for auth/data/realtime
- [x] Domain-driven folders; API boundaries explicit; shared DTOs/types in /packages
- [x] One source of truth for pricing, availability, and policies

## Project Structure

### Documentation (this feature)
```
specs/002-decision-selectedapproach-web/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application (when "frontend" + "backend" detected)
wordpress-server/
├── wp-content/plugins/heiwa-booking-widget/
│   ├── heiwa-booking-widget.php
│   ├── assets/
│   │   ├── heiwa-widget.tailwind.css
│   │   └── heiwa-widget.surf.css
│   └── dist/heiwa-widget.web.js

src/
├── web-component/
│   ├── mount.tsx
│   └── element.ts
├── components/BookingWidget/ (existing)
└── lib/ (existing, including wpApi.ts)
```

**Structure Decision**: Option 2 - Web application (WordPress backend + React frontend widget)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - Custom Elements v1 browser support across target WordPress audience
   - Shadow DOM CSS injection patterns and WordPress theme compatibility
   - esbuild configuration for React + Web Components bundling
   - WordPress plugin enqueue patterns for Web Component scripts
   - CORS configuration for API communication in Web Component context

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research Custom Elements v1 browser support for WordPress 5.0+ audience"
     Task: "Research Shadow DOM CSS injection patterns for WordPress theme isolation"
     Task: "Research esbuild React + Web Components bundling configuration"
     Task: "Research WordPress plugin enqueue patterns for Web Component scripts"
     Task: "Research CORS configuration for API communication in Web Component context"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh cursor` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each API endpoint → contract test task [P] (parallelizable)
- Web Component setup → element creation task [P]
- React integration → mount component task [P]
- WordPress plugin → enqueue and shortcode tasks
- Each user story step → integration test task
- Build configuration → esbuild setup task
- CSS isolation → styling tasks

**Ordering Strategy**:
1. **Foundation Tasks** (sequential):
   - Web Component element creation
   - React mount component
   - Build configuration setup

2. **API & Testing Tasks** (parallel [P]):
   - Contract tests for all API endpoints
   - Integration test setup for WordPress environment

3. **WordPress Integration Tasks** (sequential):
   - Plugin enqueue setup
   - Shortcode implementation
   - Configuration localization

4. **Styling & Assets Tasks** (parallel [P]):
   - CSS compilation and isolation
   - Asset management setup

5. **End-to-End Flow Tasks** (sequential):
   - Complete booking flow implementation
   - Error handling and edge cases
   - Performance optimization

**Task Categories**:
- **🔧 Setup Tasks**: Build tools, project structure
- **🧪 Testing Tasks**: Contract tests, integration tests
- **⚛️ React Tasks**: Component creation, state management
- **🌐 Web Component Tasks**: Custom element, shadow DOM
- **🔗 API Tasks**: Endpoint integration, error handling
- **🎨 Styling Tasks**: CSS isolation, theme compatibility
- **📦 WordPress Tasks**: Plugin development, shortcode
- **✅ Validation Tasks**: End-to-end testing, performance

**Estimated Output**: 35-45 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [x] Phase 4: Implementation complete
- [x] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Heiwa Booking Suite Constitution v1.0.0 - See `.specify/memory/constitution.md`*
