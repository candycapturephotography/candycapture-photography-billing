# WhatsApp Business API Setup Guide - Candy Capture Photography

## Current Status

| Item | Status | Details |
|------|--------|---------|
| Cloudflare Worker | ✅ Deployed | https://candycapture-whatsapp-api.hellocandycapturephotography.workers.dev |
| Phone Number ID | ✅ Configured | 1343986805465390 |
| Access Token | ✅ Added | Stored as secret in Cloudflare Worker |
| Display Name | ❌ **Pending Approval** | Needs approval before messages can be sent |

---

## 🔴 Action Required: Approve Display Name

Your WhatsApp Business number needs **display name approval** before you can send messages.

### Steps to Approve Display Name:

1. **Go to WhatsApp Manager:**
   - https://business.facebook.com/wa/manage/phone-numbers/

2. **Select your WhatsApp Business Account**

3. **Click on your phone number**

4. **Find "Display Name" section:**
   - Submit display name: **"Candy Capture Photography"**
   - Or check if it says "Pending Approval"

5. **Wait for approval:**
   - Takes a few hours to 24 hours
   - You'll receive email notification when approved

---

## API Credentials

### Phone Number ID
```
1343986805465390
```

### Access Token (keep secure!)
```
EAAObtNUVZA2wBSuAZAwDRfJvB41XuU4eqWWmpksZCzst3SfarLzeU3CNjj6HMojEpdHC1m0MLvBF7HLHxhmlRHbVmIET7bu1AZAZC3fPR7Ckjpq5x1jnAa1ItJ4hIS4ZBYWipyoir36S87gFLy4jJrOwQRLhItMRu0N0ffC7FYmXPfGqJvHrPc9vDNj1MThPyqngZDZD
```

### Worker URL
```
https://candycapture-whatsapp-api.hellocandycapturephotography.workers.dev
```

---

## How It Works

### Architecture
```
Billing App (Frontend)
       ↓
Cloudflare Worker (Backend - stores token securely)
       ↓
Meta WhatsApp Business API
       ↓
Customer's WhatsApp
```

### Message Types Available
1. **Invoice** - Full invoice details with payment summary
2. **Booking Confirmation** - Event booking confirmation
3. **Payment Reminder** - Balance due reminder

---

## Usage in Billing App

1. Open any invoice at https://billing.candycapturephotography.in
2. Click **💬 WhatsApp** button
3. Choose **🚀 Send Instantly (API)**
4. Select message type
5. Click **📤 Send WhatsApp Message**

---

## Important WhatsApp API Rules

### 24-Hour Messaging Window
- You can send **free-form messages** only to customers who messaged you within last 24 hours
- For customers who haven't messaged you, you need **approved message templates**

### Message Templates (For Production)
To send messages to any customer without them messaging first:
1. Go to **WhatsApp > Message Templates** in Meta Business Suite
2. Create templates for:
   - Invoice notifications
   - Payment reminders
   - Booking confirmations
3. Submit for approval (24-48 hours)

---

## Troubleshooting

### Error: Display name needs approval
- Solution: Approve display name in WhatsApp Manager

### Error: Account not registered
- Solution: Complete phone number verification in Meta Developer Console

### Error: Invalid access token
- Solution: Generate new token and update:
  ```bash
  cd cloudflare-worker
  echo "NEW_TOKEN_HERE" | npx wrangler secret put WHATSAPP_ACCESS_TOKEN
  npx wrangler deploy
  ```

### Messages not arriving
- Check if customer is in 24-hour window
- Use approved message templates for new customers
- Verify phone number format (with country code)

---

## Links

- **Meta Developer Console:** https://developers.facebook.com/apps/
- **WhatsApp Manager:** https://business.facebook.com/wa/manage/
- **Cloudflare Dashboard:** https://dash.cloudflare.com/
- **Billing App:** https://billing.candycapturephotography.in

---

## Support

For issues with:
- **Meta/WhatsApp:** https://business.facebook.com/help/
- **Cloudflare Worker:** Check logs in Cloudflare Dashboard

---

*Last Updated: September 2026*