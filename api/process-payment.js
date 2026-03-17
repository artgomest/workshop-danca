export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const paymentData = req.body;

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer APP_USR-900719235341104-031620-7a120dbcfa5939e600723ce62e0dca88-3269966505`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();
    console.log("Process-Payment MP Result Status:", data.status);

    // Se aprovado, já atualiza o banco de dados imediatamente (backup do webhook)
    if (data.status === 'approved' && data.external_reference) {
      const ref = data.external_reference;
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

      console.log("Process-Payment: Tentando atualizar DB para ref:", ref);

      try {
        const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/registrations?ref_pagamento=eq.${ref}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ status_pagamento: 'aprovado' })
        });
        const resultText = await supabaseResponse.text();
        console.log("Process-Payment Supabase Status:", supabaseResponse.status);
        console.log("Process-Payment Supabase Result:", resultText);
      } catch (dbError) {
        console.error("Erro ao atualizar DB no process-payment:", dbError);
      }
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error("Payment error:", error);
    return res.status(500).json({ error: error.message });
  }
}
