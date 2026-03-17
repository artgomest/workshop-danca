export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const payment = req.body;

    // Verificar se é uma notificação válida do Mercado Pago
    if (payment.action === 'payment.created' || payment.type === 'payment') {
        const paymentId = payment.data ? payment.data.id : payment.id;
        
        // Consultar o pagamento completo na API
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          method: 'GET',
          headers: {
            "Authorization": `Bearer APP_USR-900719235341104-031620-7a120dbcfa5939e600723ce62e0dca88-3269966505`
          }
        });
        
        const paymentData = await response.json();

        // Se o pagamento for aprovado
        if (paymentData.status === 'approved') {
           // O "external_reference" do MP pode guardar o ID da inscrição do supabase
           const ref = paymentData.external_reference;

           if(ref) {
              const supabaseResponse = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/registrations?ref_pagamento=eq.${ref}`, {
                method: 'PATCH',
                headers: {
                  'apikey': process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  'Authorization': `Bearer ${process.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                  status_pagamento: 'aprovado'
                })
              });
              if(!supabaseResponse.ok) console.error("Erro Supabase:", await supabaseResponse.text());
           }
        }
    }
    
    // O webhook exige resposta rápida de "Recebido!" (200 OK) pro Mercado pago parar de tentar enviar
    return res.status(200).send('OK');
  } catch (error) {
    console.error("Erro webhook:", error);
    return res.status(500).json({ error: error.message });
  }
}
