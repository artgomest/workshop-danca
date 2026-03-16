import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface Registration {
  id: string;
  nome: string;
  telefone: string;
  igreja: string;
  almoco: boolean;
  status_pagamento?: string;
  created_at: string;
}

const ADMIN_PASSWORD = "ibf2026";

const Admin = () => {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      fetchRegistrations();
    } else {
      toast.error("Senha incorreta");
    }
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);

    if (error) {
      toast.error("Erro ao carregar inscrições");
      console.error(error);
      return;
    }
    setRegistrations((data as unknown as Registration[]) || []);
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(
      registrations.map((r, i) => ({
        "#": i + 1,
        "Nome Completo": r.nome,
        Telefone: r.telefone,
        Igreja: r.igreja,
        "Vai almoçar?": r.almoco ? "Sim" : "Não",
        "Pagamento": r.status_pagamento === "aprovado" ? "Aprovado" : "Pendente",
        "Data Inscrição": new Date(r.created_at).toLocaleString("pt-BR"),
      }))
    );
    ws["!cols"] = [{ wch: 5 }, { wch: 35 }, { wch: 18 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, "Inscrições");
    XLSX.writeFile(wb, "inscricoes-workshop-danca.xlsx");
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-pearl flex items-center justify-center px-4">
        <div className="bg-card border border-border rounded-xl p-8 max-w-sm w-full shadow-sm text-center">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">Área Administrativa</h2>
          <Input
            type="password"
            placeholder="Senha de acesso"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="mb-4"
          />
          <Button variant="gold" className="w-full" onClick={handleLogin}>
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pearl">
      <div className="navy-gradient py-6 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="text-pearl/70 hover:text-pearl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold text-pearl">Inscrições</h1>
              <p className="text-pearl/60 text-sm">{registrations.length} participante{registrations.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchRegistrations} disabled={loading} className="text-pearl border-pearl/30 hover:bg-pearl/10">
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Atualizar
            </Button>
            <Button variant="hero" size="sm" onClick={exportExcel} disabled={registrations.length === 0}>
              <Download className="w-4 h-4 mr-1" /> Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {registrations.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">Nenhuma inscrição ainda.</p>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Igreja</TableHead>
                  <TableHead>Almoço</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((r, i) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{i + 1}</TableCell>
                    <TableCell>{r.nome}</TableCell>
                    <TableCell>{r.telefone}</TableCell>
                    <TableCell>{r.igreja}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.almoco ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {r.almoco ? "Sim" : "Não"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.status_pagamento === 'aprovado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {r.status_pagamento === 'aprovado' ? "Aprovado" : "Pendente"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
