import Link from "next/link";
import { Brain, Kanban, ShieldCheck, MapIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-md bg-primary/10 p-1">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-lg tracking-tight">Pabulong</span>
          </div>

          <nav className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <Link href="/dashboard/placements">
              <Button size="sm" className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-24 md:py-32 flex flex-col items-center text-center space-y-8">
          <Badge variant="secondary" className="px-3 py-1 text-sm rounded-full">
            Unified Second Brain & Student Housing Platform
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl">
            Synthesize Knowledge.<br />
            Automate Boarding Placements.
          </h1>
          
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl">
            The command center uniting AI vector-indexed note-taking with a high-velocity Kanban placement pipeline for student housing and dormitories.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/dashboard/notes">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                <Brain className="h-5 w-5" />
                Launch Second Brain
              </Button>
            </Link>
            <Link href="/dashboard/placements">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                <Kanban className="h-5 w-5" />
                Open Kanban
              </Button>
            </Link>
          </div>
        </section>

        <Separator />

        {/* Features Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Core Capabilities</h2>
            <p className="text-muted-foreground mt-4 text-lg">Integrated intelligence and spatial workflows.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <div className="mb-2 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Semantic Second Brain</CardTitle>
                <CardDescription>
                  Capture research and notes with pgvector embeddings, tag filtering, and instant similarity recall.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Kanban className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Placement Pipeline</CardTitle>
                <CardDescription>
                  Orchestrate inquiries across 4 pipeline stages with real-time budget and room matching.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapIcon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>PostGIS Spatial Radius</CardTitle>
                <CardDescription>
                  Calculate exact walking and transit distance from university campus gates using geographic geometries.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Zero-Trust Fabric</CardTitle>
                <CardDescription>
                  Cryptographic JWT claims and Supabase RLS enforce tenant isolation directly at the database layer.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground gap-4">
          <p>© 2026 Pabulong Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <ShieldCheck className="h-4 w-4" /> Production Ready
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
