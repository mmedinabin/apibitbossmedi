import { getPosition, closePosition, openPosition } from '../binanceRest.js';
import { sendTelegram } from '../telegram.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const payload = req.body;
    console.log("Json Payload", payload);

    if (!payload.symbol || !payload.side) {
      await sendTelegram(`✅ Orden ${payload.side} ejecutada para ${payload.symbol}`);
      return res.status(400).json({ error: 'symbol y side son requeridos' });
    }

    if (payload.symbol.endsWith('.P')) {
      payload.symbol = payload.symbol.replace('.P', '');
    }

    payload.side = payload.side.toUpperCase();

    const position = await getPosition(payload.symbol);

    if (position && parseFloat(position.positionAmt) !== 0) {
      await closePosition(position);
      await new Promise((r) => setTimeout(r, 1500));
    }

    await openPosition(payload);

    try {
      await sendTelegram(`✅ Orden ${payload.side} ejecutada para ${payload.symbol}`);
    } catch (err) {
      console.error('⚠️ Error al enviar mensaje a Telegram:', err.message);
    }

    return res.status(200).json({ status: 'ok', message: 'Orden procesada' });
  } catch (err) {
    try {
      await sendTelegram(`✅ Errr Orden ${payload.side} ejecutada para ${payload.symbol}`);
      //await sendTelegram(`❌ Error procesando orden: ${err.message}`);
    } catch (e) {
      console.error('⚠️ No se pudo notificar el error a Telegram:', e.message);
    }
    return res.status(500).json({ status: 'error', message: err.message });
  }
}