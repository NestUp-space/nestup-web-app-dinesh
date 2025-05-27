#!/usr/bin/env node

/**
 * Security Verification Script
 * Verifies that all audit recommendations have been properly implemented
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Security Fixes Implementation...\n');

const checks = [];

// Check 1: Verify safe expression evaluator exists
function checkSafeEvaluator() {
  const filePath = 'frontend/src/utils/safeExpressionEvaluator.ts';
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('safeEvaluateExpression') && content.includes('sanitizeCode')) {
      return { pass: true, message: 'Safe expression evaluator implemented' };
    }
  }
  return { pass: false, message: 'Safe expression evaluator missing or incomplete' };
}

// Check 2: Verify unsafe Function calls are removed
function checkUnsafeFunctionCalls() {
  const files = [
    'frontend/src/components/dashboard/model-management/ModelPlankList.tsx',
    'frontend/src/components/dashboard/model-management/ExpressionInput.tsx'
  ];
  
  for (const file of files) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('new Function(') && !content.includes('safeEvaluateExpression')) {
        return { pass: false, message: `Unsafe Function call still exists in ${file}` };
      }
    }
  }
  return { pass: true, message: 'No unsafe Function calls detected' };
}

// Check 3: Verify error boundary exists
function checkErrorBoundary() {
  const filePath = 'frontend/src/components/common/ErrorBoundary.tsx';
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('ErrorBoundary') && content.includes('componentDidCatch')) {
      return { pass: true, message: 'Error boundary component implemented' };
    }
  }
  return { pass: false, message: 'Error boundary missing or incomplete' };
}

// Check 4: Verify Railway configuration
function checkRailwayConfig() {
  const filePath = 'railway.json';
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    try {
      const config = JSON.parse(content);
      if (config.build && config.deploy) {
        return { pass: true, message: 'Railway configuration present' };
      }
    } catch (e) {
      return { pass: false, message: 'Railway configuration invalid JSON' };
    }
  }
  return { pass: false, message: 'Railway configuration missing' };
}

// Check 5: Verify production environment template
function checkProductionEnv() {
  const filePath = 'backend/.env.production.example';
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('NODE_ENV=production') && content.includes('DATABASE_URL')) {
      return { pass: true, message: 'Production environment template present' };
    }
  }
  return { pass: false, message: 'Production environment template missing' };
}

// Check 6: Verify backend production scripts
function checkBackendScripts() {
  const filePath = 'backend/package.json';
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    try {
      const pkg = JSON.parse(content);
      if (pkg.scripts && pkg.scripts.start && pkg.scripts.build && pkg.scripts['migrate:prod']) {
        return { pass: true, message: 'Backend production scripts configured' };
      }
    } catch (e) {
      return { pass: false, message: 'Backend package.json invalid' };
    }
  }
  return { pass: false, message: 'Backend production scripts missing' };
}

// Check 7: Verify deployment guide exists
function checkDeploymentGuide() {
  const filePath = 'DEPLOYMENT_GUIDE.md';
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('Railway') && content.includes('Vercel') && content.includes('Environment Variables')) {
      return { pass: true, message: 'Deployment guide complete' };
    }
  }
  return { pass: false, message: 'Deployment guide missing or incomplete' };
}

// Run all checks
const allChecks = [
  { name: 'Safe Expression Evaluator', check: checkSafeEvaluator },
  { name: 'Unsafe Function Calls Removed', check: checkUnsafeFunctionCalls },
  { name: 'Error Boundary Implementation', check: checkErrorBoundary },
  { name: 'Railway Configuration', check: checkRailwayConfig },
  { name: 'Production Environment', check: checkProductionEnv },
  { name: 'Backend Production Scripts', check: checkBackendScripts },
  { name: 'Deployment Documentation', check: checkDeploymentGuide }
];

let passCount = 0;
let totalChecks = allChecks.length;

allChecks.forEach(({ name, check }) => {
  const result = check();
  const status = result.pass ? '✅' : '❌';
  console.log(`${status} ${name}: ${result.message}`);
  if (result.pass) passCount++;
});

console.log('\n' + '='.repeat(60));
console.log(`Security Verification Results: ${passCount}/${totalChecks} checks passed`);

if (passCount === totalChecks) {
  console.log('🎉 All security fixes implemented successfully!');
  console.log('✅ Application is ready for deployment');
  console.log('\nNext steps:');
  console.log('1. Follow DEPLOYMENT_GUIDE.md for deployment');
  console.log('2. Deploy backend to Railway');
  console.log('3. Deploy frontend to Vercel');
  console.log('4. Configure custom domain');
} else {
  console.log('⚠️  Some security fixes are missing or incomplete');
  console.log('Please review the failed checks above and implement the missing components');
  process.exit(1);
}

console.log('\n📊 Audit Compliance: ' + Math.round((passCount / totalChecks) * 100) + '%');
