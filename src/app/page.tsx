import Link from "next/link";
import {
  Brain,
  Kanban,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col justify-between selection:bg-indigo-500/30">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                PABULONG
              </span>
              <span className="text-[10px] block font-mono uppercase tracking-widest text-indigo-400 -mt-1">
                Intelligence & Placement
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" className="border-slate-800 hover:bg-slate-800/60">
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/placements">
              <Button variant="gradient" className="gap-2 shadow-indigo-500/20">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 px-6">
        <div className="container mx-auto max-w-5xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
            Unified Second Brain & Student Housing Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Synthesize Knowledge.{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Automate Boarding Placements.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed">
            The next-generation command center uniting AI vector-indexed note-taking with a high-velocity Kanban placement pipeline for student housing and dormitories.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/dashboard/notes">
              <Button size="lg" variant="gradient" className="gap-2 shadow-lg shadow-indigo-500/25">
                <Brain className="h-5 w-5" />
                Launch Second Brain
              </Button>
            </Link>
            <Link href="/dashboard/placements">
              <Button size="lg" variant="outline" className="gap-2 border-slate-800 bg-slate-900/60 hover:bg-slate-800">
                <Kanban className="h-5 w-5 text-indigo-400" />
                Open Placement Kanban
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="container mx-auto max-w-6xl mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-800/80 bg-slate-900/40 backdrop-blur-md hover:border-indigo-500/50 transition-all">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-2">
                <Search className="h-5 w-5 text-indigo-400" />
              </div>
              <CardTitle className="text-lg text-white">Semantic Second Brain</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-400">
              Capture research, housing notes, and university resources with pgvector embeddings, tag filtering, and instant similarity recall.
            </CardContent>
          </Card>

          <Card className="border-slate-800/80 bg-slate-900/40 backdrop-blur-md hover:border-purple-500/50 transition-all">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-2">
                <Kanban className="h-5 w-5 text-purple-400" />
              </div>
              <CardTitle className="text-lg text-white">Placement Kanban Center</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-400">
              Orchestrate client inquiries across 4 pipeline stages: Inquiry, Viewing, Deposit Pending, and Placed with real-time room matching.
            </CardContent>
          </Card>

          <Card className="border-slate-800/80 bg-slate-900/40 backdrop-blur-md hover:border-pink-500/50 transition-all">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-2">
                <ShieldCheck className="h-5 w-5 text-pink-400" />
              </div>
              <CardTitle className="text-lg text-white">Zero-Trust Security</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-400">
              Built on Clerk user session tokens and Supabase Row Level Security (RLS) guaranteeing tenant isolation down to the SQL row.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 px-6 text-center text-xs text-slate-500">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Pabulong Platform. Built with Next.js, Clerk, Supabase, PostGIS & pgvector.</p>
          <div className="flex gap-4">
            <span className="text-indigo-400">Production Ready</span>
            <span>•</span>
            <span className="text-emerald-400">RLS Secured</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
