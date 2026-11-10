"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ClipboardPaste,
  Columns3,
  Plus,
  Rows3,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { publishAction, saveDraftAction } from "@/lib/coa/actions";
import { baseTemplate, emptyTable, newTableId } from "@/lib/pdf/coa-defaults";
import {
  coaSchema,
  describeIssues,
  type CoaDoc,
  type CoaLine,
  type CoaTable,
} from "@/lib/pdf/coa-schema";
import { parseGrid, pasteWarnings } from "@/lib/pdf/paste";
import { useConfirm } from "@/components/admin/confirm";
import { FormAlert } from "@/components/admin/form-bits";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  documentId: string;
  lotLabel: string;
  publicUrl: string;
  initial: CoaDoc;
  nextVersion: number;
  intro: string | null;
};

// ─── Piezas chicas ───────────────────────────────────────────────────────────

function Card({
  title,
  aside,
  children,
}: {
  title: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-card-lg border border-line bg-surface p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-h3-sm font-semibold text-brand-ink">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-tint disabled:pointer-events-none disabled:opacity-30",
        danger ? "hover:text-destructive" : "hover:text-brand-ink",
      )}
    >
      {children}
    </button>
  );
}

const cellInput = "min-h-9 px-2 text-sm";

// ─── Líneas (encabezado y pie) ───────────────────────────────────────────────

function LinesEditor({
  name,
  lines,
  onChange,
  onRemove,
  addLabel,
}: {
  name: string;
  lines: CoaLine[];
  onChange: (lines: CoaLine[]) => void;
  onRemove: (index: number) => void;
  addLabel: string;
}) {
  const update = (i: number, patch: Partial<CoaLine>) =>
    onChange(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...lines];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      {lines.length > 0 && (
        <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] gap-2 font-ui text-caption tracking-[0.08em] text-ink-muted uppercase sm:grid">
          <span>Etiqueta</span>
          <span>Valor</span>
          <span className="w-[108px]" />
        </div>
      )}
      {lines.map((line, i) => (
        <div
          key={i}
          className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto]"
        >
          <Input
            aria-label={`${name}: etiqueta de la línea ${i + 1}`}
            value={line.label}
            onChange={(e) => update(i, { label: e.target.value })}
            className="font-medium"
            placeholder="Etiqueta"
          />
          <Input
            aria-label={`${name}: valor de la línea ${i + 1}`}
            value={line.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder="Valor"
          />
          <div className="flex">
            <IconButton label="Subir línea" onClick={() => move(i, -1)} disabled={i === 0}>
              <ArrowUp className="size-4" aria-hidden="true" />
            </IconButton>
            <IconButton
              label="Bajar línea"
              onClick={() => move(i, 1)}
              disabled={i === lines.length - 1}
            >
              <ArrowDown className="size-4" aria-hidden="true" />
            </IconButton>
            <IconButton label="Quitar línea" danger onClick={() => onRemove(i)}>
              <X className="size-4" aria-hidden="true" />
            </IconButton>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        icon={Plus}
        className="self-start"
        onClick={() => onChange([...lines, { label: "", value: "" }])}
      >
        {addLabel}
      </Button>
    </div>
  );
}

// ─── Tabla ───────────────────────────────────────────────────────────────────

function TableEditor({
  table,
  index,
  total,
  onChange,
  onMove,
  onRemove,
  onRemoveRow,
  onRemoveColumn,
  onNotify,
}: {
  table: CoaTable;
  index: number;
  total: number;
  onChange: (table: CoaTable) => void;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
  onRemoveRow: (row: number) => void;
  onRemoveColumn: (column: number) => void;
  onNotify: (text: string) => void;
}) {
  const [pasteOpen, setPasteOpen] = React.useState(false);
  const [pasteText, setPasteText] = React.useState("");
  const [firstRowIsHeader, setFirstRowIsHeader] = React.useState(true);
  const [warnings, setWarnings] = React.useState<string[]>([]);
  const cols = table.columns.length;
  const tableNo = index + 1;

  const setCell = (r: number, c: number, value: string) =>
    onChange({
      ...table,
      rows: table.rows.map((row, i) =>
        i === r ? row.map((cell, j) => (j === c ? value : cell)) : row,
      ),
    });
  const setColumn = (c: number, value: string) =>
    onChange({ ...table, columns: table.columns.map((col, j) => (j === c ? value : col)) });
  const addColumn = () =>
    onChange({
      ...table,
      columns: [...table.columns, ""],
      rows: table.rows.map((r) => [...r, ""]),
    });
  const addRow = () =>
    onChange({ ...table, rows: [...table.rows, Array.from({ length: cols }, () => "")] });

  const applyPaste = (mode: "replace" | "append") => {
    const grid = parseGrid(pasteText);
    setWarnings(pasteWarnings(grid));
    if (grid.length === 0) {
      setWarnings(["No se encontró ninguna fila."]);
      return;
    }
    let columns = table.columns;
    let body = grid;
    if (mode === "replace" && firstRowIsHeader) {
      columns = grid[0];
      body = grid.slice(1);
    }
    if (mode === "replace") {
      const width = Math.max(columns.length, ...body.map((r) => r.length));
      const pad = (r: string[]) => [...r, ...Array.from({ length: width - r.length }, () => "")];
      onChange({ ...table, columns: pad(columns), rows: body.map(pad) });
    } else {
      const fit = (r: string[]) =>
        Array.from({ length: cols }, (_, j) =>
          j === cols - 1 && r.length > cols ? r.slice(j).join(" ") : (r[j] ?? ""),
        );
      onChange({ ...table, rows: [...table.rows, ...body.map(fit)] });
    }
    setPasteText("");
    if (pasteWarnings(grid).length === 0) setPasteOpen(false);
    onNotify(
      `Tabla ${tableNo}: ${body.length} ${body.length === 1 ? "fila cargada" : "filas cargadas"} desde la planilla.`,
    );
  };

  return (
    <Card
      title={`Tabla ${tableNo}`}
      aside={
        <div className="flex items-center">
          <IconButton label="Subir tabla" onClick={() => onMove(-1)} disabled={index === 0}>
            <ArrowUp className="size-4" aria-hidden="true" />
          </IconButton>
          <IconButton label="Bajar tabla" onClick={() => onMove(1)} disabled={index === total - 1}>
            <ArrowDown className="size-4" aria-hidden="true" />
          </IconButton>
          <IconButton label="Quitar tabla" danger onClick={onRemove}>
            <Trash2 className="size-4" aria-hidden="true" />
          </IconButton>
        </div>
      }
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${table.id}-title`}>Título de la tabla</Label>
        <Input
          id={`${table.id}-title`}
          value={table.title}
          onChange={(e) => onChange({ ...table, title: e.target.value })}
          placeholder="Ej. Cannabinoid Overview · POT-INST-005: Potency - Mar 19, 2026 14:37 PDT"
        />
        <p className="text-xs font-normal text-ink-muted">
          Si termina en “: Pass” o “: Fail”, esa palabra sale en color. Si la dejás vacía, no se
          muestra.
        </p>
      </div>

      <div className="-mx-5 overflow-x-auto md:-mx-6">
        <table className="w-full text-left text-sm" style={{ minWidth: 140 * cols + 120 }}>
          <caption className="sr-only">Tabla {tableNo}</caption>
          <thead className="border-y border-line bg-surface-muted">
            <tr>
              {table.columns.map((col, c) => (
                <th
                  key={c}
                  scope="col"
                  className={cn("py-2 pr-1 font-normal", c === 0 ? "pl-5 md:pl-6" : "pl-1")}
                >
                  <div className="flex items-center gap-1">
                    <Input
                      aria-label={`Tabla ${tableNo}: título de la columna ${c + 1}`}
                      value={col}
                      onChange={(e) => setColumn(c, e.target.value)}
                      placeholder={`Columna ${c + 1}`}
                      className={cn(
                        cellInput,
                        "bg-surface font-ui text-xs font-bold tracking-[0.04em]",
                      )}
                    />
                    {cols > 1 && (
                      <IconButton
                        label={`Quitar columna ${c + 1}`}
                        danger
                        onClick={() => onRemoveColumn(c)}
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </IconButton>
                    )}
                  </div>
                </th>
              ))}
              <th scope="col" className="w-12 py-2 pr-5 pl-1 md:pr-6">
                <IconButton label="Agregar columna" onClick={addColumn} disabled={cols >= 12}>
                  <Columns3 className="size-4" aria-hidden="true" />
                </IconButton>
              </th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, r) => (
              <tr key={r} className="border-b border-line">
                {row.map((cell, c) => (
                  <td key={c} className={cn("py-1 pr-1", c === 0 ? "pl-5 md:pl-6" : "pl-1")}>
                    <Input
                      aria-label={`Tabla ${tableNo}, fila ${r + 1}, ${table.columns[c] || `columna ${c + 1}`}`}
                      value={cell}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      className={cn(cellInput, c === 0 && "font-medium")}
                    />
                  </td>
                ))}
                <td className="py-1 pr-5 pl-1 md:pr-6">
                  <IconButton label={`Quitar fila ${r + 1}`} danger onClick={() => onRemoveRow(r)}>
                    <X className="size-4" aria-hidden="true" />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs font-normal text-ink-muted">
        {table.columns.some((c) => c.trim())
          ? "Con títulos de columna: sale como grilla (título arriba, encabezado que se repite en cada página)."
          : "Sin títulos de columna: sale como caja (título adentro, todo en negrita), como Overview y Batch Result."}{" "}
        Pass, Fail y N/A en una celda se colorean solos.
      </p>

      {pasteOpen && (
        <div className="flex flex-col gap-3 rounded-card border border-line-strong bg-surface-muted p-4">
          <Label htmlFor={`${table.id}-paste`}>
            Pegá el rango copiado de Excel o Google Sheets
          </Label>
          <Textarea
            id={`${table.id}-paste`}
            rows={6}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            className="font-mono text-xs"
            spellCheck={false}
          />
          <Label className="flex items-center gap-3 font-body text-body-sm font-normal">
            <Checkbox
              checked={firstRowIsHeader}
              onCheckedChange={(v) => setFirstRowIsHeader(v === true)}
              aria-labelledby={`${table.id}-header-label`}
            />
            <span id={`${table.id}-header-label`}>La primera fila son los títulos de columna</span>
          </Label>
          {warnings.length > 0 && (
            <ul className="flex list-disc flex-col gap-1 pl-5 text-xs text-destructive">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="solid"
              icon={null}
              disabled={!pasteText.trim()}
              onClick={() => applyPaste("replace")}
            >
              Reemplazar la tabla
            </Button>
            <Button
              type="button"
              variant="outline"
              icon={null}
              disabled={!pasteText.trim()}
              onClick={() => applyPaste("append")}
            >
              Agregar como filas
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" icon={Rows3} onClick={addRow}>
          Agregar fila
        </Button>
        <Button
          type="button"
          variant="ghost"
          icon={ClipboardPaste}
          onClick={() => setPasteOpen((o) => !o)}
          aria-expanded={pasteOpen}
        >
          Pegar desde Excel
        </Button>
      </div>
    </Card>
  );
}

// ─── Vista previa ────────────────────────────────────────────────────────────

type PreviewState =
  | { status: "idle" | "loading" }
  | { status: "ready"; url: string }
  | { status: "invalid"; issues: string[] }
  | { status: "error" };

function usePreview(documentId: string, doc: CoaDoc) {
  const [state, setState] = React.useState<PreviewState>({ status: "idle" });
  const urlRef = React.useRef<string | null>(null);
  const key = JSON.stringify(doc);

  React.useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState((s) => (s.status === "ready" ? s : { status: "loading" }));
      try {
        const res = await fetch(`/admin/lotes/${documentId}/coa/preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: key,
          signal: controller.signal,
        });
        if (res.status === 422) {
          setState({
            status: "invalid",
            issues: ((await res.json()) as { issues: string[] }).issues,
          });
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        const url = URL.createObjectURL(await res.blob());
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = url;
        setState({ status: "ready", url });
      } catch (error) {
        if ((error as Error).name !== "AbortError") setState({ status: "error" });
      }
    }, 900);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [documentId, key]);

  React.useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );
  return state;
}

function PreviewPane({ state }: { state: PreviewState }) {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-h3-sm font-semibold text-brand-ink">Vista previa</h2>
        <span className="text-xs font-normal text-ink-muted" aria-live="polite">
          {state.status === "loading" && "Generando…"}
          {state.status === "ready" && "Igual al PDF que se publica"}
        </span>
      </div>
      <div className="relative min-h-[560px] flex-1 overflow-hidden rounded-card border border-line bg-surface-muted">
        {state.status === "ready" && (
          <iframe
            title="Vista previa del COA"
            src={`${state.url}#toolbar=0&navpanes=0&view=FitH`}
            className="absolute inset-0 h-full w-full"
          />
        )}
        {state.status === "invalid" && (
          <div className="flex flex-col gap-2 p-5 text-sm">
            <p className="font-medium text-brand-ink">Para ver la vista previa, corregí:</p>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-ink-muted">
              {state.issues.slice(0, 8).map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        )}
        {state.status === "error" && (
          <p className="p-5 text-sm text-destructive">No se pudo generar la vista previa.</p>
        )}
        {(state.status === "idle" || state.status === "loading") && (
          <p className="p-5 text-sm text-ink-muted">Generando vista previa…</p>
        )}
      </div>
    </div>
  );
}

// ─── Editor ──────────────────────────────────────────────────────────────────

export function CoaEditor({ documentId, lotLabel, publicUrl, initial, nextVersion, intro }: Props) {
  const [doc, setDoc] = React.useState<CoaDoc>(initial);
  const [savedJson, setSavedJson] = React.useState(() => JSON.stringify(initial));
  const [message, setMessage] = React.useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [issues, setIssues] = React.useState<string[]>([]);
  const [saving, startSaving] = React.useTransition();
  const [publishing, startPublishing] = React.useTransition();
  const preview = usePreview(documentId, doc);
  const dirty = JSON.stringify(doc) !== savedJson;
  const confirm = useConfirm();
  const toast = useToast();

  React.useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const patch = (p: Partial<CoaDoc>) => setDoc((d) => ({ ...d, ...p }));
  const setTable = (i: number, table: CoaTable) =>
    setDoc((d) => ({ ...d, tables: d.tables.map((t, j) => (j === i ? table : t)) }));
  const moveTable = (i: number, dir: -1 | 1) =>
    setDoc((d) => {
      const tables = [...d.tables];
      [tables[i], tables[i + dir]] = [tables[i + dir], tables[i]];
      return { ...d, tables };
    });
  // ─── Quitar (con "Deshacer") ───
  // Cada "Deshacer" reinserta lo quitado en el documento actual, sin pisar los
  // cambios hechos después.
  const withTable = (id: string, fn: (t: CoaTable) => CoaTable) =>
    setDoc((d) => ({ ...d, tables: d.tables.map((t) => (t.id === id ? fn(t) : t)) }));

  const removeTable = async (index: number) => {
    const table = doc.tables[index];
    const name = `la tabla ${index + 1}${table.title.trim() ? ` (“${table.title.trim()}”)` : ""}`;
    const ok = await confirm({
      title: `¿Quitar ${name}?`,
      description: `Tiene ${table.rows.length} ${table.rows.length === 1 ? "fila" : "filas"}. La podés recuperar con “Deshacer” en los próximos segundos.`,
      confirmLabel: "Quitar tabla",
      tone: "danger",
    });
    if (!ok) return;
    setDoc((d) => ({ ...d, tables: d.tables.filter((t) => t.id !== table.id) }));
    toast({
      message: `Quitaste ${name}.`,
      action: {
        label: "Deshacer",
        onClick: () =>
          setDoc((d) => {
            const tables = [...d.tables];
            tables.splice(Math.min(index, tables.length), 0, table);
            return { ...d, tables };
          }),
      },
    });
  };

  const removeRow = (tableId: string, tableNo: number, r: number) => {
    const row = doc.tables.find((t) => t.id === tableId)?.rows[r];
    if (!row) return;
    withTable(tableId, (t) => ({ ...t, rows: t.rows.filter((_, i) => i !== r) }));
    toast({
      message: `Quitaste la fila ${r + 1} de la tabla ${tableNo}${row[0] ? ` (${row[0]})` : ""}.`,
      action: {
        label: "Deshacer",
        onClick: () =>
          withTable(tableId, (t) => {
            const fitted = Array.from({ length: t.columns.length }, (_, j) => row[j] ?? "");
            const rows = [...t.rows];
            rows.splice(Math.min(r, rows.length), 0, fitted);
            return { ...t, rows };
          }),
      },
    });
  };

  const removeColumn = (tableId: string, tableNo: number, c: number) => {
    const table = doc.tables.find((t) => t.id === tableId);
    if (!table || table.columns.length <= 1) return;
    const title = table.columns[c];
    const cells = table.rows.map((r) => r[c] ?? "");
    withTable(tableId, (t) => ({
      ...t,
      columns: t.columns.filter((_, j) => j !== c),
      rows: t.rows.map((r) => r.filter((_, j) => j !== c)),
    }));
    toast({
      message: `Quitaste la columna ${c + 1} de la tabla ${tableNo}${title ? ` (${title})` : ""}.`,
      action: {
        label: "Deshacer",
        onClick: () =>
          withTable(tableId, (t) => {
            const at = Math.min(c, t.columns.length);
            const insert = <T,>(list: T[], item: T) => [
              ...list.slice(0, at),
              item,
              ...list.slice(at),
            ];
            return {
              ...t,
              columns: insert(t.columns, title),
              rows: t.rows.map((r, i) => insert(r, cells[i] ?? "")),
            };
          }),
      },
    });
  };

  const removeLine = (section: "header" | "footer", i: number) => {
    const line = doc[section][i];
    setDoc((d) => ({ ...d, [section]: d[section].filter((_, j) => j !== i) }));
    toast({
      message: `Quitaste la línea “${line.label || line.value || i + 1}” del ${section === "header" ? "encabezado" : "pie"}.`,
      action: {
        label: "Deshacer",
        onClick: () =>
          setDoc((d) => {
            const lines = [...d[section]];
            lines.splice(Math.min(i, lines.length), 0, line);
            return { ...d, [section]: lines };
          }),
      },
    });
  };

  const addTable = (kind: "empty" | "overview" | "batch" | "analytes") => {
    const preset = baseTemplate().tables.find((t) => t.id === kind);
    const table = preset ? { ...structuredClone(preset), id: newTableId() } : emptyTable(2, 2);
    setDoc((d) => ({ ...d, tables: [...d.tables, table] }));
  };

  const saveDraft = () =>
    startSaving(async () => {
      const result = await saveDraftAction(documentId, doc);
      if (result.ok) {
        setSavedJson(JSON.stringify(doc));
        const time = new Date(result.savedAt).toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        setMessage({ tone: "ok", text: `Borrador guardado a las ${time}. La URL no cambió.` });
      } else setMessage({ tone: "error", text: result.message });
    });

  const publish = async () => {
    const parsed = coaSchema.safeParse(doc);
    if (!parsed.success) {
      setIssues(describeIssues(parsed.error.issues));
      setMessage({ tone: "error", text: "Hay cosas para corregir antes de publicar." });
      return;
    }
    setIssues([]);
    const ok = await confirm({
      title: `¿Publicar la versión ${nextVersion} de ${lotLabel}?`,
      description: `Desde ese momento ${publicUrl} muestra este COA. Si hay un error, se puede volver a una versión anterior.`,
      confirmLabel: `Publicar versión ${nextVersion}`,
    });
    if (!ok) return;
    startPublishing(async () => {
      const result = await publishAction(documentId, parsed.data);
      if (result && !result.ok) setMessage({ tone: "error", text: result.message });
    });
  };

  const busy = saving || publishing;

  return (
    <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_520px]">
      <div className="flex min-w-0 flex-col gap-6">
        {intro && <p className="text-sm font-normal text-ink-muted">{intro}</p>}

        <Card title="Título">
          <Input
            aria-label="Título del COA"
            value={doc.title}
            onChange={(e) => patch({ title: e.target.value })}
            className="font-bold"
          />
        </Card>

        <Card title="Encabezado">
          <LinesEditor
            name="Encabezado"
            lines={doc.header}
            onChange={(header) => patch({ header })}
            onRemove={(i) => removeLine("header", i)}
            addLabel="Agregar línea"
          />
        </Card>

        {doc.tables.map((table, i) => (
          <TableEditor
            key={table.id}
            table={table}
            index={i}
            total={doc.tables.length}
            onChange={(t) => setTable(i, t)}
            onMove={(d) => moveTable(i, d)}
            onRemove={() => removeTable(i)}
            onRemoveRow={(r) => removeRow(table.id, i + 1, r)}
            onRemoveColumn={(c) => removeColumn(table.id, i + 1, c)}
            onNotify={(text) => toast({ message: text })}
          />
        ))}

        <div className="flex flex-col gap-3 rounded-card-lg border border-dashed border-line-strong p-5">
          <p className="text-sm font-medium text-brand-ink">Agregar tabla</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" icon={Plus} onClick={() => addTable("empty")}>
              Tabla vacía
            </Button>
            <Button type="button" variant="ghost" icon={Plus} onClick={() => addTable("overview")}>
              Cannabinoid Overview
            </Button>
            <Button type="button" variant="ghost" icon={Plus} onClick={() => addTable("batch")}>
              Batch Result
            </Button>
            <Button type="button" variant="ghost" icon={Plus} onClick={() => addTable("analytes")}>
              Analitos
            </Button>
          </div>
        </div>

        <Card title="Notas al pie">
          <Textarea
            aria-label="Notas al pie"
            rows={7}
            value={doc.notes}
            onChange={(e) => patch({ notes: e.target.value })}
            className="text-xs"
          />
          <p className="text-xs font-normal text-ink-muted">
            Van debajo de las tablas. Cada renglón sale como una línea.
          </p>
        </Card>

        <Card title="Pie de página">
          <LinesEditor
            name="Pie"
            lines={doc.footer}
            onChange={(footer) => patch({ footer })}
            onRemove={(i) => removeLine("footer", i)}
            addLabel="Agregar línea"
          />
          <p className="text-xs font-normal text-ink-muted">
            Se repite en cada página, abajo a la derecha, arriba del disclaimer de la FDA.
          </p>
        </Card>

        <div className="sticky bottom-0 z-10 -mx-5 flex flex-col gap-3 border-t border-line bg-surface/95 px-5 py-4 backdrop-blur md:-mx-10 md:px-10">
          {message && <FormAlert tone={message.tone}>{message.text}</FormAlert>}
          {issues.length > 0 && (
            <ul className="flex max-h-32 list-disc flex-col gap-1 overflow-y-auto pl-5 text-xs text-destructive">
              {issues.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="solid" icon={Send} disabled={busy} onClick={publish}>
              {publishing ? "Publicando…" : `Publicar versión ${nextVersion}`}
            </Button>
            <Button type="button" variant="outline" icon={Save} onClick={saveDraft} disabled={busy}>
              {saving ? "Guardando…" : "Guardar borrador"}
            </Button>
            <Link
              href={`/admin/lotes/${documentId}`}
              className="text-sm text-ink-muted underline-offset-2 hover:underline"
            >
              Volver al lote
            </Link>
            {dirty && <span className="text-xs text-ink-muted">Hay cambios sin guardar.</span>}
          </div>
        </div>
      </div>

      <aside className="2xl:sticky 2xl:top-[85px] 2xl:h-[calc(100dvh-110px)]">
        <PreviewPane state={preview} />
      </aside>
    </div>
  );
}
