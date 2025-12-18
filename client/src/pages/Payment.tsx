import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Copy, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import QRCode from "qrcode";

export default function Payment() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  
  // Get plan ID from URL params
  const [searchParams] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });
  const planId = parseInt(searchParams.get("plan") || "1");

  const { data: plans, isLoading: plansLoading } = trpc.credits.getPlans.useQuery();
  const createTransactionMutation = trpc.transactions.create.useMutation({
    onSuccess: (data) => {
      toast.success("Transação criada! Aguardando pagamento...");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar transação");
    },
  });

  const selectedPlan = plans?.find(p => p.id === planId);

  useEffect(() => {
    if (selectedPlan) {
      const qrData = `00020126580014br.gov.bcb.pix0136${selectedPlan.id}5204000053039865802BR5913LOVABLE6009SAO PAULO62410503***63041D3D`;
      QRCode.toDataURL(qrData, {
        errorCorrectionLevel: "H",
        width: 300,
        margin: 1,
      }).then(setQrCodeUrl);
    }
  }, [selectedPlan]);

  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleCopyPaste = () => {
    const copyPasteCode = `00020126580014br.gov.bcb.pix0136${selectedPlan?.id}5204000053039865802BR5913LOVABLE6009SAO PAULO62410503***63041D3D`;
    navigator.clipboard.writeText(copyPasteCode);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateTransaction = async () => {
    if (!selectedPlan) return;
    await createTransactionMutation.mutateAsync({ planId: selectedPlan.id });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/dashboard")}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {plansLoading ? (
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
          </div>
        ) : selectedPlan ? (
          <div className="space-y-6">
            {/* Plan Summary */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Resumo da Compra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-slate-400">{selectedPlan.name}</span>
                  <span className="text-white font-semibold">{selectedPlan.credits} créditos</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400">Valor</span>
                  <span className="text-2xl font-bold text-white">{selectedPlan.price}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Escolha a Forma de Pagamento</CardTitle>
                <CardDescription className="text-slate-400">
                  Pague via PIX e receba seus créditos instantaneamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* PIX QR Code */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">QR Code PIX</h3>
                  {qrCodeUrl && (
                    <div className="flex justify-center p-4 bg-white rounded-lg">
                      <img src={qrCodeUrl} alt="QR Code PIX" className="w-64 h-64" />
                    </div>
                  )}
                  <p className="text-sm text-slate-400 text-center">
                    Abra seu app bancário e escaneie o código acima para pagar
                  </p>
                </div>

                {/* PIX Copia e Cola */}
                <div className="space-y-4 pt-4 border-t border-slate-700">
                  <h3 className="text-white font-semibold">Copia e Cola</h3>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <p className="text-slate-300 text-sm break-all font-mono">
                        00020126580014br.gov.bcb.pix0136{selectedPlan.id}...
                      </p>
                    </div>
                    <Button
                      onClick={handleCopyPaste}
                      className={`${
                        copied
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-blue-600 hover:bg-blue-700"
                      } text-white`}
                    >
                      {copied ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-slate-400">
                    Copie o código e cole no seu app bancário
                  </p>
                </div>

                {/* Confirm Payment */}
                <div className="pt-4 border-t border-slate-700 space-y-4">
                  <Button
                    onClick={handleCreateTransaction}
                    disabled={createTransactionMutation.isPending}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  >
                    {createTransactionMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {createTransactionMutation.isPending
                      ? "Processando..."
                      : "Já Paguei via PIX"}
                  </Button>
                  <p className="text-xs text-slate-400 text-center">
                    Após confirmar o pagamento, seus créditos serão adicionados à sua conta
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-900/20 border-blue-800/50">
              <CardContent className="pt-6">
                <p className="text-blue-300 text-sm">
                  💡 <strong>Dica:</strong> O pagamento via PIX é instantâneo. Após confirmar o pagamento, seus créditos estarão disponíveis imediatamente.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-slate-400">Plano não encontrado</p>
            <Button
              onClick={() => setLocation("/dashboard")}
              className="mt-4"
            >
              Voltar ao Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
