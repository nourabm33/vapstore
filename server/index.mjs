import { createServer } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { catalog } from './catalog.mjs';

const port = Number(process.env.PORT || 3001);
const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB_NAME || 'vappino';
const rateWindowMs = 60_000;
const rateLimit = 12;
const requests = new Map();
let client;
let orders;

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Idempotency-Key' };
const json = (status, body) => ({ status, body: JSON.stringify(body), headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const response = (res, result) => { res.writeHead(result.status, result.headers); res.end(result.body); };
const error = (code, message, status = 400) => json(status, { success: false, code, message });

function limited(ip) {
  const now = Date.now();
  const recent = (requests.get(ip) || []).filter((timestamp) => now - timestamp < rateWindowMs);
  if (recent.length >= rateLimit) { requests.set(ip, recent); return true; }
  recent.push(now); requests.set(ip, recent); return false;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''; let size = 0;
    req.on('data', (chunk) => { size += chunk.length; if (size > 20_000) reject(new Error('payload_too_large')); else body += chunk; });
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('invalid_json')); } });
    req.on('error', reject);
  });
}

function cleanText(value, max) { return typeof value === 'string' ? value.trim().replace(/[<>]/g, '').slice(0, max) : ''; }
function makeReference() { const date = new Date().toISOString().slice(0, 10).replaceAll('-', ''); return `VAP-${date}-${randomBytes(2).toString('hex').toUpperCase()}`; }

async function sendOrderNotification(order) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = process.env.OWNER_WHATSAPP_NUMBER;
  if (!token || !phoneNumberId || !recipient) return { success: false, code: 'WHATSAPP_NOT_CONFIGURED', message: 'Notification service is not configured.' };
  const lines = order.items.map((item) => `• ${item.productName} ${item.specification} x${item.quantity} — ${item.lineTotal} DT`).join('\n');
  const message = `Nouvelle commande ${order.orderReference}\nClient : ${order.customerName}\nTéléphone : ${order.customerPhone}\n\n${lines}\n\nTotal : ${order.totalAmount} DT`;
  try {
    const apiResponse = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(phoneNumberId)}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', to: recipient, type: 'text', text: { body: message } }) });
    const body = await apiResponse.json().catch(() => ({}));
    if (!apiResponse.ok || body.error) { console.error('WhatsApp API error', { status: apiResponse.status, code: body.error?.code, message: body.error?.message, body: body.error ? { error: body.error } : body }); return { success: false, code: 'WHATSAPP_API_ERROR', message: 'The notification provider rejected the request.' }; }
    return { success: true };
  } catch (requestError) { console.error('WhatsApp request error', { message: requestError instanceof Error ? requestError.message : 'unknown_error' }); return { success: false, code: 'WHATSAPP_REQUEST_FAILED', message: 'The notification provider could not be reached.' }; }
}

async function createOrder(req) {
  if (!orders) return error('DATABASE_NOT_CONFIGURED', 'Order storage is not configured.', 503);
  const body = await parseBody(req);
  const customerName = cleanText(body.customerName, 120);
  const customerPhone = cleanText(body.customerPhone, 24);
  const notes = cleanText(body.notes, 500);
  const idempotencyKey = cleanText(req.headers['idempotency-key'], 100);
  if (customerName.length < 2) return error('INVALID_CUSTOMER_NAME', 'Please provide your full name.');
  if (!/^\+?[0-9\s-]{8,18}$/.test(customerPhone)) return error('INVALID_CUSTOMER_PHONE', 'Please provide a valid phone number.');
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) return error('INVALID_ITEMS', 'Your order must contain at least one product.');
  if (!idempotencyKey) return error('MISSING_IDEMPOTENCY_KEY', 'A unique order key is required.');
  const items = [];
  for (const requested of body.items) {
    const product = catalog.get(requested?.productId);
    const quantity = Number(requested?.quantity);
    if (!product) return error('INVALID_PRODUCT', 'One of the selected products is no longer available.');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return error('INVALID_QUANTITY', 'Product quantities must be between 1 and 20.');
    items.push({ productId: requested.productId, productName: product[0], specification: product[1], quantity, unitPrice: product[2], lineTotal: product[2] * quantity });
  }
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const now = new Date();
  const order = { orderReference: makeReference(), customerName, customerPhone, items, totalQuantity, totalAmount, notes, status: 'pending', notificationStatus: 'pending', idempotencyKey, createdAt: now, updatedAt: now };
  try {
    const existing = await orders.findOne({ idempotencyKey });
    if (existing) return json(200, { success: true, order: { orderReference: existing.orderReference, totalQuantity: existing.totalQuantity, totalAmount: existing.totalAmount, status: existing.status } });
    await orders.insertOne(order);
    const notification = await sendOrderNotification(order);
    await orders.updateOne({ _id: order._id }, { $set: { status: notification.success ? 'confirmed' : 'failed', notificationStatus: notification.success ? 'sent' : notification.code, updatedAt: new Date() } });
    return json(201, { success: true, order: { orderReference: order.orderReference, totalQuantity, totalAmount, status: notification.success ? 'confirmed' : 'failed', notificationStatus: notification.success ? 'sent' : notification.code } });
  } catch (caught) { console.error('Order persistence error', { message: caught instanceof Error ? caught.message : 'unknown_error' }); return error('ORDER_SAVE_FAILED', 'The order could not be saved.', 500); }
}

async function testWhatsApp() { const result = await sendOrderNotification({ orderReference: 'VAP-TEST', customerName: 'VAPPINO test', customerPhone: 'test', totalAmount: 0, items: [] }); return result.success ? json(200, { success: true, message: 'WhatsApp notification accepted.' }) : error(result.code, result.message, result.code === 'WHATSAPP_NOT_CONFIGURED' ? 503 : 502); }

async function start() {
  if (mongoUri) { client = new MongoClient(mongoUri); await client.connect(); const database = client.db(mongoDbName); orders = database.collection('orders'); await orders.createIndexes([{ key: { orderReference: 1 }, unique: true }, { key: { createdAt: -1 } }, { key: { status: 1 } }, { key: { customerPhone: 1 } }, { key: { idempotencyKey: 1 }, unique: true }]); }
  const server = createServer(async (req, res) => {
    if (req.method === 'OPTIONS') return response(res, json(200, {}));
    if (limited(req.socket.remoteAddress || 'unknown')) return response(res, error('RATE_LIMITED', 'Too many requests. Please wait before trying again.', 429));
    try { if (req.method === 'POST' && req.url === '/api/orders') return response(res, await createOrder(req)); if (req.method === 'POST' && req.url === '/api/test-whatsapp') return response(res, await testWhatsApp()); return response(res, error('NOT_FOUND', 'Route not found.', 404)); } catch (caught) { return response(res, error(caught.message === 'invalid_json' ? 'INVALID_JSON' : 'REQUEST_FAILED', 'The request could not be processed.', 400)); }
  });
  server.listen(port, () => console.log(`VAPPINO API listening on ${port}`));
}
start().catch((caught) => { console.error('Server startup failed', { message: caught instanceof Error ? caught.message : 'unknown_error' }); process.exit(1); });
process.on('SIGINT', async () => { await client?.close(); process.exit(0); });
