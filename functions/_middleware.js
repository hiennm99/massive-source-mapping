// functions/_middleware.js
const ALLOWED_IPS = [
    '192.168.1.0/24',     // Local network (optional)
    '14.224.153.190/24' // My Public IP
];

export async function onRequest(context) {
    const { request, env, next } = context;

    // Get client IP
    const clientIP = request.headers.get('CF-Connecting-IP') ||
        request.headers.get('X-Forwarded-For') ||
        '0.0.0.0';

    // Check if IP is allowed
    const isAllowed = ALLOWED_IPS.some(allowedIP => {
        if (allowedIP.includes('/')) {
            // Handle CIDR notation (basic check)
            const [network, mask] = allowedIP.split('/');
            return clientIP.startsWith(network.split('.').slice(0, -1).join('.'));
        }
        return clientIP === allowedIP;
    });

    if (!isAllowed) {
        return new Response('Access Denied - IP not allowed', {
            status: 403,
            headers: {
                'Content-Type': 'text/plain',
            }
        });
    }

    // Continue to next middleware/page
    return next();
}