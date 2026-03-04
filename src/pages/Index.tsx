import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, Users, Music, Star, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-dance.jpg";

const scheduleItems = [
  { time: "08:00 - 08:30", title: "Credenciamento", icon: Users },
  { time: "08:30 - 09:00", title: "Café da Manhã", icon: Star },
  { time: "09:00 - 09:30", title: "Abertura / Apresentação / Oração", icon: Music },
  { time: "10:00 - 11:30", title: "Aula de Contemporâneo", desc: "Profª Shirley – Cia Arca de Dança (Igreja Batista Rios de Vida)", icon: Music },
  { time: "11:30 - 13:00", title: "Intervalo – Almoço", icon: Star },
  { time: "13:00 - 14:30", title: "Aula de Hip Hop", desc: "Prof. Culu – Cia Companhia dos Anjos", icon: Music },
  { time: "14:50 - 16:20", title: "Aula de Dança Louvor", desc: "Professores Flavinho e Fiama", icon: Music },
  { time: "18:30", title: "Encerramento – Culto", desc: "Louvor IBF e Palavra Pr. Flavinho", icon: Star },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Dançarinos em movimento" className="w-full h-full object-cover" />
          <div className="absolute inset-0 navy-gradient opacity-70" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <img
              src="/logo-igreja.png"
              alt="Igreja Batista da Fé"
              className="w-24 h-auto mb-4 -rotate-90 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/admin")}
            />
            <img
              src="/logo.png"
              alt="Workshop de Dança - Excelência em Movimento"
              className="w-full max-w-[900px] max-h-[60vh] object-contain mx-auto mb-8 drop-shadow-2xl"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-6 mb-10 text-pearl/70"
          >
            <span className="flex items-center gap-2"><Calendar className="w-5 h-5 text-gold" /> 25 de Abril de 2026</span>
            <span className="flex items-center gap-2"><Clock className="w-5 h-5 text-gold" /> 08:00 às 18:30</span>
            <span className="flex items-center gap-2"><Users className="w-5 h-5 text-gold" /> 50 vagas</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Button variant="hero" size="lg" className="px-12 py-6 text-lg" onClick={() => navigate("/inscricao")}>
              Inscrever-se
            </Button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 border-2 border-gold/50 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-1.5 bg-gold rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Schedule Section */}
      <section className="py-20 px-4 bg-pearl">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-gold font-body tracking-[0.2em] uppercase text-sm mb-3">Programação</p>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-primary mb-6">Um Dia Completo</h2>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Um momento dedicado ao treinamento técnico e espiritual, desenvolvido especialmente para capacitar e inspirar ministros da dança em seu chamado.
            </p>
          </motion.div>

          <div className="space-y-4">
            {scheduleItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-4 md:gap-6 items-start p-4 md:p-6 rounded-lg bg-card border border-border hover:shadow-lg transition-shadow"
              >
                <div className="gold-gradient rounded-full p-2.5 shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                    <span className="text-gold font-body font-semibold text-sm whitespace-nowrap">{item.time}</span>
                    <h3 className="font-display font-semibold text-lg text-foreground">{item.title}</h3>
                  </div>
                  {item.desc && <p className="text-muted-foreground text-sm mt-1">{item.desc}</p>}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <Button variant="hero" size="lg" className="px-12 py-6 text-lg" onClick={() => navigate("/inscricao")}>
              Inscrever-se
            </Button>

            <div className="mt-12 space-y-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <MapPin className="w-5 h-5 text-gold" />
                <span>Rua monte castelo, 354 - rib. das neves</span>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  className="gap-2 border-gold/30 hover:bg-gold/10 text-primary"
                  onClick={() => window.open("https://www.instagram.com/batistafe.oficial/", "_blank")}
                >
                  <Instagram className="w-5 h-5" /> @batistafe.oficial
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-primary text-center">
        <p className="text-pearl/60 text-sm">© 2026 Igreja Batista da Fé – Congresso de Dança</p>
      </footer>
    </div>
  );
};

export default Index;
