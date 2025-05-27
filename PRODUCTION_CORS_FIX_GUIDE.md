# Production CORS Fix Guide

## Current Issue

CORS failure in production between frontend (<https://www.nestup.space>) and backend (<https://nestup-web-app-production.up.railway.app>).

## Environment Configuration Status

✅ **Railway Environment Variables (Confirmed):**

- `CORS_ORIGIN=https://nestup.space,https://www.nestup.space`
- `FRONTEND_URL=https://www.nestup.space`

## Enhanced CORS Configuration Applied

The backend now includes:

- Comprehensive allowed headers
- Enhanced debugging logs
- Proper preflight handling
- Additional CORS options for better compatibility

## Deployment Steps

### 1. Deploy Updated Backend to Railway

```bash
# Ensure you're in the project root
cd /Users/suryateja/Documents/Nestup/Nestup_Web_App

# Commit the changes
git add backend/src/server.ts
git commit -m "Enhanced CORS configuration with comprehensive headers and debugging"

# Push to trigger Railway deployment
git push origin main
```

### 2. Verify Railway Deployment

1. Go to Railway dashboard
2. Check that the deployment completed successfully
3. Verify the service is running

### 3. Test and Monitor CORS Logs

#### Test the Login

1. Go to <https://www.nestup.space/login>
2. Attempt to login with: `admin@nestup.space` / `DefaultAdminPassword123!`

#### Check Railway Logs

Look for these debug messages in Railway logs:

```
--- [CORS DEBUG] Allowed origins: ["https://nestup.space","https://www.nestup.space"]
--- [CORS DEBUG] CORS_ORIGIN env var: https://nestup.space,https://www.nestup.space
--- [CORS DEBUG] FRONTEND_URL env var: https://www.nestup.space
--- [CORS DEBUG] Incoming origin: https://www.nestup.space
--- [CORS DEBUG] Origin allowed: true
--- [REQUEST DEBUG] Method: OPTIONS
--- [REQUEST DEBUG] URL: /api/auth/login
--- [REQUEST DEBUG] Origin: https://www.nestup.space
```

## Troubleshooting Scenarios

### Scenario 1: No CORS Debug Logs Appear

**Problem:** The updated code hasn't been deployed
**Solution:**

- Verify git push completed
- Check Railway deployment status
- Force redeploy if necessary

### Scenario 2: CORS Debug Shows Origin Blocked

**Problem:** Origin mismatch in environment variables
**Solution:**

- Check exact origin being sent by frontend
- Update Railway `CORS_ORIGIN` environment variable
- Ensure no trailing slashes or protocol mismatches

### Scenario 3: CORS Debug Shows Origin Allowed but Still Fails

**Problem:** Headers or preflight issue
**Solution:**

- Check the `[REQUEST DEBUG]` logs for preflight OPTIONS request
- Verify all required headers are included
- Check for any middleware conflicts

### Scenario 4: No Requests Reaching Backend

**Problem:** Network/DNS issue
**Solution:**

- Verify Railway service URL is accessible
- Check if Railway service is running
- Test with curl: `curl -I https://nestup-web-app-production.up.railway.app/health-check`

## Expected Success Logs

When working correctly, you should see:

```
--- [CORS DEBUG] Incoming origin: https://www.nestup.space
--- [CORS DEBUG] Origin allowed: true
--- [CORS DEBUG] CORS allowed for origin: https://www.nestup.space
--- [REQUEST DEBUG] Method: OPTIONS
--- [REQUEST DEBUG] URL: /api/auth/login
--- [REQUEST DEBUG] Origin: https://www.nestup.space
--- [REQUEST DEBUG] Method: POST
--- [REQUEST DEBUG] URL: /api/auth/login
--- [REQUEST DEBUG] Origin: https://www.nestup.space
```

## Additional Verification Commands

### Test Backend Health

```bash
curl -I https://nestup-web-app-production.up.railway.app/health-check
```

### Test CORS Preflight

```bash
curl -X OPTIONS \
  -H "Origin: https://www.nestup.space" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v \
  https://nestup-web-app-production.up.railway.app/api/auth/login
```

## Next Steps After Deployment

1. Deploy the updated backend code to Railway
2. Test login functionality
3. Check Railway logs for CORS debug messages
4. Share the relevant log output for further analysis if issues persist

The enhanced CORS configuration should resolve the production login issue by providing more comprehensive header support and detailed logging for troubleshooting.
