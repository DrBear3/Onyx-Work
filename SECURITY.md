# 🔐 SECURITY: API Key Management

## ❌ **CRITICAL: DO NOT COMMIT API KEYS TO GIT**

This project requires API keys that must NEVER be committed to version control.

### Quick Setup:
1. Copy `task-api-service/.env.example` to `task-api-service/.env`
2. Fill in your actual API keys in the `.env` file
3. The `.env` file is ignored by git and will stay local

### Required Environment Variables:
```bash
# OpenAI (required for AI features)
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_ORGANIZATION_ID=org-your-org-id

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Stripe (for subscriptions)
STRIPE_SECRET_KEY_DEV=sk_test_your-stripe-key
```

### ⚠️ If You Accidentally Committed Keys:
1. **Immediately revoke the exposed keys** in their respective dashboards
2. Generate new keys
3. Update your local `.env` file with new keys
4. Contact a maintainer to help clean git history

### 🔒 Security Best Practices:
- Use separate keys for development/production
- Set usage limits in provider dashboards
- Rotate keys regularly
- Never share keys in chat/email
- Use environment variables, never hardcode keys

---
**Remember: When in doubt, regenerate your keys! 🔐**
