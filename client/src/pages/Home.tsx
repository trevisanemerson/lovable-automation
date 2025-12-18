import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap, BarChart3, Lock, Rocket } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-slate-950" />
            </div>
            <span className="text-white font-bold text-lg">Lovable Automation</span>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setLocation("/login")}
              className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              Login
            </Button>
            <Button 
              onClick={() => setLocation("/register")}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
            >
              Começar Grátis
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Automatize a Criação de Contas no{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Lovable
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            Crie múltiplas contas e projetos no Lovable.dev de forma automatizada. Pague com PIX e acompanhe o progresso em tempo real.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => setLocation("/register")}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8"
            >
              Começar Agora <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 px-8"
            >
              Saiba Mais
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
            <CardHeader>
              <Zap className="w-6 h-6 text-blue-400 mb-2" />
              <CardTitle className="text-white">Automatização Completa</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Crie contas e projetos automaticamente usando nosso sistema inteligente.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
            <CardHeader>
              <BarChart3 className="w-6 h-6 text-cyan-400 mb-2" />
              <CardTitle className="text-white">Progresso em Tempo Real</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Acompanhe cada criação de conta com atualizações em tempo real.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
            <CardHeader>
              <Lock className="w-6 h-6 text-green-400 mb-2" />
              <CardTitle className="text-white">Seguro e Confiável</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Seus dados são protegidos com criptografia de ponta a ponta.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
            <CardHeader>
              <Rocket className="w-6 h-6 text-purple-400 mb-2" />
              <CardTitle className="text-white">Créditos Flexíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Escolha o plano que melhor se adequa às suas necessidades.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Section */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Planos Simples e Transparentes
          </h2>
          <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
            Escolha o plano que melhor se adequa às suas necessidades. Sem contratos, sem surpresas.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Iniciante", credits: 10, price: "R$ 29,90", description: "Perfeito para começar" },
              { name: "Profissional", credits: 50, price: "R$ 129,90", description: "Mais popular", popular: true },
              { name: "Empresarial", credits: 500, price: "R$ 999,90", description: "Para grandes volumes" },
            ].map((plan) => (
              <Card 
                key={plan.name}
                className={`bg-slate-900/50 border transition-all ${
                  plan.popular 
                    ? "border-blue-500 ring-2 ring-blue-500/20 md:scale-105" 
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-400">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold text-white">{plan.price}</p>
                    <p className="text-slate-400">{plan.credits} créditos</p>
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                    onClick={() => setLocation("/register")}
                  >
                    Escolher Plano
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para começar?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Crie sua conta agora e comece a automatizar a criação de contas no Lovable.
          </p>
          <Button 
            size="lg"
            className="bg-white text-blue-600 hover:bg-slate-100 px-8"
            onClick={() => setLocation("/register")}
          >
            Criar Conta Grátis <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
          <p>&copy; 2025 Lovable Automation. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
