import { useState } from 'react';
import { Send, CheckCircle, XCircle, Loader } from 'lucide-react';
import { webhookService } from '../lib/webhook';

export function WebhookTest() {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');

  const testWebhook = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTestMessage('');

    try {
      const success = await webhookService.testConnection();
      
      if (success) {
        setTestResult('success');
        setTestMessage('Webhook connection successful! Data sent to n8n.');
      } else {
        setTestResult('error');
        setTestMessage('Webhook connection failed. Check console for details.');
      }
    } catch (error) {
      setTestResult('error');
      setTestMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Send className="w-5 h-5 text-blue-600" />
        N8N Webhook Test
      </h3>
      
      <p className="text-sm text-gray-600 mb-4">
        Test the connection to your n8n webhook to ensure data is being sent correctly.
      </p>

      <div className="space-y-4">
        <button
          onClick={testWebhook}
          disabled={isTesting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition-all font-medium"
        >
          {isTesting ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Test Webhook Connection
            </>
          )}
        </button>

        {testResult && (
          <div className={`p-4 rounded-xl border-2 ${
            testResult === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {testResult === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${
                testResult === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult === 'success' ? 'Success!' : 'Failed'}
              </span>
            </div>
            <p className={`text-sm ${
              testResult === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {testMessage}
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Webhook Events</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>• <strong>chat_interaction</strong> - When user chats with AI</p>
          <p>• <strong>mood_logged</strong> - When user logs their mood</p>
          <p>• <strong>journal_entry</strong> - When user creates journal entry</p>
          <p>• <strong>goal_action</strong> - When user creates/completes goals</p>
          <p>• <strong>session_created</strong> - When user starts new session</p>
        </div>
      </div>
    </div>
  );
}
