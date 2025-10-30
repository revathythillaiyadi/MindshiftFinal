# N8N Integration Status & Setup Guide

## 🔍 Current Status

The n8n webhook integration is **properly implemented** in the MindShift app but **needs configuration** to be fully functional.

### ✅ What's Working:
- **Webhook Service**: Complete implementation in `src/lib/webhook.ts`
- **Event Types**: All major events supported (chat, mood, journal, goals, sessions)
- **Test Component**: WebhookTest component in Dashboard
- **Error Handling**: Comprehensive error handling and logging
- **TypeScript Types**: Proper type definitions for all events

### ⚠️ What Needs Configuration:
- **Environment Variable**: `VITE_N8N_WEBHOOK_URL` not set
- **Webhook URL**: Need actual n8n instance URL
- **Testing**: Connection not yet tested with real n8n instance

## 🚀 Setup Instructions

### 1. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Copy the example file
cp env_local_example.txt .env.local

# Edit .env.local and add your n8n webhook URL
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/mindshift
```

### 2. N8N Workflow Setup

In your n8n instance, create a webhook node with these settings:

```json
{
  "httpMethod": "POST",
  "path": "mindshift",
  "responseMode": "responseNode",
  "options": {}
}
```

### 3. Test the Connection

#### Option A: Use the Web Interface
1. Start the development server: `npm run dev`
2. Go to the Dashboard
3. Click "Test Webhook Connection" button
4. Check the result

#### Option B: Use the Test Script
```bash
# Install requests if needed
pip install requests

# Test with your webhook URL
python3 test_n8n_connection.py --webhook-url "https://your-n8n-instance.com/webhook/mindshift"

# Or test all event types
python3 test_n8n_connection.py --test-type all
```

## 📊 Event Types Supported

The integration supports these event types:

### 1. **Chat Interactions**
```typescript
{
  event: "chat_interaction",
  userId: string,
  timestamp: string,
  data: {
    message: string,
    response: string,
    mode: "reframe" | "journal",
    sessionId: string
  }
}
```

### 2. **Mood Tracking**
```typescript
{
  event: "mood_logged",
  userId: string,
  timestamp: string,
  data: {
    moodValue: number,
    moodLabel: string,
    notes?: string
  }
}
```

### 3. **Journal Entries**
```typescript
{
  event: "journal_entry",
  userId: string,
  timestamp: string,
  data: {
    title: string,
    content: string,
    entryDate: string
  }
}
```

### 4. **Goal Actions**
```typescript
{
  event: "goal_action",
  userId: string,
  timestamp: string,
  data: {
    title: string,
    completed: boolean,
    action: "created" | "completed" | "deleted"
  }
}
```

### 5. **Session Events**
```typescript
{
  event: "session_created",
  userId: string,
  timestamp: string,
  data: {
    sessionId: string,
    startTime: string,
    mode: string
  }
}
```

## 🔧 N8N Workflow Examples

### Basic Webhook Receiver
```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "mindshift",
        "responseMode": "responseNode"
      }
    },
    {
      "name": "Process Event",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const event = $input.first().json.event;\nconst data = $input.first().json.data;\nconst userId = $input.first().json.userId;\n\n// Process based on event type\nswitch(event) {\n  case 'chat_interaction':\n    // Handle chat data\n    break;\n  case 'mood_logged':\n    // Handle mood data\n    break;\n  case 'journal_entry':\n    // Handle journal data\n    break;\n  case 'goal_action':\n    // Handle goal data\n    break;\n}\n\nreturn { event, userId, processed: true };"
      }
    },
    {
      "name": "Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "responseBody": "{\"success\": true, \"message\": \"Event processed successfully\"}"
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [["Process Event"]]
    },
    "Process Event": {
      "main": [["Response"]]
    }
  }
}
```

### Database Integration Example
```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "mindshift"
      }
    },
    {
      "name": "Store in Database",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "insert",
        "table": "mindshift_events",
        "columns": "event_type,user_id,timestamp,data",
        "values": "={{ $json.event }},{{ $json.userId }},{{ $json.timestamp }},{{ JSON.stringify($json.data) }}"
      }
    }
  ]
}
```

## 🧪 Testing Commands

### Test Specific Event Types
```bash
# Test only connection
python3 test_n8n_connection.py --test-type connection

# Test chat events
python3 test_n8n_connection.py --test-type chat

# Test mood events
python3 test_n8n_connection.py --test-type mood

# Test journal events
python3 test_n8n_connection.py --test-type journal

# Test goal events
python3 test_n8n_connection.py --test-type goal
```

### Test with Custom URL
```bash
python3 test_n8n_connection.py --webhook-url "https://your-custom-n8n-instance.com/webhook/mindshift"
```

## 🔍 Troubleshooting

### Common Issues:

1. **"No webhook URL configured"**
   - Set `VITE_N8N_WEBHOOK_URL` in `.env.local`
   - Restart the development server

2. **"Connection timeout"**
   - Check if n8n instance is running
   - Verify webhook URL is correct
   - Check firewall/network settings

3. **"HTTP 404 Not Found"**
   - Verify webhook path in n8n
   - Check if workflow is active
   - Ensure webhook node is properly configured

4. **"HTTP 500 Internal Server Error"**
   - Check n8n workflow logs
   - Verify workflow is not in error state
   - Test webhook manually in n8n

### Debug Steps:

1. **Check Environment Variables**
   ```bash
   # In browser console
   console.log(import.meta.env.VITE_N8N_WEBHOOK_URL);
   ```

2. **Test Webhook Manually**
   ```bash
   curl -X POST https://your-n8n-instance.com/webhook/mindshift \
     -H "Content-Type: application/json" \
     -d '{"event":"test","data":{"message":"test"}}'
   ```

3. **Check Network Tab**
   - Open browser DevTools
   - Go to Network tab
   - Trigger webhook test
   - Check request/response details

## 📈 Next Steps

1. **Set up your n8n instance** with the webhook endpoint
2. **Configure the environment variable** with your webhook URL
3. **Test the connection** using the provided tools
4. **Set up your n8n workflow** to process the events
5. **Monitor the integration** for any issues

## 🎯 Integration Benefits

Once configured, the n8n integration provides:

- **Real-time Data Sync**: All app events sent to n8n immediately
- **Workflow Automation**: Trigger actions based on user behavior
- **Data Analytics**: Process and analyze user interactions
- **External Integrations**: Connect to databases, APIs, and other services
- **Custom Logic**: Implement complex business rules in n8n workflows

The integration is **production-ready** and just needs the webhook URL configuration to be fully functional!

