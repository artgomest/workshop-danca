export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const payment = req.body;

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

    if (paymentData.status === 'approved' && paymentData.external_reference) {
        const ref = paymentData.external_reference;
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ywbnkaetpwixvkyeoyue.supabase.co';
        const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3bnFrYWV0cHdpeHZreWVveXVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY0ODA2MSwiZXhwIjoyMDg4MjI0MDYxfQ.vGeP4IBABDDMR7nIUXhsqTgydGhvKzM81HN51jblDC4';

        const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/registrations?ref_pagamento=eq.${ref}`, {
            method: 'PATCH',
            headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                status_pagamento: 'aprovado'
            })
        });

        const resultText = await supabaseResponse.text();

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
