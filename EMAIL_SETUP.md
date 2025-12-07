# Email Functionality Setup Guide

## Overview
Email functionality has been implemented for:
1. **Email Verification** - When user registers
2. **Plan Request Notification** - To admin when client requests plan
3. **Plan Activation Confirmation** - To client when admin activates plan

## Database Changes Required

Run this SQL command to add verification token column:

```sql
ALTER TABLE Users ADD verificationToken NVARCHAR(500);
```

## Environment Variables

Add these to your `.env.local` file:

```env
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Admin Email (receives plan request notifications)
ADMIN_EMAIL=admin@printscrap.ai

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Gmail Setup (If using Gmail)

1. Go to Google Account Settings
2. Enable 2-Factor Authentication
3. Go to Security > App Passwords
4. Generate new app password for "Mail"
5. Use that password in `SMTP_PASS`

## Email Flow

### 1. Registration Email Verification

**When:** User registers a new account

**Email sent to:** New user

**Contains:**
- Welcome message
- Verification link
- Link expires in 24 hours

**User clicks link → Redirects to:** `/verify-email?token=xxx`

**API endpoint:** `POST /api/verify-email`
- Validates token
- Updates `isVerified = 1` in database
- Clears verification token

**Login Constraint:**
- ✅ Super Admin can login without verification
- ❌ Clients CANNOT login until email is verified
- Error message: "Please verify your email before logging in. Check your inbox for the verification link."

### 2. Plan Request Notification

**When:** Client requests plan activation

**Email sent to:** Super Admin (`ADMIN_EMAIL`)

**Contains:**
- Client name and email
- Requested plan name
- Optional message from client
- Link to admin panel plan requests page

**Triggered by:** `POST /api/plan-requests`

### 3. Plan Activation Confirmation

**When:** Admin activates a plan for client

**Email sent to:** Client

**Contains:**
- Confirmation message
- Plan name
- Start date
- End date
- Link to client dashboard

**Triggered by:** `POST /api/subscriptions/activate`

## Files Created/Modified

### New Files:
- `src/lib/email.ts` - Email utility functions
- `src/app/api/verify-email/route.ts` - Email verification endpoint
- `.env.example` - Environment variables template
- `EMAIL_SETUP.md` - This file

### Modified Files:
- `src/app/api/auth/register/route.ts` - Sends verification email
- `src/app/api/plan-requests/route.ts` - Sends plan request notification
- `src/app/api/subscriptions/activate/route.ts` - Sends activation confirmation
- `src/app/api/schema.sql` - Added verificationToken column

## Testing Emails

### Option 1: Use Gmail
- Set up app password (see above)
- Use in production

### Option 2: Use Mailtrap (For Testing)
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass
```

### Option 3: Use Other SMTP Services
- SendGrid
- Mailgun
- Amazon SES
- Any SMTP server

## Email Templates

All emails use HTML templates with:
- Professional styling
- Responsive design
- Clear call-to-action buttons
- Company branding (PrintScrap.ai)

### Customization

Edit templates in `src/lib/email.ts`:
- Change colors
- Update branding
- Modify content
- Add logos

## Troubleshooting

### Email not sending:
1. Check SMTP credentials in `.env.local`
2. Check console for errors
3. Verify firewall allows port 587
4. Check Gmail app password if using Gmail

### Email going to spam:
1. Use authenticated SMTP server
2. Add SPF/DKIM records to domain
3. Use professional email service

### Verification link not working:
1. Check `NEXT_PUBLIC_APP_URL` is correct
2. Verify token is being saved in database
3. Check token hasn't expired (24 hours)

## Security Notes

- Verification tokens are random strings
- Tokens expire after 24 hours
- Tokens are deleted after verification
- Email sending is async (non-blocking)
- SMTP credentials should never be committed to git

## Next Steps

1. Run SQL migration to add verificationToken column
2. Add SMTP configuration to `.env.local`
3. Test registration flow
4. Test plan request flow
5. Test plan activation flow
