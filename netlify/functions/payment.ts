import { Handler } from '@netlify/functions';

const handler: Handler = async (event, context) => {
  const { path, httpMethod, body } = event;
  const { 
    MASTERCARD_GATEWAY_URL, 
    MASTERCARD_MERCHANT_ID, 
    MASTERCARD_API_PASSWORD 
  } = process.env;

  const AUTH_HEADER = 'Basic ' + Buffer.from(`merchant.${MASTERCARD_MERCHANT_ID}:${MASTERCARD_API_PASSWORD}`).toString('base64');

  try {
    // POST /api/payment/session
    if (path === '/api/payment/session' && httpMethod === 'POST') {
      const r = await fetch(`${MASTERCARD_GATEWAY_URL}/api/rest/version/100/merchant/${MASTERCARD_MERCHANT_ID}/session`, {
        method: 'POST',
        headers: { 'Authorization': AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: { authenticationLimit: 5 } })
      });
      const d = await r.json() as any;
      return {
        statusCode: 200,
        body: JSON.stringify({ sessionId: d.session.id })
      };
    }

    // POST /api/payment/initiate-auth
    if (path === '/api/payment/initiate-auth' && httpMethod === 'POST') {
      const { orderId, transactionId, sessionId, currency } = JSON.parse(body || '{}');
      const r = await fetch(`${MASTERCARD_GATEWAY_URL}/api/rest/version/100/merchant/${MASTERCARD_MERCHANT_ID}/order/${orderId}/transaction/${transactionId}`, {
        method: 'PUT',
        headers: { 'Authorization': AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiOperation: 'INITIATE_AUTHENTICATION',
          authentication: {
            acceptVersions: '3DS1,3DS2',
            channel: 'PAYER_BROWSER',
            purpose: 'PAYMENT_TRANSACTION'
          },
          order: { currency: currency || 'JOD' },
          session: { id: sessionId }
        })
      });
      return {
        statusCode: 200,
        body: JSON.stringify(await r.json())
      };
    }

    // POST /api/payment/authenticate
    if (path === '/api/payment/authenticate' && httpMethod === 'POST') {
      const { orderId, transactionId, sessionId, amount, currency, browserDetails } = JSON.parse(body || '{}');
      const r = await fetch(`${MASTERCARD_GATEWAY_URL}/api/rest/version/100/merchant/${MASTERCARD_MERCHANT_ID}/order/${orderId}/transaction/${transactionId}`, {
        method: 'PUT',
        headers: { 'Authorization': AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiOperation: 'AUTHENTICATE_PAYER',
          authentication: { redirectResponseUrl: browserDetails.returnUrl },
          device: {
            browser: 'MOZILLA',
            browserDetails: {
              javaEnabled: browserDetails.javaEnabled,
              language: browserDetails.language,
              screenHeight: browserDetails.screenHeight,
              screenWidth: browserDetails.screenWidth,
              timeZone: browserDetails.timeZone,
              colorDepth: browserDetails.colorDepth,
              '3DSecureChallengeWindowSize': 'FULL_SCREEN',
              acceptHeaders: 'text/html'
            }
          },
          order: { amount: String(Number(amount).toFixed(2)), currency: currency || 'JOD' },
          session: { id: sessionId }
        })
      });
      return {
        statusCode: 200,
        body: JSON.stringify(await r.json())
      };
    }

    // GET /api/payment/order-status/:oid
    if (path.startsWith('/api/payment/order-status/') && httpMethod === 'GET') {
      const oid = path.split('/').pop();
      const r = await fetch(`${MASTERCARD_GATEWAY_URL}/api/rest/version/100/merchant/${MASTERCARD_MERCHANT_ID}/order/${oid}`, {
        method: 'GET',
        headers: { 'Authorization': AUTH_HEADER }
      });
      return {
        statusCode: 200,
        body: JSON.stringify(await r.json())
      };
    }

    // POST /api/payment/pay
    if (path === '/api/payment/pay' && httpMethod === 'POST') {
      const { orderId, sessionId, amount, currency, authTransactionId } = JSON.parse(body || '{}');
      const r = await fetch(`${MASTERCARD_GATEWAY_URL}/api/rest/version/100/merchant/${MASTERCARD_MERCHANT_ID}/order/${orderId}/transaction/pay-${Date.now()}`, {
        method: 'PUT',
        headers: { 'Authorization': AUTH_HEADER, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiOperation: 'PAY',
          authentication: { transactionId: authTransactionId },
          order: {
            amount: String(Number(amount).toFixed(2)),
            currency: currency || 'JOD',
            reference: orderId
          },
          session: { id: sessionId }
        })
      });
      const d = await r.json() as any;
      if (d.result === 'SUCCESS') {
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true, transactionId: d.transaction.id })
        };
      } else {
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: false,
            result: d.result,
            error: d.error || d.response,
            gatewayCode: d.response?.gatewayCode,
            details: d
          })
        };
      }
    }

    // GET/POST /api/payment/3ds-callback
    if (path === '/api/payment/3ds-callback') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: `
          <!DOCTYPE html>
          <html>
          <head><title>3DS Complete</title></head>
          <body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0a0c10;color:white;">
            <div style="text-align:center;padding:20px;">
              <div style="font-size:48px;margin-bottom:16px;">🛡️</div>
              <h3 style="color:#primary;margin:0 0 8px">NY11 Security</h3>
              <p style="color:#888;font-size:14px;margin:0">Verifying your payment...</p>
            </div>
            <script>
              function notify() {
                var targets = [];
                try { if (window.opener) targets.push(window.opener); } catch(e) {}
                try { if (window.top && window.top !== window) targets.push(window.top); } catch(e) {}
                try { if (window.parent && window.parent !== window) targets.push(window.parent); } catch(e) {}
                targets.forEach(function(t) { try { t.postMessage('3ds_challenge_complete', '*'); } catch(e) {} });
              }
              notify();
              setTimeout(notify, 500);
            </script>
          </body>
          </html>
        `
      };
    }

    return {
      statusCode: 404,
      body: 'Not Found'
    };
  } catch (error: any) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

export { handler };
