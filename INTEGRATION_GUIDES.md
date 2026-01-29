# Chofesh.ai Integration Guides

Complete guides for integrating Chofesh.ai with popular automation platforms and custom applications.

---

## Table of Contents

1. [Webhooks API](#webhooks-api)
2. [Scheduled Tasks](#scheduled-tasks)
3. [Zapier Integration](#zapier-integration)
4. [Make.com Integration](#makecom-integration)
5. [n8n Integration](#n8n-integration)
6. [Custom Integration](#custom-integration)
7. [Security Best Practices](#security-best-practices)

---

## Webhooks API

Webhooks allow you to receive real-time notifications when events occur in Chofesh.ai.

### Creating a Webhook

1. Navigate to `/automation` in your Chofesh.ai dashboard
2. Click "Create Webhook"
3. Configure:
   - **Name**: Friendly name for your webhook
   - **URL**: Your endpoint that will receive POST requests
   - **Events**: Select which events to subscribe to

### Available Events

- `task.completed` - Scheduled task completed successfully
- `task.failed` - Scheduled task failed
- `task.started` - Scheduled task started execution
- `project.created` - Project builder started
- `project.completed` - Project builder finished
- `project.failed` - Project builder failed
- `chat.message` - New chat message received
- `chat.completed` - Chat response completed
- `credits.low` - Credits running low
- `credits.depleted` - Credits fully depleted
- `credits.purchased` - Credits purchased

### Webhook Payload Structure

```json
{
  "event": "task.completed",
  "timestamp": "2026-01-29T17:00:00.000Z",
  "data": {
    "taskId": "uuid-here",
    "taskName": "Daily Summary",
    "status": "success",
    "result": {
      // Event-specific data
    }
  }
}
```

### Verifying Webhook Signatures

All webhooks include an `X-Chofesh-Signature` header with HMAC-SHA256 signature:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expectedSignature = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express.js example
app.post('/webhook', express.json(), (req, res) => {
  const signature = req.headers['x-chofesh-signature'];
  const secret = process.env.CHOFESH_WEBHOOK_SECRET;
  
  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook
  console.log('Event:', req.body.event);
  res.json({ received: true });
});
```

### Retry Logic

Failed webhooks are automatically retried with exponential backoff:
- Attempt 1: Immediate
- Attempt 2: 2 minutes later
- Attempt 3: 4 minutes later
- Attempt 4: 8 minutes later
- Attempt 5: 16 minutes later
- Attempt 6: 32 minutes later

---

## Scheduled Tasks

Automate recurring AI workflows with cron scheduling.

### Creating a Scheduled Task

1. Navigate to `/automation` → "Scheduled Tasks" tab
2. Click "Create Task"
3. Configure:
   - **Name**: Task identifier
   - **Schedule**: Cron expression (e.g., `0 9 * * 1-5` for weekdays at 9 AM)
   - **Task Type**: What the task should do
   - **Configuration**: Task-specific settings (JSON)

### Task Types

#### 1. Chat Completion
Generate AI responses on a schedule.

```json
{
  "prompt": "Summarize today's tech news",
  "model": "gpt-4"
}
```

#### 2. Project Builder
Create complete projects automatically.

```json
{
  "projectType": "kids_book",
  "prompt": "Create a bedtime story about space exploration"
}
```

#### 3. Data Analysis
Analyze data periodically.

```json
{
  "dataSource": "sales_report.csv",
  "analysisType": "trend_analysis"
}
```

#### 4. Document Summary
Summarize documents regularly.

```json
{
  "documentUrl": "https://example.com/report.pdf",
  "summaryLength": "medium"
}
```

#### 5. Web Scraping
Extract data from websites.

```json
{
  "url": "https://example.com/data",
  "selectors": {
    "title": "h1.title",
    "price": ".price"
  }
}
```

#### 6. Custom Script
Run custom code.

```json
{
  "language": "python",
  "code": "print('Hello from scheduled task')"
}
```

### Cron Expression Examples

```
0 9 * * 1-5       # Weekdays at 9 AM
0 0 * * *         # Daily at midnight
0 */6 * * *       # Every 6 hours
0 9 1 * *         # First day of month at 9 AM
0 0 * * 0         # Every Sunday at midnight
*/15 * * * *      # Every 15 minutes
```

---

## Zapier Integration

Connect Chofesh.ai to 5,000+ apps with Zapier.

### Setup

1. Create a webhook in Chofesh.ai (`/automation`)
2. Copy the webhook URL
3. In Zapier, create a new Zap:
   - **Trigger**: Webhooks by Zapier → Catch Hook
   - **Webhook URL**: Paste your Chofesh.ai webhook URL
4. Test the trigger by clicking "Test Webhook" in Chofesh.ai
5. Add actions to your Zap (e.g., send to Slack, save to Google Sheets)

### Example Zaps

#### 1. AI Summary → Slack
- **Trigger**: Chofesh.ai webhook (`task.completed`)
- **Action**: Send message to Slack channel

#### 2. Daily Report → Email
- **Trigger**: Chofesh.ai scheduled task
- **Action**: Send email via Gmail

#### 3. New Lead → AI Analysis
- **Trigger**: New row in Google Sheets
- **Action**: Trigger Chofesh.ai task via API

---

## Make.com Integration

Visual automation with Make.com (formerly Integromat).

### Setup

1. Create a new scenario in Make.com
2. Add "Webhooks" module → "Custom Webhook"
3. Copy the webhook URL
4. Create webhook in Chofesh.ai with Make.com URL
5. Test the connection

### Example Scenarios

#### 1. AI Content → Multiple Platforms
- **Trigger**: Chofesh.ai webhook
- **Actions**:
  - Post to Twitter
  - Post to LinkedIn
  - Save to Notion database

#### 2. Scheduled Research → Report
- **Trigger**: Schedule (daily at 8 AM)
- **Actions**:
  - Call Chofesh.ai API
  - Format results
  - Send PDF via email

---

## n8n Integration

Self-hosted automation with n8n.

### Setup

1. Add "Webhook" node to your n8n workflow
2. Set method to POST
3. Copy the webhook URL
4. Create webhook in Chofesh.ai
5. Add "HTTP Request" node to call Chofesh.ai API

### Example Workflows

#### 1. AI-Powered Customer Support
```
Webhook (customer message)
  → Chofesh.ai API (analyze sentiment)
  → If (urgent)
    → Slack notification
  → Else
    → Auto-reply with AI
```

#### 2. Content Generation Pipeline
```
Schedule (every Monday 9 AM)
  → Chofesh.ai API (generate blog post)
  → WordPress (publish draft)
  → Slack (notify team)
```

---

## Custom Integration

Build your own integration with the Chofesh.ai API.

### Authentication

All API requests require authentication:

```bash
curl -X POST https://api.chofesh.ai/automation/webhooks/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Webhook",
    "url": "https://example.com/webhook",
    "events": ["task.completed"]
  }'
```

### Creating Scheduled Tasks via API

```javascript
const response = await fetch('https://api.chofesh.ai/automation/tasks/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Daily Summary',
    scheduleCron: '0 9 * * *',
    taskType: 'chat_completion',
    taskConfig: {
      prompt: 'Summarize yesterday\'s activities',
      model: 'gpt-4'
    }
  })
});

const task = await response.json();
console.log('Task created:', task.id);
```

### Receiving Webhook Events

```python
from flask import Flask, request, jsonify
import hmac
import hashlib

app = Flask(__name__)
WEBHOOK_SECRET = 'your-webhook-secret'

@app.route('/webhook', methods=['POST'])
def webhook():
    # Verify signature
    signature = request.headers.get('X-Chofesh-Signature')
    payload = request.get_data()
    
    expected_signature = hmac.new(
        WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(signature, expected_signature):
        return jsonify({'error': 'Invalid signature'}), 401
    
    # Process event
    event = request.json
    print(f"Received event: {event['event']}")
    
    if event['event'] == 'task.completed':
        # Handle task completion
        task_id = event['data']['taskId']
        result = event['data']['result']
        # Your logic here
    
    return jsonify({'received': True})

if __name__ == '__main__':
    app.run(port=3000)
```

---

## Security Best Practices

### 1. Always Verify Signatures

Never trust webhook payloads without verifying the HMAC signature.

### 2. Use HTTPS

Always use HTTPS endpoints for webhooks to prevent man-in-the-middle attacks.

### 3. IP Whitelisting

Configure IP whitelisting in your webhook settings to only accept requests from Chofesh.ai servers:

```
52.89.214.238
34.212.75.30
54.218.53.128
```

### 4. Rate Limiting

Implement rate limiting on your webhook endpoints:

```javascript
const rateLimit = require('express-rate-limit');

const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.post('/webhook', webhookLimiter, handleWebhook);
```

### 5. Rotate Secrets Regularly

Regenerate webhook secrets every 90 days:

1. Go to `/automation`
2. Click on webhook
3. Click "Regenerate Secret"
4. Update your application with new secret

### 6. Monitor Webhook Deliveries

Check the delivery history regularly:
- Failed deliveries may indicate issues
- High failure rates suggest endpoint problems
- Review error messages for debugging

### 7. Implement Idempotency

Handle duplicate webhook deliveries gracefully:

```javascript
const processedEvents = new Set();

function handleWebhook(event) {
  const eventId = event.id;
  
  if (processedEvents.has(eventId)) {
    console.log('Duplicate event, skipping');
    return { status: 'already_processed' };
  }
  
  // Process event
  processEvent(event);
  
  // Mark as processed
  processedEvents.add(eventId);
  
  return { status: 'processed' };
}
```

---

## Support

Need help with integrations?

- **Documentation**: https://docs.chofesh.ai
- **Support**: https://help.manus.im
- **Community**: https://discord.gg/chofesh

---

**Last Updated**: January 29, 2026
