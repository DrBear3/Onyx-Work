# 🔐 SECURITY ALERT: API Key Management

## ❌ **NEVER DO THIS:**
- Do NOT commit `.env` files to GitHub
- Do NOT paste API keys in code comments  
- Do NOT share API keys in chat/email
- Do NOT use production keys in development

## ✅ **SECURE PRACTICES:**

### 1. Environment Variables (.env files)
```bash
# ✅ Good - Use .env files (ignored by git)
OPENAI_API_KEY=your-actual-key-here

# ❌ Bad - Never in code
const apiKey = "sk-proj-actual-key-here"; // DON'T DO THIS
```

### 2. Git Configuration
Your `.gitignore` should include:
```
.env
.env.local
.env.development
.env.production
task-api-service/.env
task-api-service/.env.*
```

### 3. If You Accidentally Committed Keys

If you've already pushed API keys to GitHub:

1. **Revoke the exposed keys immediately**
   - Go to OpenAI dashboard → API Keys → Revoke
   - Go to Stripe dashboard → API Keys → Delete

2. **Remove from git history**
   ```bash
   git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch task-api-service/.env' --prune-empty --tag-name-filter cat -- --all
   ```

3. **Generate new keys**
   - Create new OpenAI API key
   - Create new Stripe keys
   - Update your local `.env` file

### 4. Deployment Security

**Development:**
```bash
# Use test/development keys
OPENAI_API_KEY=sk-test-...
STRIPE_SECRET_KEY=sk_test_...
```

**Production:**
```bash
# Use production keys (stored securely in hosting platform)
OPENAI_API_KEY=sk-live-...
STRIPE_SECRET_KEY=sk_live_...
```

### 5. Platform-Specific Environment Variables

**Vercel:**
- Add environment variables in Vercel dashboard
- Use different values for Preview vs Production

**Railway/Heroku:**
- Set config vars in platform dashboard
- Never include in codebase

**AWS/Docker:**
- Use AWS Secrets Manager or Parameter Store
- Use Docker secrets or environment injection

### 6. Code Patterns

**✅ Secure Loading:**
```javascript
// Load from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION_ID
});

// Graceful fallback for missing keys
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️ OpenAI API key not found - running in test mode');
  this.openai = null;
}
```

**❌ Insecure (never do this):**
```javascript
// DON'T hardcode keys
const openai = new OpenAI({
  apiKey: "sk-proj-actual-key-here" // ❌ NEVER!
});
```

### 7. Monitoring & Rotation

- **Monitor API usage** in provider dashboards
- **Rotate keys regularly** (every 30-90 days)
- **Use separate keys** for different environments
- **Set usage limits** to prevent abuse

### 8. Team Collaboration

- Share `.env.example` template (safe)
- Each developer has their own `.env` file (not shared)
- Use team/organization accounts for production keys
- Document which keys are needed in README

## 🚨 **IMMEDIATE ACTION REQUIRED:**

If you see this message, it means you may have exposed API keys. Take these steps NOW:

1. ✅ **Done**: Removed `.env` from git tracking
2. ✅ **Done**: Updated `.gitignore` to exclude environment files
3. 🔄 **TODO**: Revoke and regenerate any exposed API keys
4. 🔄 **TODO**: Create new `.env` file locally with fresh keys
5. 🔄 **TODO**: Configure production environment variables in your hosting platform

## 💰 **Cost Protection:**

Set usage limits in your API provider dashboards:
- **OpenAI**: Set monthly spending limits
- **Stripe**: Monitor transaction volumes  
- **Google Search**: Set daily query limits

This prevents unexpected charges if keys are compromised.

---

**Remember**: When in doubt, regenerate your keys. Better safe than sorry! 🔒
