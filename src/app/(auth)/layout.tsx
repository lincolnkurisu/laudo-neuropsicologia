import { BrainCircuit } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br
                    from-slate-900 via-indigo-950 to-slate-900 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl
                          bg-gradient-to-br from-indigo-500 to-violet-600
                          shadow-xl shadow-indigo-900/60">
            <BrainCircuit className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">NeuroPsi</h1>
            <p className="text-sm text-slate-400">Avaliação Neuropsicológica</p>
          </div>
        </div>

        {/* Conteúdo */}
        {children}
      </div>
    </div>
  );
}
