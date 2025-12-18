import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Check, Loader2, Zap } from "lucide-react";
import { useState } from "react";

export default function Plans() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const { data: plans, isLoading } = trpc.credits.getPlans.useQuery();

  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleSelectPlan = (planId: number) => {
    setSelectedPlanId(planId);
    // Navigate to payment after a brief delay for visual feedback
    setTimeout(() => {
      setLocation(`/payment?plan=${planId}`);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/dashboard")}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-400" />
            <span className="text-white font-semibold">Lovable Automation</span>
          </div>
          <div className="w-20" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Title Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">Escolha seu Plano</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Selecione o plano que melhor se adequa às suas necessidades e comece a automatizar a criação de contas no Lovable
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : plans && plans.length > 0 ? (
          <>
            {/* Plans Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {plans.map((plan, index) => {
                const isPopular = index === 1;
                const isSelected = selectedPlanId === plan.id;

                return (
                  <Card
                    key={plan.id}
                    className={`relative bg-slate-900/50 border transition-all duration-300 flex flex-col overflow-hidden ${
                      isPopular
                        ? "border-blue-500 ring-2 ring-blue-500/20 md:scale-105 shadow-2xl"
                        : "border-slate-800 hover:border-slate-700"
                    } ${
                      isSelected ? "ring-2 ring-green-500" : ""
                    }`}
                  >
                    {/* Popular Badge */}
                    {isPopular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                        MAIS POPULAR
                      </div>
                    )}

                    <CardHeader className="pb-4">
                      <CardTitle className="text-white text-2xl">{plan.name}</CardTitle>
                      <CardDescription className="text-slate-400">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col">
                      {/* Price Section */}
                      <div className="mb-8 pb-8 border-b border-slate-700">
                        <div className="text-5xl font-bold text-white mb-2">
                          {plan.price}
                        </div>
                        <div className="text-slate-400 text-lg">
                          {plan.credits} créditos
                        </div>
                        <div className="text-sm text-slate-500 mt-2">
                          {(parseFloat(plan.price.replace("R$", "").replace(",", ".")) / plan.credits).toFixed(2)} por crédito
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-4 mb-8 flex-1">
                        <div className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-slate-300 font-medium">Criar Contas</p>
                            <p className="text-sm text-slate-500">Até {plan.credits} contas no Lovable</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-slate-300 font-medium">Suporte</p>
                            <p className="text-sm text-slate-500">Suporte por email 24/7</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-slate-300 font-medium">Histórico</p>
                            <p className="text-sm text-slate-500">Rastreamento completo de tarefas</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-slate-300 font-medium">Progresso</p>
                            <p className="text-sm text-slate-500">Atualizações em tempo real</p>
                          </div>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <Button
                        onClick={() => handleSelectPlan(plan.id)}
                        disabled={selectedPlanId === plan.id}
                        className={`w-full transition-all ${
                          isPopular
                            ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold"
                            : "bg-slate-700 hover:bg-slate-600 text-white"
                        } ${
                          isSelected ? "ring-2 ring-green-500" : ""
                        }`}
                      >
                        {selectedPlanId === plan.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          "Escolher Plano"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Benefits Section */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-8 mb-16">
              <h2 className="text-2xl font-bold text-white mb-6">Por que escolher Lovable Automation?</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Rápido e Eficiente</h3>
                    <p className="text-slate-400 text-sm">Crie múltiplas contas automaticamente em minutos</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Confiável</h3>
                    <p className="text-slate-400 text-sm">Taxa de sucesso de 99% na criação de contas</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Sem Limite</h3>
                    <p className="text-slate-400 text-sm">Use seus créditos quando quiser, sem expiração</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-8 text-center">Perguntas Frequentes</h2>
              <div className="space-y-4">
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Como funciona o sistema de créditos?</CardTitle>
                  </CardHeader>
                  <CardContent className="text-slate-400">
                    <p>
                      Cada crédito permite criar uma conta no Lovable.dev. Você compra créditos de acordo com o plano escolhido e usa-os conforme necessário. Os créditos não expiram e podem ser usados a qualquer momento.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Qual é o tempo de processamento?</CardTitle>
                  </CardHeader>
                  <CardContent className="text-slate-400">
                    <p>
                      O processamento é automático e geralmente leva alguns minutos por conta. Você pode acompanhar o progresso em tempo real no seu dashboard.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Posso obter reembolso?</CardTitle>
                  </CardHeader>
                  <CardContent className="text-slate-400">
                    <p>
                      Sim, oferecemos reembolso de 30 dias para créditos não utilizados. Entre em contato com nosso suporte para solicitar.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Preciso de um link de convite do Lovable?</CardTitle>
                  </CardHeader>
                  <CardContent className="text-slate-400">
                    <p>
                      Sim, você precisa fornecer um link de convite válido do Lovable.dev para que possamos criar as contas. Você pode obter esse link na sua conta do Lovable.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">Nenhum plano disponível no momento</p>
          </div>
        )}
      </div>
    </div>
  );
}
