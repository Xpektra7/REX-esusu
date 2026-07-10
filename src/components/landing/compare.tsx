import { Cancel01Icon, CheckmarkCircle01Icon } from "hugeicons-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const rows = [
  { label: "Automatic collection", cashAjo: false, bank: false, esusu: true },
  {
    label: "Visible to every member",
    cashAjo: false,
    bank: false,
    esusu: true,
  },
  {
    label: "Real bank account per member",
    cashAjo: false,
    bank: true,
    esusu: true,
  },
  {
    label: "Missed payments tracked",
    cashAjo: false,
    bank: false,
    esusu: true,
  },
  { label: "Fixed payout rotation", cashAjo: true, bank: false, esusu: true },
  { label: "No cash handling", cashAjo: false, bank: true, esusu: true },
];

function Mark({ value }: { value: boolean }) {
  return value ? (
    <CheckmarkCircle01Icon className="mx-auto size-6 text-primary" />
  ) : (
    <Cancel01Icon className="mx-auto size-6 text-muted-foreground/40" />
  );
}

export function Compare() {
  return (
    <section className="landing-section">
      <div className="landing-container">
        <div className="mb-12 md:mb-16">
          <p className="eyebrow text-muted-foreground">Compare</p>
          <h2 className="mt-2 text-2xl font-bold md:text-3xl">
            Better than cash ajo, better than a bank
          </h2>
        </div>

        <div className="rounded-xl border border-border">
          <Table className="max-w-full md:min-w-140 wrap-anywhere">
            <TableHeader>
              <TableRow>
                <TableHead className="p-4 w-2">&nbsp;</TableHead>
                <TableHead className="p-4 text-center">Cash Ajo</TableHead>
                <TableHead className="p-4 text-center">Bank Savings</TableHead>
                <TableHead className="bg-foreground p-4 text-center font-semibold text-background">
                  Esusu
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="">
              {rows.map((row) => (
                <TableRow key={row.label} className="">
                  <TableCell className="p-4 pr-0 w-2 text-xs md:text-base font-medium">
                    {row.label}
                  </TableCell>
                  <TableCell className="p-4 text-center">
                    <Mark value={row.cashAjo} />
                  </TableCell>
                  <TableCell className="p-4 text-center">
                    <Mark value={row.bank} />
                  </TableCell>
                  <TableCell className="bg-card p-4 text-center">
                    <Mark value={row.esusu} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
