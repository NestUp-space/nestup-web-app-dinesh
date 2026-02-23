# Code Review Report: Nestup Web App

**Date:** 2026-01-18  
**Reviewer:** AI Code Review Assistant  
**Branch:** lidar

## Executive Summary

After conducting a thorough review of the codebase, I've identified **28 issues** across security, code quality, performance, and maintainability categories. The codebase shows good architectural patterns in many areas, but several critical security issues require immediate attention.

---

## Critical Severity Issues

### 1. Unsafe Code Execution - Backend Rule Service

**File & Location:** `backend/src/catalogue/services/rule.service.ts:73`  
**Severity:** Critical  
**Category:** Security Vulnerability - Code Injection  
**Status:** 🔴 Open

**Issue:** The `new Function()` constructor is used to evaluate formulas, creating a code injection vulnerability. While there's regex validation, it's insufficient to prevent all attacks.

```typescript
return new Function(`return ${formula}`)();
```

**Recommendation:** Replace with a safe expression parser library like `mathjs` or `expr-eval`.

**Why it matters:** An attacker could inject malicious JavaScript that executes on the server with full Node.js capabilities, potentially compromising the entire system.

---

### 2. Unsafe Code Execution - Frontend Expression Evaluator

**File & Location:** `frontend/src/utils/safeExpressionEvaluator.ts:162`  
**Severity:** Critical  
**Category:** Security Vulnerability - Code Injection  
**Status:** 🔴 Open

**Issue:** Despite the "safe" name, this still uses `new Function()` to execute user-provided code.

```typescript
const func = new Function('runtimeInputs', 'globalConstants', wrappedCode);
const result = func(context.runtimeInputs, context.globalConstants);
```

**Recommendation:** Implement a proper AST-based evaluator or use a sandboxed library like `isolated-vm`.

**Why it matters:** Client-side code injection can be used for XSS attacks and potentially access sensitive data in the browser context.

---

### 3. Sensitive Data Exposure in Logs

**File & Location:** `backend/src/services/auth.service.ts:121`, `backend/src/scripts/getAllUserDetails.ts:25`  
**Severity:** Critical  
**Category:** Security - Sensitive Data Exposure  
**Status:** 🔴 Open

**Issue:** Password validation results and password hashes are logged.

```typescript
console.log('Password validation result:', isPasswordValid);
console.log(`  Password: ${user.password}`);
```

**Recommendation:** Remove all password-related logging.

**Why it matters:** Logs are often stored in plaintext and accessed by multiple team members. Password hashes should never be logged.

---

## High Severity Issues

### 4. XSS Vulnerability - Unsanitized HTML Rendering

**File & Location:** `frontend/src/components/landing-page/post-body.tsx:12`  
**Severity:** High  
**Category:** Security - XSS  
**Status:** 🔴 Open

**Issue:** Raw HTML content is rendered without sanitization.

```tsx
dangerouslySetInnerHTML={{ __html: content }}
```

**Recommendation:** Use DOMPurify to sanitize HTML.

**Why it matters:** Any malicious script in blog content would execute in users' browsers.

---

### 5. XSS Vulnerability - LogicInput Syntax Highlighting

**File & Location:** `frontend/src/components/dashboard/model-management/LogicInput.tsx:178`  
**Severity:** High  
**Category:** Security - XSS  
**Status:** 🔴 Open

**Issue:** User input is converted to HTML for syntax highlighting without escaping.

**Recommendation:** Escape HTML entities before applying highlighting.

---

### 6. Multiple PrismaClient Instances - Memory Leak & Connection Exhaustion

**File & Location:** 39 files across the backend  
**Severity:** High  
**Category:** Performance - Resource Management  
**Status:** 🔴 Open

**Issue:** Each file creates its own `PrismaClient` instance instead of using the singleton from `config/db.ts`.

**Recommendation:** Use the shared instance from `config/db.ts` consistently.

**Why it matters:** With 39 instances, you could have hundreds of open database connections, causing database resource exhaustion.

---

### 7. Missing Input Validation in User Controller

**File & Location:** `backend/src/controllers/user.controller.ts:7-24`  
**Severity:** High  
**Category:** Security - Input Validation  
**Status:** 🔴 Open

**Issue:** The `createUser` method directly passes request body to the service without validation.

**Recommendation:** Add Zod validation like in auth.controller.ts.

---

### 8. JWT Token Type Safety Loss

**File & Location:** `backend/src/middlewares/auth.middleware.ts:22`  
**Severity:** High  
**Category:** Security - Type Safety  
**Status:** 🔴 Open

**Issue:** JWT decoded payload is cast to `any`, losing type safety.

```typescript
const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
```

**Recommendation:** Define and use a proper JwtPayload interface.

---

### 9. Authorization Leakage - Ambiguous Error Response

**File & Location:** `backend/src/services/project/project.service.ts:120-121`  
**Severity:** High  
**Category:** Security - Information Disclosure  
**Status:** 🔴 Open

**Issue:** Service returns `null` for both "not found" and "access denied".

**Recommendation:** Use distinct return values or error types.

---

## Medium Severity Issues

### 10. Token Storage in localStorage

**File & Location:** `frontend/src/context/UserContext.tsx:86`  
**Severity:** Medium  
**Category:** Security - Token Management  
**Status:** 🔴 Open

**Issue:** JWT tokens are stored in localStorage, vulnerable to XSS attacks.

**Recommendation:** Use httpOnly cookies for token storage.

---

### 11. Missing Password Update Authorization Check

**File & Location:** `backend/src/controllers/user.controller.ts:80-98`  
**Severity:** Medium  
**Category:** Security - Authorization  
**Status:** 🔴 Open

**Issue:** Password update doesn't verify the user is updating their own password or has admin privileges.

---

### 12. Verbose Debug Logging in Production

**File & Location:** `backend/src/server.ts:38-92`  
**Severity:** Medium  
**Category:** Security - Information Disclosure  
**Status:** 🔴 Open

**Issue:** Extensive debug logging exposes request details and CORS configuration.

---

### 13. Error Handler Doesn't Log Unexpected Errors

**File & Location:** `backend/src/common/middleware/errorHandler.ts:9-16`  
**Severity:** Medium  
**Category:** Maintainability - Error Handling  
**Status:** 🔴 Open

**Issue:** Unexpected errors are silently swallowed without logging.

---

### 14. File Upload Service Missing Validation

**File & Location:** `backend/src/services/file.service.ts:4`  
**Severity:** Medium  
**Category:** Security - File Upload  
**Status:** 🔴 Open

**Issue:** No file type or size validation before upload.

---

### 15. Missing Rate Limiting on Authentication Endpoints

**File & Location:** `backend/src/routes/auth.routes.ts`  
**Severity:** Medium  
**Category:** Security - Brute Force Protection  
**Status:** 🔴 Open

---

## Low Severity Issues

### 16. Magic Numbers in Permission Cache TTL

**File & Location:** `backend/src/middlewares/permission.middleware.ts:12`  
**Severity:** Low  
**Category:** Maintainability - Magic Numbers  
**Status:** 🔴 Open

---

### 17. Inconsistent Error Response Format

**File & Location:** Multiple controllers  
**Severity:** Low  
**Category:** Maintainability - Consistency  
**Status:** 🔴 Open

---

### 18. Missing TypeScript Strict Null Checks Usage

**File & Location:** `backend/src/services/project/project.service.ts:211`  
**Severity:** Low  
**Category:** Code Quality - Type Safety  
**Status:** 🔴 Open

---

### 19. vm2 Deprecation Notice

**File & Location:** `backend/src/catalogue/services/javascript-function.service.ts:1`  
**Severity:** Low  
**Category:** Security - Deprecated Library  
**Status:** 🔴 Open

---

### 20. Delete Project Missing Cascading Check

**File & Location:** `backend/src/controllers/project/project.controller.ts:200`  
**Severity:** Low  
**Category:** Data Integrity  
**Status:** 🔴 Open

---

## Summary

### Overall Code Health Score: **5.5/10**

### Top 3 Priorities to Address Immediately

1. **Replace `new Function()` usage** in both backend and frontend with safe expression parsers (Critical - Security)
2. **Consolidate PrismaClient instances** to use the singleton pattern (High - Performance/Stability)
3. **Sanitize all `dangerouslySetInnerHTML` usage** with DOMPurify (High - Security)

### Patterns of Concern

1. **Security debt accumulation**: Multiple code execution and XSS vulnerabilities
2. **Inconsistent dependency injection**: Mix of singleton patterns and direct instantiation
3. **Verbose debugging code in production paths**
4. **Missing input validation**: Several controllers accept unvalidated user input

### Positive Observations

1. **Good use of Zod validation** in auth controllers
2. **Well-structured middleware chain** with proper authentication and authorization
3. **ServiceResponse pattern** provides consistent API response formatting
4. **Environment validation** using Zod in `config/env.ts`
5. **Permission system** is well-designed with role-based access control
6. **LiDAR upload controller** has good session ownership verification
