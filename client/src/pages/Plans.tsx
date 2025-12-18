import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Plans() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: plans, isLoading } = trpc.credits.getPlans.useQuery();

  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleSelectPlan = (planId: number) => {
    setLocation(`/payment?plan=${planId}`);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Escolha seu Plano</h1>
          <p className="text-xl text-slate-400">
            Selecione o plano que melhor se adequa às suas necessidades
          </p>
        </div>

        {isLoading ? (
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
          </div>
        ) : plans && plans.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card 
                key={plan.id}
                className={`bg-slate-900/50 border transition-all flex flex-col ${
                  index === 1
                    ? "border-blue-500 ring-2 ring-blue-500/20 md:scale-105 md:row-span-2"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-white text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-400">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-6">
                    <div className="text-4xl font-bold text-white mb-2">
                      {plan.price}
                    </div>
                    <div className="text-slate-400">
                      {plan.credits} créditos
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 flex-1">
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-300">{plan.credits} contas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-300">Suporte por email</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-300">Histórico de tarefas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-300">Progresso em tempo real</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full ${
                      index === 1
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                        : "bg-slate-700 hover:bg-slate-600 text-white"
                    }`}
                  >
                    Escolher Plano
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-slate-400">Nenhum plano disponível</p>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Perguntas Frequentes</h2>
          <div className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">Como funciona o sistema de créditos?</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-400">
                <p>
                  Cada crédito permite criar uma conta no Lovable.dev. Você compra créditos de acordo com o plano escolhido e usa-os conforme necessário.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">Os créditos expiram?</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-400">
                <p>
                  Não, seus créditos não expiram. Você pode usá-los quando quiser, sem limite de tempo.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">Posso obter reembolso?</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-400">
                <p>
                  Sim, oferecemos reembolso de 30 dias para créditos não utilizados. Entre em contato com nosso suporte.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
