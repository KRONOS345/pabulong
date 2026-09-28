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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            Second Brain Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Synthesized operational intelligence, boarding house guidelines, and student preferences.
          </p>
        </div>

        {/* Create Note Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger 
            render={
              <Button className="gap-2" />
            }
          >
            <Plus className="h-4 w-4" />
            Capture Knowledge
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Capture New Brain Note
              </DialogTitle>
              <DialogDescription>
                Stores notes to Supabase pgvector with semantic search indexing.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateNote} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="note-title">Note Title</Label>
                <Input
                  id="note-title"
                  placeholder="e.g. Standard Tenancy Agreement Checklist"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="note-content">Knowledge Content</Label>
                <Textarea
                  id="note-content"
                  placeholder="Enter detailed observation, policy, or boarding house audit notes..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="note-tags">Tags (comma separated)</Label>
                <Input
                  id="note-tags"
                  placeholder="e.g. dorms, policy, pricing"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Embedding..." : "Save Note"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Semantic Query Bar */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Mode Toggle Button */}
            <div className="flex items-center gap-2">
              <Button
                variant={isAiSearchMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsAiSearchMode(!isAiSearchMode)}
                className="gap-2 text-xs font-medium"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isAiSearchMode ? "AI Vector Mode Active" : "Enable AI Vector Search"}
              </Button>
              {isAiSearchMode && (
                <Badge variant="secondary" className="text-[10px]">
                  pgvector (1536-dim)
                </Badge>
              )}
            </div>

            {/* Quick Suggestion Chips */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="text-[11px]">Quick Prompt:</span>
              <button
                onClick={() => {
                  setIsAiSearchMode(true);
                  setVectorQuery("affordable dorm with wifi");
                }}
                className="text-[11px] bg-muted hover:bg-muted/80 text-foreground px-2 py-0.5 rounded transition-all"
              >
                &ldquo;dorm with wifi&rdquo;
              </button>
              <button
                onClick={() => {
                  setIsAiSearchMode(true);
                  setVectorQuery("curfew and security standards");
                }}
                className="text-[11px] bg-muted hover:bg-muted/80 text-foreground px-2 py-0.5 rounded transition-all"
              >
                &ldquo;curfew protocols&rdquo;
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Keyword Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by title or content keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            {/* Vector Semantic Search */}
            <div className="relative">
              <Sparkles className="absolute left-3 top-2.5 h-4 w-4 text-primary animate-pulse" />
              <Input
                placeholder="Semantic vector query (e.g. 'late night study with backup power')..."
                value={vectorQuery}
                onChange={(e) => {
                  setVectorQuery(e.target.value);
                  if (e.target.value) setIsAiSearchMode(true);
                }}
                className="pl-9 border-primary/30 text-sm"
              />
            </div>
          </div>

          {/* Tag Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Tag className="h-3 w-3" /> Filter:
            </span>
            <Button
              variant={selectedTag === null ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedTag(null)}
              className="h-7 text-xs rounded-full px-2.5"
            >
              All Notes ({notes.length})
            </Button>
            {allTags.map((tag) => (
              <Button
                key={tag}
                variant={selectedTag === tag ? "default" : "secondary"}
                size="sm"
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className="h-7 text-xs rounded-full px-2.5"
              >
                #{tag}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes Grid */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary animate-spin" />
          <span>Searching vector embeddings...</span>
        </div>
      ) : notes.length === 0 ? (
        <Card className="p-12 text-center bg-muted/30">
          <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-base font-medium">No notes match your query</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting search terms or capture a new note using the button above.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {notes.map((note) => (
            <Card
              key={note.id}
              className="flex flex-col justify-between group transition-all hover:border-primary/50"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base leading-snug font-semibold">
                    {note.title}
                  </CardTitle>
                  {note.similarity !== undefined && (
                    <Badge
                      variant="secondary"
                      className="shrink-0 flex items-center gap-1 font-mono font-medium"
                    >
                      <Zap className="h-3 w-3 text-primary" />
                      {Math.round(note.similarity * 100)}% Match
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs flex items-center gap-2 pt-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(note.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed font-normal whitespace-pre-wrap">
                  {note.content}
                </p>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex flex-wrap gap-1.5">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(note.id, note.content)}
                    className="h-7 text-xs"
                  >
                    {copiedId === note.id ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mr-1" />
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
