# Email Receiver Worker

Cloudflare Worker that receives emails via Email Routing and forwards them to the admin email system.

## Setup

### 1. Install Dependencies

```bash
cd workers/email-receiver
pnpm install
```

### 2. Deploy Worker

```bash
pnpm deploy
```

### 3. Set Webhook Secret (Optional but Recommended)

```bash
wrangler secret put WEBHOOK_SECRET
# Enter a secure random string when prompted
```

Then add the same secret in the admin settings:
- Go to Admin > Settings
- Add config key: `email_webhook_secret`
- Set the same value you used above

### 4. Configure Email Routing in Cloudflare Dashboard

1. Go to your domain in Cloudflare Dashboard
2. Navigate to **Email > Email Routing**
3. Enable Email Routing if not already enabled
4. Go to **Routes** tab
5. Add a new route:
   - **Custom address**: `support` (or `*` for all addresses)
   - **Action**: Send to Worker
   - **Worker**: `nanobananastudio-email-receiver`

### 5. Verify DNS Records

Make sure you have the required MX records for email routing:
- `route1.mx.cloudflare.net` (priority 69)
- `route2.mx.cloudflare.net` (priority 34)
- `route3.mx.cloudflare.net` (priority 24)

## Testing

### Local Development

```bash
pnpm dev
```

Note: Email triggers can't be tested locally. Use `wrangler tail` to see logs after deployment.

### View Logs

```bash
pnpm tail
```

## How It Works

1. Email is sent to `support@nanobananastudio.com`
2. Cloudflare Email Routing receives the email
3. Worker is triggered with the raw email
4. Worker parses the email using `postal-mime`
5. Worker sends a POST request to `/api/webhook/email`
6. Webhook stores the email in the database
7. Email appears in Admin > Emails inbox

## Troubleshooting

### Emails not appearing in admin

1. Check worker logs: `pnpm tail`
2. Verify email routing is configured correctly
3. Check webhook endpoint is accessible
4. Verify webhook secret matches (if configured)

### Webhook signature errors

Make sure the `email_webhook_secret` config in admin matches the `WEBHOOK_SECRET` secret in the worker.
