import axios from 'axios';
import crypto from 'crypto';
const STEP_SIZES = './stepSizes.json';

const API_KEY = process.env.BINANCE_API_KEY;
const API_SECRET = process.env.BINANCE_API_SECRET;
const BASE_URL = 'https://fapi.binance.com';

function sign(query) {
  return crypto.createHmac('sha256', API_SECRET).update(query).digest('hex');
}

export async function getPosition(symbol) {
  const timestamp = Date.now();
  const query = `timestamp=${timestamp}`;
  const signature = sign(query);
  const url = `${BASE_URL}/fapi/v2/positionRisk?${query}&signature=${signature}`;

  const res = await axios.get(url, {
    headers: { 'X-MBX-APIKEY': API_KEY }
  });

  return res.data.find(p => p.symbol === symbol);
}

export async function closePosition(position) {
  const side = parseFloat(position.positionAmt) > 0 ? 'SELL' : 'BUY';
  const qty = Math.abs(parseFloat(position.positionAmt));
  const timestamp = Date.now();
  const query = `symbol=${position.symbol}&side=${side}&type=MARKET&quantity=${qty}&timestamp=${timestamp}`;
  const signature = sign(query);

  await axios.post(`${BASE_URL}/fapi/v1/order?${query}&signature=${signature}`, {}, {
    headers: { 'X-MBX-APIKEY': API_KEY }
  });
}

export async function openPosition({ symbol, side, quantity = 3 }) {
  const price = await getPrice(symbol);
  const stepSize = STEP_SIZES[symbol] || 0.01;
  const roundedQty = (quantity / price).toFixed(countDecimals(stepSize));

  const timestamp = Date.now();
  const query = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${roundedQty}&timestamp=${timestamp}`;
  const signature = sign(query);

  await axios.post(`${BASE_URL}/fapi/v1/order?${query}&signature=${signature}`, {}, {
    headers: { 'X-MBX-APIKEY': API_KEY }
  });
}

async function getPrice(symbol) {
  const res = await axios.get(`${BASE_URL}/fapi/v1/ticker/price?symbol=${symbol}`);
  return parseFloat(res.data.price);
}

function countDecimals(num) {
  return num.toString().includes('.') ? num.toString().split('.')[1].length : 0;
}
