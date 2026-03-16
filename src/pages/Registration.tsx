import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, CheckCircle2, Copy } from "lucide-react";
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
}

const Registration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"quantity" | "form" | "success">("quantity");
  const [quantity, setQuantity] = useState(1);
  const [sameChurch, setSameChurch] = useState(false);
  const [churchName, setChurchName] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initParticipants = () => {
    setParticipants(Array.from({ length: quantity }, () => ({ nome: "", telefone: "", igreja: "", almoco: false })));
    setStep("form");
  };

  const updateParticipant = (index: number, field: keyof Participant, value: string | boolean) => {
    setParticipants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSubmit = async () => {
    const finalParticipants = participants.map((p) => ({
      nome: p.nome,
      telefone: p.telefone,
      igreja: sameChurch ? churchName : p.igreja,
      almoco: p.almoco,
    }));

    for (let i = 0; i < finalParticipants.length; i++) {
      const p = finalParticipants[i];
      if (!p.nome.trim() || !p.telefone.trim() || !p.igreja.trim()) {
        toast.error(`Preencha todos os campos do participante ${i + 1}`);
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await supabase.from("registrations").insert(finalParticipants);
    setIsSubmitting(false);

    if (error) {
      toast.error("Erro ao salvar inscrição. Tente novamente.");
      console.error(error);
      return;
    }

    setStep("success");
    toast.success("Inscrição realizada com sucesso!");
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
            <div className="bg-card border border-border rounded-xl p-6 md:p-10 shadow-sm">
              <p className="text-gold font-body tracking-[0.2em] uppercase text-xs mb-3">Passo 2</p>
              <h2 className="font-display text-3xl font-bold text-foreground mb-6">Dados dos Participantes</h2>

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
                            onCheckedChange={(checked) => updateParticipant(i, "almoco", checked === true)}
                          />
                          <Label htmlFor={`almoco-${i}`} className="text-sm cursor-pointer text-foreground">
                            Deseja almoçar no evento? (+ R$ 15,00)
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground ml-7 w-[90%] md:w-full">
                          Cardápio: Arroz, strogonoff de frango, batata palha e salada.
                        </p>
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

        {/* Step: Success */}
        {step === "success" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="bg-card border border-border rounded-xl p-10 md:p-16 shadow-sm">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                <CheckCircle2 className="w-20 h-20 text-gold mx-auto mb-6" />
              </motion.div>
              <h2 className="font-display text-3xl font-bold text-foreground mb-3">Pré-inscrição Registrada!</h2>
              <p className="text-muted-foreground mb-8">
                Seus dados foram salvos com sucesso.
              </p>

              <div className="bg-pearl/50 border border-gold/40 rounded-xl p-6 mb-8 shadow-sm text-center max-w-lg mx-auto">
                <h3 className="font-display font-bold text-lg mb-3 text-primary">Próximo passo: Pagamento 💳</h3>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  Para finalizar e garantir sua vaga, você precisa efetuar o pagamento seguro na nossa maquininha online do Mercado Pago. Aceitamos Pix, Boleto ou Cartão!
                </p>
              </div>

              <div className="mb-10 flex flex-col items-center">
                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                  <Button
                    className="w-full sm:w-auto bg-[#009EE3] hover:bg-[#007EBD] text-white gap-2 text-base md:text-lg py-6 px-8 shadow-lg shadow-[#009EE3]/20 transition-all hover:scale-105"
                    disabled={isSubmitting}
                    onClick={async () => {
                      setIsSubmitting(true);
                      try {
                        const extraLunchCost = participants.filter(p => p.almoco).length * 15;
                        const totalValue = calculateTotal(quantity) + extraLunchCost;
                        
                        const response = await fetch("/api/create-preference", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json"
                          },
                          body: JSON.stringify({
                            totalValue,
                            quantity,
                            description: `Inscrições - Workshop Excelência em Movimento`,
                            participants: participants
                          })
                        });

                        const data = await response.json();
                        if (data.init_point) {
                          // Redireciona para o Checkout Pro do Mercado Pago
                          window.location.href = data.init_point;
                        } else {
                          toast.error("Erro ao gerar pagamento. Tente novamente.");
                        }
                      } catch (error) {
                        toast.error("Erro ao conectar com servidor de pagamentos.");
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                  >
                    {isSubmitting ? "Gerando link seguro..." : "Pagar Inscrição Agora"}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6 pt-6 border-t border-border/50">
                <Button variant="ghost" onClick={() => navigate("/")}>Voltar ao Início</Button>
                <Button variant="gold" onClick={() => { setStep("quantity"); setQuantity(1); }}>
                  Nova Inscrição
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Registration;
