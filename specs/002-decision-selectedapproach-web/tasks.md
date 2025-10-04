# Tasks: Web Component Shadow DOM Booking Widget

**Input**: Design documents from `/specs/002-decision-selectedapproach-web/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Found implementation plan with Web Component + Shadow DOM approach
   → Extract: TypeScript/React, esbuild, WordPress integration, Shadow DOM CSS isolation
2. Load optional design documents:
   → data-model.md: Booking, Guest, SurfCamp, RoomAssignment entities
   → contracts/: bookings-api.yaml with POST /bookings, GET /camps/{id}/availability
   → research.md: Custom Elements v1, Shadow DOM patterns, esbuild bundling
   → quickstart.md: Complete 8-step booking flow test scenario
3. Generate tasks by category:
   → Setup: Web component structure, build config, WordPress plugin skeleton
   → Tests: Contract tests for API endpoints, WordPress integration tests
   → Core: Custom element, React mount component, booking widget integration
   → Integration: CSS isolation, API communication, WordPress enqueue
   → Polish: Performance optimization, error handling, validation
4. Apply task rules:
   → Different files = mark [P] for parallel execution
   → Same file = sequential (no [P])
   → Tests before implementation (TDD approach)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests? Yes (2 API endpoints)
   → All entities have models? Yes (4 entities, but reuse existing Firebase models)
   → All endpoints implemented? Yes (via existing Next.js API)
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app structure**: `wordpress-server/` for WordPress, `src/` for React components
- **WordPress plugin**: `wordpress-server/wp-content/plugins/heiwa-booking-widget/`
- **Web component**: `src/web-component/` for new files, `src/components/BookingWidget/` for existing

## Phase 3.1: Setup
- [x] T001 Create web component directory structure in src/web-component/
- [x] T002 [P] Configure esbuild build script for Web Component bundle in scripts/build-widget-web.js
- [x] T003 [P] Set up WordPress plugin directory structure in wordpress-server/wp-content/plugins/heiwa-booking-widget/

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T004 [P] Contract test POST /api/bookings in tests/contract/test_bookings_post.yaml
- [x] T005 [P] Contract test GET /api/camps/{id}/availability in tests/contract/test_camps_availability.yaml
- [x] T006 [P] Integration test widget loading in WordPress environment in tests/integration/test_widget_loading.spec.ts
- [x] T007 [P] Integration test complete booking flow in tests/integration/test_booking_flow.spec.ts
- [x] T008 [P] Integration test CSS isolation from WordPress themes in tests/integration/test_css_isolation.spec.ts
- [x] T009 [P] Integration test API communication via wpApi.ts in tests/integration/test_api_communication.spec.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T010 Create custom element class in src/web-component/element.ts
- [x] T011 Create React mount component in src/web-component/mount.tsx
- [x] T012 Integrate with existing BookingWidget component in src/components/BookingWidget/BookingWidget.tsx
- [x] T013 Implement Shadow DOM CSS injection in src/web-component/element.ts
- [x] T014 Configure esbuild for React + Web Components bundle in scripts/build-widget-web.js
- [x] T015 Create WordPress plugin main file in wordpress-server/wp-content/plugins/heiwa-booking-widget/heiwa-booking-widget.php
- [x] T016 Implement WordPress shortcode registration in wordpress-server/wp-content/plugins/heiwa-booking-widget/heiwa-booking-widget.php
- [x] T017 Add WordPress script enqueue logic in wordpress-server/wp-content/plugins/heiwa-booking-widget/heiwa-booking-widget.php
- [x] T018 Configure window.heiwaWidgetConfig localization in wordpress-server/wp-content/plugins/heiwa-booking-widget/heiwa-booking-widget.php

## Phase 3.4: Integration
- [x] T019 Set up CSS asset compilation from existing Tailwind build in wordpress-server/wp-content/plugins/heiwa-booking-widget/assets/
- [x] T020 Implement CSS link injection for shadowRoot in src/web-component/element.ts
- [x] T021 Verify API communication using existing wpApi.ts patterns in src/web-component/mount.tsx
- [x] T022 Add error handling for network failures in src/web-component/element.ts
- [x] T023 Implement WordPress shortcode attribute parsing in wordpress-server/wp-content/plugins/heiwa-booking-widget/heiwa-booking-widget.php
- [x] T024 Add WordPress security sanitization and escaping in wordpress-server/wp-content/plugins/heiwa-booking-widget/heiwa-booking-widget.php

## Phase 3.5: Polish
- [x] T025 [P] Performance optimization for <100ms initial load in src/web-component/element.ts
- [x] T026 [P] Bundle size optimization and code splitting in scripts/build-widget-web.js
- [x] T027 [P] Add comprehensive error boundaries in src/web-component/mount.tsx
- [x] T028 [P] Implement accessibility features (ARIA labels, keyboard navigation) in src/web-component/element.ts
- [x] T029 [P] Add WordPress plugin readme and documentation in wordpress-server/wp-content/plugins/heiwa-booking-widget/readme.txt
- [x] T030 [P] Configure WordPress plugin update mechanism in wordpress-server/wp-content/plugins/heiwa-booking-widget/heiwa-booking-widget.php
- [x] T031 [P] Add feature flag for rollback capability in wordpress-server/wp-content/plugins/heiwa-booking-widget/heiwa-booking-widget.php
- [x] T032 [P] Implement telemetry and error reporting in src/web-component/element.ts
- [x] T033 [P] Add browser compatibility detection and fallbacks in src/web-component/element.ts
- [x] T034 Execute quickstart.md complete test scenario in wordpress-server/
- [x] T035 Final integration testing across WordPress themes in wordpress-server/

## Dependencies
- Tests (T004-T009) before implementation (T010-T024)
- T001 blocks T010-T011 (web component structure needed)
- T002 blocks T014 (build config needed)
- T003 blocks T015-T018 (WordPress plugin structure needed)
- T010-T014 blocks T019-T024 (core implementation needed for integration)
- Implementation (T001-T024) before polish (T025-T035)
- T034 blocks T035 (quickstart validation first)

## Parallel Execution Examples
```
# Launch T004-T009 together (all test files are independent):
Task: "Contract test POST /api/bookings in tests/contract/test_bookings_post.yaml"
Task: "Contract test GET /api/camps/{id}/availability in tests/contract/test_camps_availability.yaml"
Task: "Integration test widget loading in WordPress environment in tests/integration/test_widget_loading.spec.ts"
Task: "Integration test complete booking flow in tests/integration/test_booking_flow.spec.ts"
Task: "Integration test CSS isolation from WordPress themes in tests/integration/test_css_isolation.spec.ts"
Task: "Integration test API communication via wpApi.ts in tests/integration/test_api_communication.spec.ts"

# Launch T025-T033 together (all polish tasks modify different files):
Task: "Performance optimization for <100ms initial load in src/web-component/element.ts"
Task: "Bundle size optimization and code splitting in scripts/build-widget-web.js"
Task: "Add comprehensive error boundaries in src/web-component/mount.tsx"
Task: "Implement accessibility features in src/web-component/element.ts"
Task: "Add WordPress plugin readme in wordpress-server/wp-content/plugins/heiwa-booking-widget/readme.txt"
Task: "Configure WordPress plugin update mechanism in wordpress-server/wp-content/plugins/heiwa-booking-widget/heiwa-booking-widget.php"
Task: "Add feature flag for rollback capability in wordpress-server/wp-content/plugins/heiwa-booking-widget/heiwa-booking-widget.php"
Task: "Implement telemetry and error reporting in src/web-component/element.ts"
Task: "Add browser compatibility detection in src/web-component/element.ts"
```

## Notes
- [P] tasks = different files with no shared dependencies, can run in parallel
- Verify ALL tests fail before implementing any core functionality (TDD principle)
- Commit after each completed task for proper version control
- All file paths are absolute relative to repository root
- Avoid modifying the same files in parallel tasks
- Existing BookingWidget component should remain unchanged - only add Web Component wrapper

## Task Generation Rules Applied
*Applied during main() execution*

1. **From Contracts**:
   - bookings-api.yaml → 2 contract test tasks (T004-T005) [P]

2. **From Data Model**:
   - 4 entities identified but reuse existing Firebase models (no new model tasks needed)
   - Focus on Web Component integration with existing data flow

3. **From User Stories**:
   - 8-step booking flow → 4 integration test tasks (T006-T009) [P]
   - Quickstart validation → final integration task (T034)

4. **From Research**:
   - Custom Elements v1 setup → T010
   - esbuild configuration → T002, T014
   - WordPress patterns → T003, T015-T018
   - Shadow DOM CSS → T013, T019-T020

5. **Ordering**:
   - Setup (T001-T003) → Tests (T004-T009) → Core (T010-T018) → Integration (T019-T024) → Polish (T025-T035)
   - Dependencies prevent parallel execution where files would conflict

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (2 API endpoints → 2 contract tests)
- [x] All entities have model tasks (existing Firebase models reused)
- [x] All tests come before implementation (TDD: tests T004-T009 before core T010-T024)
- [x] Parallel tasks truly independent (different file paths, no shared state)
- [x] Each task specifies exact file path (all tasks include full paths)
- [x] No task modifies same file as another [P] task (parallel tasks target different files)
