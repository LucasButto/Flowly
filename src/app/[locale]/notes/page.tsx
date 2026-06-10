"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useNotes } from "@/contexts/NotesContext";
import NoteCard from "@/components/notes/NoteCard/NoteCard";
import NoteEditor from "@/components/notes/NoteEditor/NoteEditor";
import Button from "@/components/ui/Button/Button";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog/ConfirmDialog";
import { NotesSkeleton } from "@/components/skeletons/Skeletons";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import StickyNote2RoundedIcon from "@mui/icons-material/StickyNote2Rounded";
import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import type { Note } from "@/types/note";
import "./notes.scss";

export default function NotesPage() {
  const t = useTranslations("notes");
  const tc = useTranslations("common");
  const { notes, loaded, removeNote } = useNotes();

  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.blocks.some((b) => b.text.toLowerCase().includes(q)),
    );
  }, [notes, search]);

  const pinned = filtered.filter((n) => n.pinned);
  const others = filtered.filter((n) => !n.pinned);

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (n: Note) => {
    setEditing(n);
    setEditorOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await removeNote(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  if (!loaded) return <NotesSkeleton />;

  return (
    <div className="page notes">
      <header className="page-header">
        <div>
          <h1 className="page-title">{t("title")}</h1>
          <p className="page-subtitle">{t("subtitle")}</p>
        </div>
        <Button icon={<AddRoundedIcon />} onClick={openNew}>
          {t("new")}
        </Button>
      </header>

      {notes.length === 0 ? (
        <EmptyState
          icon={<StickyNote2RoundedIcon />}
          title={t("empty")}
          description={t("emptyDesc")}
          action={
            <Button icon={<AddRoundedIcon />} onClick={openNew}>
              {t("createFirst")}
            </Button>
          }
        />
      ) : (
        <>
          <div className="notes__search">
            <SearchRoundedIcon />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tc("searchPlaceholder")}
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState title={t("noResults")} compact />
          ) : (
            <>
              {pinned.length > 0 && (
                <section className="notes__section">
                  <h2 className="notes__section-title">
                    <PushPinRoundedIcon /> {t("pinned")}
                  </h2>
                  <div className="notes__grid">
                    {pinned.map((n) => (
                      <NoteCard
                        key={n.id}
                        note={n}
                        onEdit={openEdit}
                        onDelete={setDeleteTarget}
                      />
                    ))}
                  </div>
                </section>
              )}

              {others.length > 0 && (
                <section className="notes__section">
                  {pinned.length > 0 && (
                    <h2 className="notes__section-title">{t("others")}</h2>
                  )}
                  <div className="notes__grid">
                    {others.map((n) => (
                      <NoteCard
                        key={n.id}
                        note={n}
                        onEdit={openEdit}
                        onDelete={setDeleteTarget}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}

      <NoteEditor
        open={editorOpen}
        note={editing}
        onClose={() => setEditorOpen(false)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={t("deleteTitle")}
        description={t("deleteDesc")}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
