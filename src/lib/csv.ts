import { formatNaira } from "@/lib/utils";

function escapeCsv(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

interface CsvDebtRow {
  memberName: string;
  amountKobo: number;
  cycle: number;
  status: string;
}

interface CsvCycleRow {
  cycleNumber: number;
  status: string;
  totalKobo: number;
  completedAt: string | null;
}

export function downloadReportCsv(
  circleName: string,
  cycles: CsvCycleRow[],
  debts: CsvDebtRow[],
) {
  const rows: string[] = [];

  rows.push(`Circle Report,${escapeCsv(circleName)}`);
  rows.push("");
  rows.push("Cycle History");
  rows.push("Cycle #,Status,Total,Completed");

  for (const c of cycles) {
    rows.push(
      [
        c.cycleNumber,
        escapeCsv(c.status),
        formatNaira(c.totalKobo),
        c.completedAt ?? "—",
      ].join(","),
    );
  }

  rows.push("");
  rows.push("Debt History");
  rows.push("Member,Amount,Cycle,Status");

  for (const d of debts) {
    rows.push(
      [
        escapeCsv(d.memberName),
        formatNaira(d.amountKobo),
        d.cycle,
        escapeCsv(d.status),
      ].join(","),
    );
  }

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${circleName.replace(/\s+/g, "-").toLowerCase()}-report.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
