import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, CheckCircle2, Copy } from "lucide-react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Participant {
  nome: string;
  telefone: string;
  igreja: string;
  almoco: boolean;
  pagarAlmocoAgora: boolean;
}

const Registration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"quantity" | "form" | "payment" | "confirming" | "paid">("quantity");
  const [quantity, setQuantity] = useState(1);
  const [sameChurch, setSameChurch] = useState(false);
  const [churchName, setChurchName] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initParticipants = () => {
    setParticipants(Array.from({ length: quantity }, () => ({ nome: "", telefone: "", igreja: "", almoco: false, pagarAlmocoAgora: false })));
    setStep("form");
  };

  const updateParticipant = (index: number, field: keyof Participant, value: string | boolean) => {
    setParticipants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string } | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [currentRef, setCurrentRef] = useState<string | null>(null);

  // Polling: verifica se o Pix foi pago a cada 5 segundos
  useEffect(() => {
    if (!paymentId || step !== "payment") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/check-payment?id=${paymentId}`);
        const data = await res.json();
        if (data.status === "approved") {
          clearInterval(interval);
          toast.success("Pagamento aprovado! 🎉");
          setStep("confirming");
          setTimeout(() => setStep("paid"), 2500);
        }
      } catch (e) {
        console.error("Erro ao verificar pagamento:", e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentId, step]);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSubmit = async () => {
    const payment_ref = crypto.randomUUID();
    setCurrentRef(payment_ref);

    const finalParticipants = participants.map((p) => ({
      nome: p.nome,
      telefone: p.telefone,
      igreja: sameChurch ? churchName : p.igreja,
      almoco: p.almoco,
      ref_pagamento: payment_ref
    }));

    for (let i = 0; i < finalParticipants.length; i++) {
      const p = finalParticipants[i];
      if (!p.nome.trim() || !p.telefone.trim() || !p.igreja.trim()) {
        toast.error(`Preencha todos os campos do participante ${i + 1}`);
        return;
      }
    }

    setIsSubmitting(true);
    const { data: insertedData, error } = await supabase
        .from("registrations")
        .insert(finalParticipants)
        .select('id');

    if (error || !insertedData) {
      setIsSubmitting(false);
      toast.error("Erro ao salvar inscrição. Tente novamente.");
      console.error(error);
      return;
    }

    const ids = insertedData.map(row => row.id);
    setRegisteredIds(ids);

    // Calcular total com almoços que serão pagos agora
    const lunchCount = participants.filter(p => p.almoco && p.pagarAlmocoAgora).length;
    const total = calculateTotal(quantity) + (lunchCount * 15);
    setTotalAmount(total);

    try {
      const response = await fetch("/api/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalValue: total,
          quantity,
          description: "Inscrições - Workshop Excelência em Movimento",
          participants,
          external_reference: payment_ref
        })
      });
      const data = await response.json();
      if (data.preference_id) {
        // Inicializar SDK e ir para o step de pagamento
        initMercadoPago("APP_USR-5370f99b-2603-489a-be85-703a1cec3385", { locale: "pt-BR" });
        setPreferenceId(data.preference_id);
        setStep("payment");
        toast.success("Dados salvos! Agora finalize o pagamento.");
      } else {
        toast.error("Erro ao preparar pagamento.");
      }
    } catch (err) {
      console.error("Erro ao criar preferência:", err);
      toast.error("Erro ao conectar com servidor de pagamentos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = (qtd: number) => {
    if (qtd >= 10) return qtd * 75;
    if (qtd >= 8) return qtd * 80;
    if (qtd >= 5) return qtd * 85;
    if (qtd >= 3) return qtd * 90;
    return qtd * 100;
  };

  return (
    <div className="min-h-screen bg-pearl">
      {/* Header */}
      <div className="navy-gradient py-6 px-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate("/")} className="text-pearl/70 hover:text-pearl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-pearl">Inscrição</h1>
            <p className="text-pearl/60 text-sm">Excelência em Movimento – Workshop de Dança IBF</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Step: Quantity */}
        {step === "quantity" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="bg-card border border-border rounded-xl p-8 md:p-12 shadow-sm">
              <p className="text-gold font-body tracking-[0.2em] uppercase text-xs mb-3">Passo 1</p>
              <h2 className="font-display text-3xl font-bold text-foreground mb-2">Quantos ingressos?</h2>
              <p className="text-muted-foreground mb-8 text-sm">Selecione a quantidade de participantes</p>

              <div className="flex items-center justify-center gap-6 mb-8">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 rounded-full border-2 border-gold flex items-center justify-center text-gold hover:bg-gold hover:text-primary transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-6xl font-display font-bold text-foreground w-20 text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(50, quantity + 1))}
                  className="w-12 h-12 rounded-full border-2 border-gold flex items-center justify-center text-gold hover:bg-gold hover:text-primary transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-pearl/30 border border-gold/30 rounded-lg p-5 mb-10 max-w-sm mx-auto shadow-sm">
                <p className="text-muted-foreground text-xs uppercase tracking-[0.1em] font-semibold mb-1">Valor Total</p>
                <h3 className="text-4xl font-display font-bold text-gold">
                  R$ {calculateTotal(quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>

              <Button variant="gold" size="lg" className="px-10" onClick={initParticipants}>
                Continuar
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step: Form */}
        {step === "form" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-card border border-border rounded-xl p-6 md:p-10 shadow-sm relative">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <p className="text-gold font-body tracking-[0.2em] uppercase text-xs mb-3">Passo 2</p>
                  <h2 className="font-display text-3xl font-bold text-foreground">Dados dos Participantes</h2>
                </div>
                <div className="bg-pearl/30 border border-gold/30 rounded-lg py-2 px-4 shadow-sm text-right">
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.1em] font-semibold mb-1">Valor Atualizado</p>
                  <p className="text-xl font-display font-bold text-gold">
                    R$ {(calculateTotal(quantity) + participants.filter(p => p.almoco && p.pagarAlmocoAgora).length * 15).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6 p-4 bg-nude/50 rounded-lg border border-border">
                <Checkbox
                  id="same-church"
                  checked={sameChurch}
                  onCheckedChange={(checked) => setSameChurch(checked === true)}
                />
                <Label htmlFor="same-church" className="text-sm cursor-pointer text-foreground">
                  Todos os participantes são da mesma igreja?
                </Label>
              </div>

              {sameChurch && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-8">
                  <Label className="text-sm text-muted-foreground mb-1.5 block">Nome da Igreja (para todos)</Label>
                  <Input
                    placeholder="Ex: Igreja Batista da Fé"
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    className="border-border focus:ring-gold"
                  />
                </motion.div>
              )}

              <div className="space-y-8">
                {participants.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border border-border rounded-lg p-5 bg-background"
                  >
                    <p className="font-display font-semibold text-foreground mb-4">
                      Participante {i + 1}
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm text-muted-foreground mb-1.5 block">Nome Completo</Label>
                        <Input
                          placeholder="Nome completo"
                          value={p.nome}
                          onChange={(e) => updateParticipant(i, "nome", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground mb-1.5 block">Telefone</Label>
                        <Input
                          placeholder="(00) 00000-0000"
                          value={p.telefone}
                          onChange={(e) => updateParticipant(i, "telefone", formatPhone(e.target.value))}
                        />
                      </div>
                      {!sameChurch && (
                        <div>
                          <Label className="text-sm text-muted-foreground mb-1.5 block">Igreja</Label>
                          <Input
                            placeholder="Nome da igreja"
                            value={p.igreja}
                            onChange={(e) => updateParticipant(i, "igreja", e.target.value)}
                          />
                        </div>
                      )}
                      <div className="flex flex-col gap-2 pt-2">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`almoco-${i}`}
                            checked={p.almoco}
                            onCheckedChange={(checked) => {
                              updateParticipant(i, "almoco", checked === true);
                              if (!checked) updateParticipant(i, "pagarAlmocoAgora", false);
                            }}
                          />
                          <Label htmlFor={`almoco-${i}`} className="text-sm cursor-pointer text-foreground">
                            Deseja almoçar no evento? (R$ 15,00)
                          </Label>
                        </div>
                        {p.almoco && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="ml-7 space-y-2">
                            <p className="text-xs text-muted-foreground">
                              Cardápio: Arroz, strogonoff de frango, batata palha e salada.
                            </p>
                            <div className="flex items-center gap-3 bg-gold/5 border border-gold/20 rounded-lg p-3">
                              <Checkbox
                                id={`pagar-almoco-${i}`}
                                checked={p.pagarAlmocoAgora}
                                onCheckedChange={(checked) => updateParticipant(i, "pagarAlmocoAgora", checked === true)}
                              />
                              <div>
                                <Label htmlFor={`pagar-almoco-${i}`} className="text-sm cursor-pointer text-foreground">
                                  Pagar o almoço agora
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  Se preferir, você pode pagar no dia do evento.
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-4 mt-8">
                <Button variant="outline" onClick={() => setStep("quantity")}>Voltar</Button>
                <Button variant="gold" className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Confirmar Inscrição"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step: Payment (Checkout Bricks) */}
        {step === "payment" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-card border border-border rounded-xl p-6 md:p-10 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <p className="text-gold font-body tracking-[0.2em] uppercase text-xs mb-3">Passo 3</p>
                  <h2 className="font-display text-3xl font-bold text-foreground">Pagamento Seguro</h2>
                </div>
              </div>

              {/* Resumo do Pedido */}
              <div className="bg-pearl/30 border border-gold/30 rounded-xl p-5 mb-6">
                <h3 className="font-display font-bold text-base text-foreground mb-4">Resumo do Pedido</h3>
                <div className="space-y-3 text-sm">
                  {/* Ingressos */}
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">{quantity}x Ingresso</span>
                    <span className="font-semibold text-foreground">R$ {calculateTotal(quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-xs text-muted-foreground -mt-1">
                    R$ {(calculateTotal(quantity) / quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por pessoa
                  </div>

                  {/* Almoço (só aparece se alguém marcou pagar agora) */}
                  {participants.filter(p => p.almoco && p.pagarAlmocoAgora).length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-foreground">{participants.filter(p => p.almoco && p.pagarAlmocoAgora).length}x Almoço</span>
                      <span className="font-semibold text-foreground">R$ {(participants.filter(p => p.almoco && p.pagarAlmocoAgora).length * 15).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {/* Info almoço no dia */}
                  {participants.filter(p => p.almoco && !p.pagarAlmocoAgora).length > 0 && (
                    <div className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-2">
                      🍽️ {participants.filter(p => p.almoco && !p.pagarAlmocoAgora).length} almoço(s) será(ão) pago(s) no dia do evento.
                    </div>
                  )}

                  {/* Divider + Total */}
                  <div className="pt-3 border-t border-gold/30 flex justify-between items-center">
                    <span className="font-display font-bold text-base text-foreground">Total</span>
                    <span className="font-display font-bold text-xl text-gold">
                      R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground text-sm mb-6">
                Escolha sua forma de pagamento abaixo. Aceitamos Pix e Cartão de Crédito.
              </p>

              <div id="payment-brick-container" className={pixData ? "hidden" : "block"}>
                {preferenceId && (
                  <Payment
                    initialization={{
                      amount: totalAmount,
                      preferenceId: preferenceId,
                      payer: {
                        email: "inscricao@igrejabatistafe.com.br", // E-mail padrão para evitar prompt
                      }
                    }}
                    customization={{
                      paymentMethods: {
                        creditCard: "all",
                        debitCard: "all",
                        bankTransfer: "all",
                        maxInstallments: 12,
                      },
                      visual: {
                        style: {
                          customVariables: {
                            formBackgroundColor: "#FDFBF7",
                            baseColor: "#C6A55C",
                          }
                        }
                      }
                    }}
                    onSubmit={async ({ formData }) => {
                      try {
                        const response = await fetch("/api/process-payment", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            ...formData,
                            external_reference: currentRef
                          }),
                        });
                        const result = await response.json();

                        if (result.status === "approved") {
                          toast.success("Pagamento aprovado! 🎉");
                          setStep("confirming");
                          setTimeout(() => setStep("paid"), 2500);
                        } else if (result.status === "pending" || result.status === "in_process") {
                          // Pix: capturar QR Code e paymentId da resposta
                          if (result.id) setPaymentId(String(result.id));
                          const txData = result.point_of_interaction?.transaction_data;
                          if (txData?.qr_code_base64 && txData?.qr_code) {
                            setPixData({
                              qr_code: txData.qr_code,
                              qr_code_base64: txData.qr_code_base64,
                            });
                          }
                          toast.info("Pix gerado! Escaneie o QR Code ou copie o código.");
                        } else {
                          toast.error("Pagamento não aprovado. Tente novamente.");
                        }
                      } catch (error) {
                        console.error("Erro no pagamento:", error);
                        toast.error("Erro ao processar pagamento.");
                      }
                    }}
                    onError={(error) => {
                      console.error("Brick error:", error);
                    }}
                    onReady={() => {
                      console.log("Payment Brick pronto");
                    }}
                  />
                )}
              </div>

              {/* QR Code Pix */}
              {pixData && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-6 bg-white border-2 border-gold/40 rounded-xl shadow-md max-w-md mx-auto text-center">
                  <h3 className="font-display font-bold text-lg mb-2 text-foreground">📱 Escaneie o QR Code Pix</h3>
                  <p className="text-muted-foreground text-sm mb-3">Abra o app do seu banco e escaneie:</p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <p className="text-sm font-semibold text-amber-900">Destinatário: Arthur Gomes Esteves</p>
                    <p className="text-xs text-amber-700">Líder de mídia da IBF</p>
                  </div>
                  <img
                    src={`data:image/png;base64,${pixData.qr_code_base64}`}
                    alt="QR Code Pix"
                    className="w-56 h-56 mx-auto mb-4 rounded-lg border border-border"
                  />
                  <p className="text-muted-foreground text-xs mb-2">Ou copie o código Pix:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pixData.qr_code}
                      className="flex-1 text-xs p-2 bg-pearl border border-border rounded-lg truncate"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(pixData.qr_code);
                        toast.success("Código Pix copiado!");
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-gold text-xs font-semibold mt-4">Após o pagamento ser confirmado, o acesso ao grupo será liberado automaticamente.</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-4 text-xs"
                    onClick={() => setPixData(null)}
                  >
                    Alterar forma de pagamento
                  </Button>
                </motion.div>
              )}

              <div className="flex gap-4 mt-6 pt-6 border-t border-border/50">
                <Button variant="ghost" onClick={() => navigate("/")}>Voltar ao Início</Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step: Confirming (animated check) */}
        {step === "confirming" && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex flex-col items-center justify-center py-20"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-200/50">
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-green-600" />
                </motion.div>
              </div>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.5 }}
              className="font-display text-3xl font-bold text-foreground"
            >
              Pagamento Aprovado!
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.8 }}
              className="text-muted-foreground mt-2"
            >
              Redirecionando...
            </motion.p>
          </motion.div>
        )}

        {/* Step: Paid (Success) */}
        {step === "paid" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="bg-card border border-border rounded-xl p-10 md:p-16 shadow-sm">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
              </motion.div>
              <h2 className="font-display text-3xl font-bold text-foreground mb-3">Inscrição Confirmada!</h2>
              <p className="text-muted-foreground mb-8">
                Seu pagamento foi recebido. Sua vaga no <strong className="text-gold">Workshop Excelência em Movimento</strong> está garantida!
              </p>

              <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-xl p-6 mb-10 text-center max-w-lg mx-auto relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#25D366]"></div>
                <h3 className="font-display font-bold text-xl mb-3 text-foreground">📢 Último passo!</h3>
                <p className="text-sm text-foreground/80 mb-6 leading-relaxed">
                  Entre no nosso grupo exclusivo para receber os avisos oficiais, horários e informações sobre o Workshop.
                </p>
                <Button
                  size="lg"
                  className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white gap-2 py-6 text-lg font-bold shadow-lg shadow-[#25D366]/20 transition-all hover:scale-[1.02]"
                  onClick={() => window.open("https://chat.whatsapp.com/FZRXeMNX73167SGM5bFKfT", "_blank")}
                >
                  Entrar no Grupo do Workshop
                </Button>

                {participants.length > 1 && (
                  <div className="mt-8 pt-6 border-t border-[#25D366]/20">
                    <p className="text-sm font-semibold text-foreground mb-4">
                      📍 Você inscreveu {participants.length} pessoas. Compartilhe o link do grupo com os outros participantes:
                    </p>
                    <div className="flex flex-col gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/5"
                        onClick={() => {
                          const message = encodeURIComponent(`Olá! Realizei nossa inscrição para o Workshop de Dança IBF. Segue o link do grupo oficial: https://chat.whatsapp.com/FZRXeMNX73167SGM5bFKfT`);
                          window.open(`https://wa.me/?text=${message}`, "_blank");
                        }}
                      >
                        Compartilhar via WhatsApp
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full gap-2 text-muted-foreground"
                        onClick={() => {
                          navigator.clipboard.writeText("https://chat.whatsapp.com/FZRXeMNX73167SGM5bFKfT");
                          toast.success("Link do grupo copiado!");
                        }}
                      >
                        <Copy className="w-4 h-4" /> Copiar Link
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate("/")}
                className="text-sm font-semibold text-muted-foreground hover:text-gold transition-colors underline underline-offset-4"
              >
                Voltar ao início
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Registration;
