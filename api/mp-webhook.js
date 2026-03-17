export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const payment = req.body;
    console.log("Webhook Body:", JSON.stringify(payment));

    const paymentId = payment.data ? payment.data.id : payment.id;
    if (!paymentId && payment.type !== 'payment') {
        return res.status(200).send('OK');
    }

    // Consultar o pagamento completo na API
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        "Authorization": `Bearer APP_USR-900719235341104-031620-7a120dbcfa5939e600723ce62e0dca88-3269966505`
      }
    });

    const paymentData = await response.json();
    console.log("Payment Data Status:", paymentData.status);
    console.log("External Reference:", paymentData.external_reference);

    if (paymentData.status === 'approved' && paymentData.external_reference) {
        const ref = paymentData.external_reference;
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

        console.log("Tentando atualizar Supabase para ref:", ref);

        const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/registrations?ref_pagamento=eq.${ref}`, {
            method: 'PATCH',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation' // Pede os dados de volta para ver se mudou
            },
            body: JSON.stringify({
                status_pagamento: 'aprovado'
            })
        });

        const resultText = await supabaseResponse.text();
        console.log("Supabase Status:", supabaseResponse.status);
        console.log("Supabase Result:", resultText);

        if (!supabaseResponse.ok) {
            console.error("Erro ao atualizar Supabase via webhook:", resultText);
        }
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error("Global Webhook Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
