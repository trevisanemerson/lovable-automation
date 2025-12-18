import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Copy, CheckCircle2, Loader2, Zap, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Payment() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
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
      if (data.pixPayment) {
        setPixData(data.pixPayment);
        toast.success("Código PIX gerado com sucesso!");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao processar pagamento");
    },
  });

  const selectedPlan = plans?.find(p => p.id === planId);

  useEffect(() => {
    // Auto-create transaction when component mounts
    if (selectedPlan && !pixData && !createTransactionMutation.isPending) {
      createTransactionMutation.mutate({ planId: selectedPlan.id });
    }
  }, [selectedPlan?.id]);

  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleCopyPaste = () => {
    if (pixData?.copyPaste) {
      navigator.clipboard.writeText(pixData.copyPaste);
      setCopied(true);
      toast.success("Código copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePaymentConfirmed = () => {
    setPaymentConfirmed(true);
    toast.success("Pagamento confirmado! Seus créditos serão adicionados em breve.");
    setTimeout(() => {
      setLocation("/dashboard");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/plans")}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-400" />
            <span className="text-white font-semibold">Pagamento PIX</span>
          </div>
          <div className="w-20" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {plansLoading || createTransactionMutation.isPending ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : selectedPlan ? (
          <div className="space-y-6">
            {/* Success State */}
            {paymentConfirmed && (
              <Card className="bg-green-900/20 border-green-800/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-green-300 font-semibold">Pagamento Confirmado!</p>
                      <p className="text-green-200 text-sm">Você será redirecionado para o dashboard em alguns segundos...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Plan Summary */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Resumo da Compra</CardTitle>
                <CardDescription className="text-slate-400">
                  Você está adquirindo créditos para automatizar a criação de contas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-700">
                  <span className="text-slate-400 font-medium">{selectedPlan.name}</span>
                  <span className="text-white font-semibold text-lg">{selectedPlan.credits} créditos</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-700">
                  <span className="text-slate-400">Preço unitário</span>
                  <span className="text-white">
                    R$ {(parseFloat(selectedPlan.price.replace("R$", "").replace(",", ".")) / selectedPlan.credits).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 bg-blue-900/20 px-4 rounded-lg border border-blue-800/30">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-2xl font-bold text-blue-400">{selectedPlan.price}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            {pixData ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Pagamento via PIX</CardTitle>
                  <CardDescription className="text-slate-400">
                    Escolha a forma que preferir para pagar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* PIX QR Code */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center text-blue-400 font-bold text-sm">
                        1
                      </div>
                      <h3 className="text-white font-semibold">Escaneie o QR Code</h3>
                    </div>
                    {pixData.qrCode && (
                      <div className="flex justify-center p-6 bg-white rounded-lg">
                        <img 
                          src={`data:image/png;base64,${pixData.qrCode}`} 
                          alt="QR Code PIX" 
                          className="w-64 h-64"
                        />
                      </div>
                    )}
                    <p className="text-sm text-slate-400 text-center">
                      Abra seu app bancário e escaneie o código acima para pagar instantaneamente
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-slate-700" />
                    <span className="text-slate-500 text-sm">OU</span>
                    <div className="flex-1 h-px bg-slate-700" />
                  </div>

                  {/* PIX Copia e Cola */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-cyan-500/20 rounded flex items-center justify-center text-cyan-400 font-bold text-sm">
                        2
                      </div>
                      <h3 className="text-white font-semibold">Copia e Cola</h3>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-slate-800 rounded-lg p-4 border border-slate-700 overflow-hidden">
                        <p className="text-slate-300 text-sm break-all font-mono text-xs">
                          {pixData.copyPaste}
                        </p>
                      </div>
                      <Button
                        onClick={handleCopyPaste}
                        className={`flex-shrink-0 transition-all ${
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
                      Copie o código e cole no seu app bancário para pagar
                    </p>
                  </div>

                  {/* Confirm Payment */}
                  <div className="pt-4 border-t border-slate-700 space-y-4">
                    <Button
                      onClick={handlePaymentConfirmed}
                      disabled={paymentConfirmed}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-6 text-lg"
                    >
                      {paymentConfirmed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Pagamento Confirmado
                        </>
                      ) : (
                        "Já Paguei via PIX"
                      )}
                    </Button>
                    <p className="text-xs text-slate-400 text-center">
                      Clique no botão acima após realizar o pagamento para confirmar e receber seus créditos
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-12 text-center">
                  <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">Erro ao gerar código PIX</p>
                  <Button
                    onClick={() => createTransactionMutation.mutate({ planId: selectedPlan.id })}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Tentar Novamente
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Info Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-blue-900/20 border-blue-800/50">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <Zap className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-300 font-semibold text-sm">Instantâneo</p>
                      <p className="text-blue-200 text-xs mt-1">PIX é processado em segundos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-900/20 border-purple-800/50">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-purple-300 font-semibold text-sm">Seguro</p>
                      <p className="text-purple-200 text-xs mt-1">Transações criptografadas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Help Section */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  Precisa de Ajuda?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-400 space-y-2 text-sm">
                <p>• Se o pagamento não for confirmado em 5 minutos, tente novamente</p>
                <p>• Certifique-se de usar a chave PIX correta do seu banco</p>
                <p>• Entre em contato com nosso suporte se tiver dúvidas</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">Plano não encontrado</p>
              <Button
                onClick={() => setLocation("/plans")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Voltar aos Planos
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
