import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'payment-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url?.startsWith('/api/payment')) return next();
            
            const { MASTERCARD_GATEWAY_URL, MASTERCARD_MERCHANT_ID, MASTERCARD_API_PASSWORD } = env;
            const AUTH_HEADER = 'Basic ' + Buffer.from(`merchant.${MASTERCARD_MERCHANT_ID}:${MASTERCARD_API_PASSWORD}`).toString('base64');

            try {
              if (req.url === '/api/payment/session' && req.method === 'POST') {
                const r = await fetch(`${MASTERCARD_GATEWAY_URL}/api/rest/version/100/merchant/${MASTERCARD_MERCHANT_ID}/session`, {
                  method: 'POST', 
                  headers: { 'Authorization': AUTH_HEADER, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ session: { authenticationLimit: 5 } })
                });
                const d = await r.json();
                res.end(JSON.stringify({ sessionId: d.session.id }));
              } 
              else if (req.url === '/api/payment/initiate-auth' && req.method === 'POST') {
                let b = ''; for await (const c of req) b += c;
                const { orderId, transactionId, sessionId, currency } = JSON.parse(b);
                const r = await fetch(`${MASTERCARD_GATEWAY_URL}/api/rest/version/100/merchant/${MASTERCARD_MERCHANT_ID}/order/${orderId}/transaction/${transactionId}`, {
                  method: 'PUT', headers: { 'Authorization': AUTH_HEADER, 'Content-Type': 'application/json' },
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
                res.end(JSON.stringify(await r.json()));
              }
              else if (req.url === '/api/payment/authenticate' && req.method === 'POST') {
                let b = ''; for await (const c of req) b += c;
                const { orderId, transactionId, sessionId, amount, currency, browserDetails } = JSON.parse(b);
                const r = await fetch(`${MASTERCARD_GATEWAY_URL}/api/rest/version/100/merchant/${MASTERCARD_MERCHANT_ID}/order/${orderId}/transaction/${transactionId}`, {
                  method: 'PUT', headers: { 'Authorization': AUTH_HEADER, 'Content-Type': 'application/json' },
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
                const d = await r.json();
                console.log('Mastercard Authenticate Response:', JSON.stringify(d, null, 2));
                res.end(JSON.stringify(d));
              }
              else if (req.url?.startsWith('/api/payment/order-status/') && req.method === 'GET') {
                const oid = req.url.split('/').pop();
                const r = await fetch(`${MASTERCARD_GATEWAY_URL}/api/rest/version/100/merchant/${MASTERCARD_MERCHANT_ID}/order/${oid}`, {
                  method: 'GET', headers: { 'Authorization': AUTH_HEADER }
                });
                res.end(JSON.stringify(await r.json()));
              }
              else if (req.url === '/api/payment/pay' && req.method === 'POST') {
                let b = ''; for await (const c of req) b += c;
                const { orderId, sessionId, amount, currency, authTransactionId } = JSON.parse(b);
                const r = await fetch(`${MASTERCARD_GATEWAY_URL}/api/rest/version/100/merchant/${MASTERCARD_MERCHANT_ID}/order/${orderId}/transaction/pay-${Date.now()}`, {
                  method: 'PUT', headers: { 'Authorization': AUTH_HEADER, 'Content-Type': 'application/json' },
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
                const d = await r.json();
                console.log('Mastercard PAY Response:', JSON.stringify(d, null, 2));
                if (d.result === 'SUCCESS') res.end(JSON.stringify({ success: true, transactionId: d.transaction.id }));
                else res.end(JSON.stringify({ 
                  success: false, 
                  result: d.result, 
                  error: d.error || d.response,
                  gatewayCode: d.response?.gatewayCode,
                  details: d
                }));
              }
              else if (req.url === '/api/payment/3ds-callback' && (req.method === 'POST' || req.method === 'GET')) {
                res.setHeader('Content-Type', 'text/html');
                res.end(`
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
                `);
              }
              else { res.statusCode = 404; res.end('Not Found'); }
            } catch (e: any) {
              console.error('API Error:', e);
              res.statusCode = 500; res.end(JSON.stringify({ error: e.message }));
            }
          });
        }
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      allowedHosts: ["mooing-engaging-crisply.ngrok-free.dev"],
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
