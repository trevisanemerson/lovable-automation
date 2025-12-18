import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, LogOut, Zap, History, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [inviteLink, setInviteLink] = useState("");
  const [quantity, setQuantity] = useState(1);

  const { data: balance, isLoading: balanceLoading } = trpc.credits.getBalance.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: tasks, isLoading: tasksLoading } = trpc.tasks.list.useQuery(undefined, {
    enabled: !!user,
  });

  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("Tarefa criada com sucesso!");
      setInviteLink("");
      setQuantity(1);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar tarefa");
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      setLocation("/");
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteLink || quantity < 1) {
      toast.error("Preencha todos os campos corretamente");
      return;
    }
    await createTaskMutation.mutateAsync({ lovableInviteLink: inviteLink, quantityRequested: quantity });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-slate-950" />
            </div>
            <span className="text-white font-bold text-lg">Lovable Automation</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-300">{user.name || user.email}</span>
            <Button
              variant="ghost"
              onClick={() => logoutMutation.mutate()}
              className="text-slate-400 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Card */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 border-0">
            <CardContent className="pt-6">
              <div className="text-white">
                <p className="text-sm opacity-90 mb-2">Créditos Disponíveis</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    {balanceLoading ? "..." : balance?.availableCredits || 0}
                  </span>
                  <span className="text-lg opacity-90">créditos</span>
                </div>
                <p className="text-sm opacity-75 mt-2">
                  Total: {balanceLoading ? "..." : balance?.totalCredits || 0} | Usados: {balanceLoading ? "..." : balance?.usedCredits || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="create" className="text-slate-400 data-[state=active]:text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nova Tarefa
            </TabsTrigger>
            <TabsTrigger value="history" className="text-slate-400 data-[state=active]:text-white">
              <History className="w-4 h-4 mr-2" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Create Task Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Criar Nova Tarefa</CardTitle>
                <CardDescription className="text-slate-400">
                  Submeta um link de convite do Lovable e a quantidade de contas desejadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inviteLink" className="text-slate-300">
                      Link de Convite do Lovable
                    </Label>
                    <Input
                      id="inviteLink"
                      type="url"
                      placeholder="https://lovable.dev/invite/..."
                      value={inviteLink}
                      onChange={(e) => setInviteLink(e.target.value)}
                      disabled={createTaskMutation.isPending}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-slate-300">
                      Quantidade de Contas
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max="1000"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      disabled={createTaskMutation.isPending}
                      className="bg-slate-800 border-slate-700 text-white"
                      required
                    />
                    <p className="text-sm text-slate-400">
                      Custo: {quantity} crédito(s)
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={createTaskMutation.isPending || !balance || balance.availableCredits < quantity}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                  >
                    {createTaskMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {createTaskMutation.isPending ? "Criando..." : "Criar Tarefa"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            {tasksLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
              </div>
            ) : tasks && tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <Card key={task.id} className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white text-lg">
                            Tarefa #{task.id}
                          </CardTitle>
                          <CardDescription className="text-slate-400">
                            {new Date(task.createdAt).toLocaleDateString("pt-BR")}
                          </CardDescription>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          task.status === "completed" ? "bg-green-900/30 text-green-400" :
                          task.status === "processing" ? "bg-blue-900/30 text-blue-400" :
                          task.status === "failed" ? "bg-red-900/30 text-red-400" :
                          "bg-slate-700 text-slate-300"
                        }`}>
                          {task.status === "completed" ? "Concluída" :
                           task.status === "processing" ? "Processando" :
                           task.status === "failed" ? "Falhou" :
                           "Pendente"}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Solicitadas</p>
                          <p className="text-white font-semibold">{task.quantityRequested}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Criadas</p>
                          <p className="text-white font-semibold">{task.quantityCompleted}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Créditos Usados</p>
                          <p className="text-white font-semibold">{task.creditsUsed}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Status</p>
                          <p className="text-white font-semibold capitalize">{task.status}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-400">Nenhuma tarefa criada ainda</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
