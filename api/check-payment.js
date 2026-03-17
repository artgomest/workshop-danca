export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      method: 'GET',
      headers: {
        "Authorization": `Bearer APP_USR-900719235341104-031620-7a120dbcfa5939e600723ce62e0dca88-3269966505`
      }
    });

    const data = await response.json();

    // Se aprovado via polling, atualiza o banco de dados (backup do webhook)
    if (data.status === 'approved' && data.external_reference) {
      const ref = data.external_reference;
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ywbnkaetpwixvkyeoyue.supabase.co';
      const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3bnFrYWV0cHdpeHZreWVveXVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY0ODA2MSwiZXhwIjoyMDg4MjI0MDYxfQ.vGeP4IBABDDMR7nIUXhsqTgydGhvKzM81HN51jblDC4';

      try {
        await fetch(`${supabaseUrl}/rest/v1/registrations?ref_pagamento=eq.${ref}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ status_pagamento: 'aprovado' })
        });
      } catch (dbError) {
        console.error("Erro ao atualizar DB no check-payment:", dbError);
      }
    }

    return res.status(200).json({ status: data.status });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
