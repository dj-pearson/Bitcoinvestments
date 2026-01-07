# Automated Testing Guide

## Quick Start

### 1. Start the Development Server

First, you need to have your app running locally:

```bash
# Terminal 1: Start dev server
npm run dev
```

This will start Vite on `http://localhost:5173` (or another port if 5173 is busy).

### 2. Run the Automated Tests

In a **separate terminal**, run the automated tests:

```bash
# Terminal 2: Run tests
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173
```

## Test Presets

### Smoke Test (Quick - 2-5 minutes)
```bash
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173 --preset smoke
```
- Tests: ~10 critical pages
- Checks: Basic functionality, no errors
- Use for: Quick validation before commits

### Standard Test (Medium - 10-20 minutes)
```bash
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173 --preset standard
```
- Tests: ~50 pages
- Checks: Forms, navigation, accessibility, performance
- Use for: Pre-deployment validation

### Full Test (Comprehensive - 30-60 minutes)
```bash
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173 --preset full
```
- Tests: All discoverable pages
- Checks: Everything including edge functions, visual regression
- Use for: Major releases, comprehensive audits

### Mobile Test
```bash
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173 --preset mobile
```
- Tests: Mobile viewport and interactions
- Checks: Touch gestures, responsive design

### Accessibility Test
```bash
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173 --preset accessibility
```
- Tests: WCAG compliance
- Checks: Color contrast, ARIA labels, keyboard navigation

### Performance Test
```bash
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173 --preset performance
```
- Tests: Page load times, bundle sizes
- Checks: Core Web Vitals, lighthouse scores

### API Test
```bash
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173 --preset api
```
- Tests: API endpoints
- Checks: Response times, error handling, authentication

### CI Test (For GitHub Actions)
```bash
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173 --preset ci
```
- Tests: Critical paths only
- Optimized for: Fast CI/CD pipelines

## Custom Options

### Test Depth
```bash
# Shallow - Quick scan
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173 --depth shallow

# Medium - Balanced (default)
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173 --depth medium

# Deep - Comprehensive
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173 --depth deep
```

### Max Pages
```bash
# Test only 20 pages
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173 --max-pages 20

# Test all pages (0 = unlimited)
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173 --max-pages 0
```

### Browser Selection
```bash
# Chromium (default)
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173 --browser chromium

# Firefox
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173 --browser firefox

# WebKit (Safari)
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173 --browser webkit
```

### Headed Mode (Visible Browser)
```bash
# Watch the tests run
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173 --headed
```

### Disable Specific Tests
```bash
# No screenshots
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173 --no-screenshots

# No accessibility tests
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173 --no-a11y

# No performance tests
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173 --no-perf

# No edge function tests
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173 --no-edge
```

### Custom Output Directory
```bash
npx tsx tools/automated-testing/cli.ts --url http://localhost:5173 --output ./test-results
```

## Test Reports

After running tests, you'll find reports in:
```
test-results/
├── report.html          # Main HTML report (open in browser)
├── report.json          # JSON data for CI/CD
├── screenshots/         # Visual regression screenshots
├── performance/         # Performance metrics
└── accessibility/       # A11y audit results
```

## Common Issues

### Issue: "EBUSY: resource busy or locked"
**Solution:** Kill all Node.js processes:
```powershell
Get-Process | Where-Object {$_.ProcessName -match "node"} | Stop-Process -Force
```

### Issue: "Executable doesn't exist"
**Solution:** Install Playwright browsers:
```bash
npx playwright install chromium
```

### Issue: "Cannot connect to http://localhost:5173"
**Solution:** Make sure your dev server is running:
```bash
npm run dev
```

### Issue: Port already in use
**Solution:** Check what's using the port:
```powershell
Get-NetTCPConnection -LocalPort 5173 | Select-Object OwningProcess
```

## Testing Production

To test your production site:
```bash
npx tsx tools/automated-testing/cli.ts --url https://bitcoinvestments.net --preset smoke
```

**Note:** Some tests (like edge functions) may not work on production due to CORS/authentication.

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Automated Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install chromium
      
      - name: Build
        run: npm run build
      
      - name: Start server
        run: npm run preview &
      
      - name: Wait for server
        run: npx wait-on http://localhost:4173
      
      - name: Run tests
        run: npx tsx tools/automated-testing/cli.ts --url http://localhost:4173 --preset ci
      
      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

## Tips

1. **Start with smoke tests** - Quick validation before deeper testing
2. **Use headed mode for debugging** - See what the tests are doing
3. **Run tests before deploying** - Catch issues early
4. **Keep test results** - Track performance over time
5. **Test on multiple browsers** - Ensure cross-browser compatibility

## Advanced Usage

### Programmatic API
```typescript
import { TestOrchestrator, createTester, getPreset } from './tools/automated-testing';

const config = getPreset('standard');
const orchestrator = new TestOrchestrator(config);

await orchestrator.run();
```

### Custom Test Configuration
```typescript
import { TestOrchestrator } from './tools/automated-testing';

const orchestrator = new TestOrchestrator({
  baseUrl: 'http://localhost:5173',
  depth: 'deep',
  maxPages: 100,
  browser: 'chromium',
  screenshots: true,
  accessibility: true,
  performance: true,
  edgeFunctions: true,
  outputDir: './custom-results',
});

await orchestrator.run();
```

## Support

For issues or questions:
1. Check the README: `tools/automated-testing/README.md`
2. Review test results: `test-results/report.html`
3. Enable debug logging: Set `DEBUG=true` environment variable

---

**Happy Testing! 🚀**
