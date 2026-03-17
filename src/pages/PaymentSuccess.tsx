import { motion } from "framer-motion";
import { CheckCircle2, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PaymentSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-pearl flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="w-full max-w-xl"
      >
        <div className="bg-card border border-border rounded-xl p-8 md:p-12 shadow-xl text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          >
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </motion.div>
          
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">
            Pagamento Aprovado!
          </h1>
          
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            Sua inscrição no <strong className="text-gold">Workshop Excelência em Movimento</strong> está garantida e já contabilizamos a sua(s) vaga(s).
          </p>

          <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-xl p-6 mb-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#25D366]"></div>
            <h3 className="font-display font-bold text-xl mb-3 text-foreground flex justify-center items-center gap-2">
              <MessageCircle className="text-[#25D366]" fill="currentColor" /> 
              Atenção: Último passo!
            </h3>
            <p className="text-sm text-foreground/80 mb-6 leading-relaxed">
              Todas as informações sobre o que vestir, avisos, materiais e horários atualizados serão enviados exclusivamente no nosso grupo fechado de avisos.
            </p>
            
            <Button
              size="lg"
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white gap-2 py-6 text-lg font-bold uppercase tracking-wide shadow-lg shadow-[#25D366]/20 transition-all hover:scale-[1.02]"
              onClick={() => window.open("https://chat.whatsapp.com/FZRXeMNX73167SGM5bFKfT", "_blank")}
            >
              Entrar no Grupo Oficial do Workshop <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </div>

          <button 
            onClick={() => navigate("/")}
            className="text-sm font-semibold text-muted-foreground hover:text-gold transition-colors underline underline-offset-4"
          >
            Sair e voltar ao início
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
