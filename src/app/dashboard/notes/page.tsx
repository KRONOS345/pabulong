"use client";

import * as React from "react";
import {
  Brain,
  Search,
  Sparkles,
  Plus,
  Tag,
  Calendar,
  CheckCircle2,
  Copy,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fetchNotes, createNoteAction, type NoteItem } from "@/actions/notes";
import { searchNotesSemantic } from "@/actions/ai-search";

export default function NotesPage() {
  const [notes, setNotes] = React.useState<NoteItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
  const [vectorQuery, setVectorQuery] = React.useState("");
  const [isAiSearchMode, setIsAiSearchMode] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // New Note Form State
  const [newTitle, setNewTitle] = React.useState("");
  const [newContent, setNewContent] = React.useState("");
  const [newTags, setNewTags] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let ignore = false;

    if (isAiSearchMode && vectorQuery.trim()) {
      searchNotesSemantic(vectorQuery).then((results) => {
        if (!ignore) {
          let filtered = results;
          if (selectedTag) {
            filtered = filtered.filter((n) => n.tags.includes(selectedTag));
          }
          setNotes(filtered);
          setLoading(false);
        }
      });
    } else {
      fetchNotes({
        search: search || undefined,
        tag: selectedTag || undefined,
        vectorQuery: vectorQuery || undefined,
      }).then((data) => {
        if (!ignore) {
          setNotes(data);
          setLoading(false);
        }
      });
    }

    return () => {
      ignore = true;
    };
  }, [search, selectedTag, vectorQuery, isAiSearchMode]);

  // Extract all distinct tags
  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [notes]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setSubmitting(true);
    const tagsArray = newTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const res = await createNoteAction({
      title: newTitle,
      content: newContent,
      tags: tagsArray.length > 0 ? tagsArray : ["general"],
    });

    if (res.success && res.note) {
      setNotes((prev) => [res.note!, ...prev]);
      setNewTitle("");
      setNewContent("");
      setNewTags("");
      setIsDialogOpen(false);
    }
    setSubmitting(false);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <Brain className="h-5 w-5 text-indigo-400" />
            </div>
            Second Brain Knowledge Base
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Synthesized operational intelligence, boarding house guidelines, and student preferences.
          </p>
        </div>

        {/* Create Note Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient" className="gap-2 shadow-indigo-500/20">
              <Plus className="h-4 w-4" />
              Capture Knowledge
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                Capture New Brain Note
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Stores notes to Supabase pgvector with semantic search indexing.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateNote} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Note Title</label>
                <Input
                  placeholder="e.g. Standard Tenancy Agreement Checklist"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="bg-slate-900/60 border-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Knowledge Content</label>
                <textarea
                  placeholder="Enter detailed observation, policy, or boarding house audit notes..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                  required
                  className="w-full rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Tags (comma separated)
                </label>
                <Input
                  placeholder="e.g. dorms, policy, pricing"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="bg-slate-900/60 border-slate-800"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="border-slate-800 text-slate-400"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" disabled={submitting}>
                  {submitting ? "Embedding..." : "Save Note"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Semantic Query Bar */}
      <Card className="border-slate-800/80 bg-slate-900/50 backdrop-blur-md">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Mode Toggle Button */}
            <div className="flex items-center gap-2">
              <Button
                variant={isAiSearchMode ? "gradient" : "outline"}
                size="sm"
                onClick={() => setIsAiSearchMode(!isAiSearchMode)}
                className="gap-2 text-xs font-medium"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isAiSearchMode ? "AI Vector Mode Active" : "Enable AI Vector Search"}
              </Button>
              {isAiSearchMode && (
                <Badge variant="outline" className="border-indigo-500/40 text-indigo-300 bg-indigo-500/10 text-[10px]">
                  pgvector (1536-dim)
                </Badge>
              )}
            </div>

            {/* Quick Suggestion Chips */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-[11px] text-slate-500">Quick Prompt:</span>
              <button
                onClick={() => {
                  setIsAiSearchMode(true);
                  setVectorQuery("affordable dorm with wifi");
                }}
                className="text-[11px] bg-slate-800/60 hover:bg-slate-800 text-indigo-300 px-2 py-0.5 rounded transition-all"
              >
                &ldquo;dorm with wifi&rdquo;
              </button>
              <button
                onClick={() => {
                  setIsAiSearchMode(true);
                  setVectorQuery("curfew and security standards");
                }}
                className="text-[11px] bg-slate-800/60 hover:bg-slate-800 text-indigo-300 px-2 py-0.5 rounded transition-all"
              >
                &ldquo;curfew protocols&rdquo;
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Keyword Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Filter by title or content keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-950/60 border-slate-800 text-sm"
              />
            </div>

            {/* Vector Semantic Search */}
            <div className="relative">
              <Sparkles className="absolute left-3 top-2.5 h-4 w-4 text-indigo-400 animate-pulse" />
              <Input
                placeholder="Semantic vector query (e.g. 'late night study with backup power')..."
                value={vectorQuery}
                onChange={(e) => {
                  setVectorQuery(e.target.value);
                  if (e.target.value) setIsAiSearchMode(true);
                }}
                className="pl-9 bg-slate-950/60 border-indigo-500/30 text-indigo-200 placeholder:text-indigo-400/40 text-sm"
              />
            </div>
          </div>

          {/* Tag Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Tag className="h-3 w-3" /> Filter:
            </span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                selectedTag === null
                  ? "bg-indigo-600 text-white font-medium shadow-sm"
                  : "bg-slate-800/60 text-slate-400 hover:text-white"
              }`}
            >
              All Notes ({notes.length})
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                  selectedTag === tag
                    ? "bg-indigo-600 text-white font-medium shadow-sm"
                    : "bg-slate-800/60 text-slate-400 hover:text-white"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
          <Sparkles className="h-6 w-6 text-indigo-400 animate-spin" />
          <span>Searching vector embeddings...</span>
        </div>
      ) : notes.length === 0 ? (
        <Card className="border-slate-800/80 bg-slate-900/30 p-12 text-center">
          <Brain className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-base text-slate-300 font-medium">No notes match your query</p>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting search terms or capture a new note using the button above.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {notes.map((note) => (
            <Card
              key={note.id}
              className="border-slate-800/80 bg-slate-900/40 backdrop-blur-md hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base text-white leading-snug font-semibold">
                    {note.title}
                  </CardTitle>
                  {note.similarity !== undefined && (
                    <Badge
                      variant="outline"
                      className="border-indigo-500/40 bg-indigo-500/10 text-indigo-300 text-[11px] shrink-0 flex items-center gap-1 font-mono font-medium"
                    >
                      <Zap className="h-3 w-3 text-indigo-400" />
                      {Math.round(note.similarity * 100)}% Match
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs text-slate-400 flex items-center gap-2 pt-1">
                  <Calendar className="h-3 w-3 text-slate-500" />
                  {new Date(note.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-slate-300 leading-relaxed font-normal whitespace-pre-wrap">
                  {note.content}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <div className="flex flex-wrap gap-1.5">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(note.id, note.content)}
                    className="h-7 text-xs text-slate-400 hover:text-white"
                  >
                    {copiedId === note.id ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mr-1" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 mr-1" />
                    )}
                    {copiedId === note.id ? "Copied" : "Copy"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
