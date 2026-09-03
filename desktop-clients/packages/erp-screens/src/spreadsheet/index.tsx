"use client";

import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Download, Upload, WandSparkles } from "lucide-react";
import { Badge, Button, Card, Input, cn } from "@pepbits/ops-ui";
import { useERP } from "@pepbits/erp-shell";

type SheetCell = string | number;
const SHEET_COLUMNS = ["Item Code", "Description", "Quantity", "Unit Cost", "Discount %", "Tax %", "Net Cost", "Supplier"];
const INITIAL_SHEET: SheetCell[][] = [
  ["ITM-1001", "Industrial sensor", 12, 148.5, 3, 5, 2052.27, "Atlas Components"],
  ["ITM-1002", "Control relay", 36, 29.75, 0, 5, 1124.55, "Meridian Trading"],
  ["ITM-1003", "Shielded cable 20m", 18, 86.4, 2, 5, 1600.70, "Falcon Industrial"],
  ["ITM-1004", "Terminal enclosure", 8, 235, 5, 5, 1875.30, "Nova Systems"],
  ["ITM-1005", "Power conditioning unit", 4, 920, 4, 5, 3709.44, "Atlas Components"],
  ...Array.from({ length: 15 }, () => Array<SheetCell>(8).fill("")),
];

export function SpreadsheetPage() {
  const { toast } = useERP();
  const [rows, setRows] = useState<SheetCell[][]>(INITIAL_SHEET);
  const [selected, setSelected] = useState({ row: 0, column: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const cellRef = `${String.fromCharCode(65 + selected.column)}${selected.row + 1}`;
  const selectedValue = rows[selected.row]?.[selected.column] ?? "";

  const updateCell = (row: number, column: number, value: SheetCell) => {
    setRows((previous) => previous.map((current, rowIndex) => rowIndex === row ? current.map((cell, columnIndex) => columnIndex === column ? value : cell) : current));
  };

  const importFile = async (file: File) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const parsed = XLSX.utils.sheet_to_json<SheetCell[]>(worksheet, { header: 1, defval: "" });
    if (!parsed.length) return;
    const body = parsed[0].some((value, index) => String(value).toLowerCase().includes(SHEET_COLUMNS[index]?.toLowerCase() ?? "__")) ? parsed.slice(1) : parsed;
    const normalized = body.slice(0, 500).map((row) => Array.from({ length: SHEET_COLUMNS.length }, (_, index) => row[index] ?? ""));
    setRows(normalized.length ? normalized : INITIAL_SHEET);
    toast({ title: "Workbook imported", message: `${normalized.length} rows loaded into Spreadsheet Studio.`, type: "success" });
  };

  const exportWorkbook = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([SHEET_COLUMNS, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Costing");
    XLSX.writeFile(workbook, "nexora-costing-workbook.xlsx");
    toast({ title: "Workbook exported", message: "The edited worksheet was downloaded as an Excel file.", type: "success" });
  };

  const recalculate = () => {
    setRows((previous) => previous.map((row) => {
      const quantity = Number(row[2]) || 0;
      const unit = Number(row[3]) || 0;
      const discount = Number(row[4]) || 0;
      const tax = Number(row[5]) || 0;
      const subtotal = quantity * unit * (1 - discount / 100);
      return row.map((cell, index) => index === 6 ? Number((subtotal * (1 + tax / 100)).toFixed(2)) : cell);
    }));
    toast({ title: "Cost model recalculated", message: "Net cost was refreshed from quantity, unit cost, discount and tax.", type: "info" });
  };

  const total = rows.reduce((sum, row) => sum + (Number(row[6]) || 0), 0);

  return (
    <div className="flex w-full flex-col gap-3">
      <div data-tour="sheet-tools" className="flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-2.5 shadow-[var(--shadow-sm)]">
        <Button variant="primary" leftIcon={<Upload className="size-3.5" />} onClick={() => inputRef.current?.click()}>Import Excel / CSV</Button>
        <input ref={inputRef} className="hidden" type="file" accept=".xlsx,.xls,.csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file); event.currentTarget.value = ""; }} />
        <Button leftIcon={<Download className="size-3.5" />} onClick={exportWorkbook}>Export workbook</Button>
        <Button variant="secondary" leftIcon={<WandSparkles className="size-3.5" />} onClick={recalculate}>Recalculate costs</Button>
        <div className="ml-auto flex items-center gap-2"><Badge tone="brand">{rows.length} rows</Badge><Badge tone="success">AED {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Badge></div>
      </div>

      <Card className="overflow-hidden">
        <div data-tour="sheet-bar" className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
          <span className="flex h-8 min-w-14 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[length:calc(10px*var(--fs-scale))] font-black">{cellRef}</span>
          <Input aria-label="Formula bar" value={selectedValue} onChange={(event) => updateCell(selected.row, selected.column, event.target.value)} className="flex-1" />
          <span className="hidden text-[length:calc(9px*var(--fs-scale))] text-[var(--text-muted)] lg:inline">Edit cells directly, paste ranges, import workbooks and export the current model.</span>
        </div>
        <div data-tour="sheet" className="nex-scrollbar max-h-[650px] overflow-auto" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files?.[0]; if (file) void importFile(file); }}>
          <table className="min-w-[1100px] w-full border-collapse text-[length:calc(10px*var(--fs-scale))]">
            <thead className="sticky top-0 z-10 bg-[var(--surface-2)]">
              <tr><th className="w-12 border-b border-r border-[var(--border)] px-2 py-2 text-center text-[length:calc(9px*var(--fs-scale))] text-[var(--text-subtle)]">#</th>{SHEET_COLUMNS.map((column, index) => <th key={column} className="min-w-32 border-b border-r border-[var(--border)] px-3 py-2 text-left font-extrabold"><span className="mr-2 text-[length:calc(8px*var(--fs-scale))] text-[var(--text-subtle)]">{String.fromCharCode(65 + index)}</span>{column}</th>)}</tr>
            </thead>
            <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="hover:bg-[var(--surface-2)]"><td className="border-b border-r border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-center text-[length:calc(9px*var(--fs-scale))] font-bold text-[var(--text-subtle)]">{rowIndex + 1}</td>{SHEET_COLUMNS.map((_, columnIndex) => <td key={columnIndex} className={cn("border-b border-r border-[var(--border)] p-0", selected.row === rowIndex && selected.column === columnIndex && "outline outline-2 -outline-offset-2 outline-[var(--primary)]")}><input aria-label={`Row ${rowIndex + 1}, column ${SHEET_COLUMNS[columnIndex]}`} value={row[columnIndex] ?? ""} onFocus={() => setSelected({ row: rowIndex, column: columnIndex })} onChange={(event) => updateCell(rowIndex, columnIndex, event.target.value)} className="h-8 w-full min-w-28 bg-transparent px-3 text-[length:calc(10px*var(--fs-scale))] outline-none" /></td>)}</tr>)}</tbody>
            <tfoot className="sticky bottom-0 bg-[var(--surface)]"><tr><td colSpan={7} className="border-t border-[var(--border-strong)] px-3 py-2 text-right text-[length:calc(10px*var(--fs-scale))] font-black">Grand total</td><td className="border-t border-[var(--border-strong)] px-3 py-2 text-[length:calc(11px*var(--fs-scale))] font-black text-[var(--primary)]">AED {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="border-t border-[var(--border-strong)]" /></tr></tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}

