#!/bin/bash

echo "🚀 Setting up comprehensive testing environment for Heiwa House Admin Dashboard"
echo "============================================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in project root directory. Please run from the project root."
    exit 1
fi

print_status "Step 1: Installing dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

print_status "Step 2: Installing Playwright browsers..."
npx playwright install
if [ $? -eq 0 ]; then
    print_success "Playwright browsers installed successfully"
else
    print_error "Failed to install Playwright browsers"
    exit 1
fi

print_status "Step 3: Setting up test data directories..."
mkdir -p tests/results/load-test-results
mkdir -p tests/results/performance-reports
mkdir -p tests/results/security-reports
mkdir -p tests/fixtures/large-dataset
print_success "Test directories created"

print_status "Step 4: Configuring environment variables..."
if [ ! -f ".env.test" ]; then
    cat > .env.test << EOF
# Test Environment Configuration
NODE_ENV=test
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
SUPABASE_SERVICE_ROLE_KEY=test-service-key

# Test Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres

# Test Server Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3005

# Load Testing Configuration
LOAD_TEST_DURATION=300
LOAD_TEST_VUS=50
LOAD_TEST_RPS=100

# Monitoring Configuration
ENABLE_PERFORMANCE_MONITORING=true
PERFORMANCE_REPORTING_ENABLED=true
EOF
    print_success "Test environment file created"
else
    print_warning "Test environment file already exists"
fi

print_status "Step 5: Creating test data generation scripts..."
cat > scripts/generate-test-data.js << 'EOF'
const fs = require('fs');
const path = require('path');

console.log('Generating comprehensive test data...');

// Generate large client dataset
const generateClients = (count) => {
    const clients = [];
    const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emma', 'Chris', 'Lisa'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];

    for (let i = 0; i < count; i++) {
        clients.push({
            id: `client-${i + 1}`,
            name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
            email: `client${i + 1}@test.com`,
            phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            brand: Math.random() > 0.5 ? 'Heiwa House' : 'Freedom Routes',
            lastBookingDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            notes: `Test client ${i + 1} notes`,
            created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
        });
    }
    return clients;
};

// Generate bookings data
const generateBookings = (count, clientIds) => {
    const bookings = [];
    const statuses = ['pending', 'confirmed', 'cancelled'];

    for (let i = 0; i < count; i++) {
        const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];
        bookings.push({
            id: `booking-${i + 1}`,
            client_ids: [clientId],
            items: [
                {
                    type: Math.random() > 0.5 ? 'room' : 'surf-camp',
                    quantity: Math.floor(Math.random() * 4) + 1,
                    price: Math.floor(Math.random() * 500) + 100
                }
            ],
            total_amount: Math.floor(Math.random() * 2000) + 200,
            payment_status: statuses[Math.floor(Math.random() * statuses.length)],
            payment_method: Math.random() > 0.5 ? 'stripe' : 'bank_transfer',
            notes: `Test booking ${i + 1}`,
            source: 'dashboard',
            created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
        });
    }
    return bookings;
};

// Generate test data
const clients = generateClients(1000);
const clientIds = clients.map(c => c.id);
const bookings = generateBookings(2000, clientIds);

// Write to files
fs.writeFileSync(path.join(__dirname, '../tests/fixtures/large-dataset/clients.json'), JSON.stringify(clients, null, 2));
fs.writeFileSync(path.join(__dirname, '../tests/fixtures/large-dataset/bookings.json'), JSON.stringify(bookings, null, 2));

console.log(`Generated ${clients.length} clients and ${bookings.length} bookings`);
EOF

print_success "Test data generation script created"

print_status "Step 6: Setting up monitoring and reporting configuration..."
cat > tests/config/test-monitoring.js << 'EOF'
const { chromium } = require('@playwright/test');

class TestMonitor {
    constructor() {
        this.metrics = {
            responseTimes: [],
            memoryUsage: [],
            networkRequests: [],
            errors: []
        };
        this.startTime = Date.now();
    }

    recordResponseTime(url, time) {
        this.metrics.responseTimes.push({ url, time, timestamp: Date.now() });
    }

    recordMemoryUsage(usage) {
        this.metrics.memoryUsage.push({ usage, timestamp: Date.now() });
    }

    recordNetworkRequest(request) {
        this.metrics.networkRequests.push({
            url: request.url(),
            method: request.method(),
            timestamp: Date.now()
        });
    }

    recordError(error) {
        this.metrics.errors.push({
            message: error.message,
            stack: error.stack,
            timestamp: Date.now()
        });
    }

    generateReport() {
        const duration = Date.now() - this.startTime;
        const avgResponseTime = this.metrics.responseTimes.reduce((sum, r) => sum + r.time, 0) / this.metrics.responseTimes.length;

        return {
            duration,
            totalRequests: this.metrics.networkRequests.length,
            avgResponseTime: avgResponseTime || 0,
            errorCount: this.metrics.errors.length,
            peakMemoryUsage: Math.max(...this.metrics.memoryUsage.map(m => m.usage)),
            metrics: this.metrics
        };
    }
}

module.exports = TestMonitor;
EOF

print_success "Monitoring configuration created"

print_status "Step 7: Creating load testing scripts..."
cat > tests/load/load-test-baseline.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
    stages: [
        { duration: '2m', target: 10 },  // Ramp up to 10 users
        { duration: '5m', target: 10 },  // Stay at 10 users
        { duration: '2m', target: 0 },   // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
        http_req_failed: ['rate<0.1'],     // Error rate should be below 10%
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3005';

export default function () {
    // Admin dashboard load test
    const response = http.get(`${BASE_URL}/admin`);

    check(response, {
        'status is 200': (r) => r.status === 200,
        'response time < 2000ms': (r) => r.timings.duration < 2000,
    }) || errorRate.add(1);

    responseTime.add(response.timings.duration);

    sleep(1);
}

export function handleSummary(data) {
    return {
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
        'load-test-baseline.json': JSON.stringify(data),
    };
}
EOF

print_success "Load testing scripts created"

print_status "Step 8: Setting up security testing configuration..."
cat > tests/security/security-test-config.js << 'EOF'
const securityTestConfig = {
    auth: {
        testUsers: [
            { email: 'admin@heiwa.house', password: 'admin123456', role: 'admin' },
            { email: 'test@example.com', password: 'test123', role: 'user' }
        ],
        endpoints: {
            login: '/api/auth/login',
            logout: '/api/auth/logout',
            refresh: '/api/auth/refresh'
        }
    },
    vulnerabilities: {
        sqlInjection: [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "admin'--",
            "1 UNION SELECT * FROM users--"
        ],
        xss: [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "javascript:alert('XSS')",
            "<svg onload=alert('XSS')>"
        ],
        csrf: {
            testTokens: true,
            crossOriginRequests: true
        }
    },
    rateLimiting: {
        maxRequestsPerMinute: 100,
        burstLimit: 20,
        endpoints: ['/api/bookings', '/api/clients', '/api/admin/*']
    },
    headers: {
        security: [
            'X-Frame-Options',
            'X-Content-Type-Options',
            'X-XSS-Protection',
            'Strict-Transport-Security',
            'Content-Security-Policy'
        ]
    }
};

module.exports = securityTestConfig;
EOF

print_success "Security testing configuration created"

print_status "Step 9: Creating comprehensive test runner..."
cat > scripts/run-comprehensive-tests.sh << 'EOF'
#!/bin/bash

echo "🧪 Running Comprehensive Admin Testing Suite"
echo "==========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
    local test_name=$1
    local test_command=$2

    echo -e "${BLUE}[RUNNING]${NC} $test_name"
    ((TOTAL_TESTS++))

    if eval "$test_command"; then
        echo -e "${GREEN}[PASSED]${NC} $test_name"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}[FAILED]${NC} $test_name"
        ((FAILED_TESTS++))
    fi
    echo
}

# Phase 1: Functional Tests
echo "Phase 1: Functional Testing"
echo "=========================="

run_test "Admin Dashboard Tests" "npx playwright test tests/admin/ --headed=false"
run_test "Booking Management Tests" "npx playwright test tests/booking-management.spec.ts --headed=false"
run_test "Client Management Tests" "npx playwright test tests/clients.spec.ts --headed=false"
run_test "Authentication Tests" "npx playwright test tests/auth.spec.ts --headed=false"

# Phase 2: Load Tests (if k6 is available)
echo "Phase 2: Load Testing"
echo "===================="

if command -v k6 &> /dev/null; then
    run_test "Baseline Load Test" "k6 run tests/load/load-test-baseline.js"
    run_test "Stress Load Test" "k6 run tests/load/load-test-stress.js"
else
    echo -e "${YELLOW}[SKIPPED]${NC} Load tests - k6 not available"
fi

# Phase 3: Security Tests
echo "Phase 3: Security Testing"
echo "========================"

run_test "Security Tests" "npx playwright test tests/security/ --headed=false"

# Generate Report
echo "Test Results Summary"
echo "==================="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo "Success Rate: $((PASSED_TESTS * 100 / TOTAL_TESTS))%"

# Create summary report
cat > test-results-summary.json << SUMMARY_EOF
{
    "timestamp": "$(date -Iseconds)",
    "totalTests": $TOTAL_TESTS,
    "passedTests": $PASSED_TESTS,
    "failedTests": $FAILED_TESTS,
    "successRate": $((PASSED_TESTS * 100 / TOTAL_TESTS)),
    "phase": "comprehensive-admin-testing"
}
SUMMARY_EOF

echo -e "${GREEN}[COMPLETE]${NC} Comprehensive testing finished"
EOF

chmod +x scripts/run-comprehensive-tests.sh
print_success "Comprehensive test runner created"

print_status "Step 10: Final environment verification..."
npm run type-check
if [ $? -eq 0 ]; then
    print_success "TypeScript compilation successful"
else
    print_warning "TypeScript compilation has warnings/errors"
fi

echo
print_success "🎉 Testing environment setup complete!"
echo
echo "Next steps:"
echo "1. Run 'npm run test' for unit tests"
echo "2. Run 'npm run test:e2e' for E2E tests"
echo "3. Run './scripts/run-comprehensive-tests.sh' for full suite"
echo "4. Run 'npm run test:load' for load testing (if k6 available)"
echo
echo "Environment files:"
echo "- .env.test: Test environment configuration"
echo "- tests/config/: Test configurations"
echo "- tests/fixtures/: Test data"
echo "- scripts/: Test automation scripts"



