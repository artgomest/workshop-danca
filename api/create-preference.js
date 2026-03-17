export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { totalValue, quantity, description, participants, external_reference } = req.body;

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer APP_USR-900719235341104-031620-7a120dbcfa5939e600723ce62e0dca88-3269966505`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        items: [
          {
            title: description || "Inscrição - Workshop de Dança IBF",
            quantity: 1,
            unit_price: Number(totalValue)
          }
        ],
        payment_methods: {
          excluded_payment_types: [],
          excluded_payment_methods: [],
          installments: 12
        },
        external_reference: external_reference,
        notification_url: "https://workshop-danca.igrejabatistafe.com.br/api/mp-webhook",
        back_urls: {
          success: "https://workshop-danca.igrejabatistafe.com.br/sucesso",
          failure: "https://workshop-danca.igrejabatistafe.com.br/",
          pending: "https://workshop-danca.igrejabatistafe.com.br/"
        },
        auto_return: "approved"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MP Error:", errorText);
      return res.status(500).json({ error: "Failed to create preference from Mercado Pago" });
    }

    const data = await response.json();
    return res.status(200).json({ init_point: data.init_point, preference_id: data.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
