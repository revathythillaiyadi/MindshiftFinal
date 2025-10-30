# N8N Workflow Setup Guide

## 🚨 **Issue Found: Workflow Not Active**

The webhook URL is correct, but the n8n workflow needs to be **activated** to receive webhook calls.

## 🔧 **Quick Fix:**

### 1. **Activate Your N8N Workflow**
1. Go to your n8n instance: `https://trevathy54996.app.n8n.cloud`
2. Open your webhook workflow
3. **Click the toggle switch in the top-right corner** to activate the workflow
4. The toggle should show "Active" (green) instead of "Inactive" (gray)

### 2. **Verify Webhook Configuration**
Make sure your webhook node has these settings:
- **HTTP Method**: `POST`
- **Path**: `17c8f51f-2da0-4d86-9ca2-15477300a680` (or leave empty)
- **Response Mode**: `Response Node` or `On Received`

### 3. **Test Again**
Once activated, run the test again:
```bash
python3 test_n8n_connection.py --webhook-url "https://trevathy54996.app.n8n.cloud/webhook/17c8f51f-2da0-4d86-9ca2-15477300a680"
```

## 📋 **Expected Workflow Structure:**

Your n8n workflow should look like this:

```
[Webhook] → [Process Data] → [Response/Output]
```

### **Webhook Node Settings:**
```json
{
  "httpMethod": "POST",
  "path": "17c8f51f-2da0-4d86-9ca2-15477300a680",
  "responseMode": "responseNode"
}
```

### **Sample Processing Node:**
```javascript
// Function node to process incoming data
const event = $input.first().json.event;
const data = $input.first().json.data;
const userId = $input.first().json.userId;

console.log('Received event:', event);
console.log('User ID:', userId);
console.log('Data:', data);

// Process based on event type
switch(event) {
  case 'chat_interaction':
    // Handle chat data
    break;
  case 'mood_logged':
    // Handle mood data
    break;
  case 'journal_entry':
    // Handle journal data
    break;
  case 'goal_action':
    // Handle goal data
    break;
}

return { event, userId, processed: true };
```

## 🧪 **Test Commands:**

### **Test Basic Connection:**
```bash
python3 test_n8n_connection.py --webhook-url "https://trevathy54996.app.n8n.cloud/webhook/17c8f51f-2da0-4d86-9ca2-15477300a680" --test-type connection
```

### **Test All Events:**
```bash
python3 test_n8n_connection.py --webhook-url "https://trevathy54996.app.n8n.cloud/webhook/17c8f51f-2da0-4d86-9ca2-15477300a680" --test-type all
```

### **Test in Browser:**
1. Restart your Vite server: `npm run dev`
2. Go to Dashboard
3. Click "Test Webhook Connection"

## ✅ **Success Indicators:**

When working correctly, you should see:
- ✅ **HTTP 200** responses
- ✅ **"Webhook connection successful!"** message
- ✅ **Data appearing in n8n executions list**

## 🔍 **Troubleshooting:**

### **Still Getting 404?**
- Double-check the workflow is **Active** (green toggle)
- Verify the webhook path matches the URL
- Check if the workflow has any errors

### **Getting 500 Errors?**
- Check the n8n workflow logs
- Ensure the workflow nodes are properly connected
- Test the workflow manually in n8n

### **Connection Timeout?**
- Check your internet connection
- Verify the n8n instance is accessible
- Try the webhook URL in a browser (should show n8n interface)

## 🎯 **Next Steps:**

1. **Activate your n8n workflow** (most important!)
2. **Test the connection** using the provided commands
3. **Set up your workflow** to process the incoming data
4. **Test from the browser** using the Dashboard

Once the workflow is active, the integration will work perfectly!

