"use client";

import { useQuery } from "@tanstack/react-query";
import { Loading01Icon } from "hugeicons-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput as ComboboxInputPrimitive,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

interface BankMatch {
  bankCode: string;
  bankName: string;
  accountName: string;
}

interface Bank {
  code: string;
  name: string;
}

interface BankSearchInputProps {
  value: string;
  onChange: (accountNumber: string) => void;
  onSelect: (match: BankMatch | null) => void;
  selected: BankMatch | null;
  error?: string;
}

export function BankSearchInput({
  value,
  onChange,
  onSelect,
  error,
}: BankSearchInputProps) {
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const { data: banksRes } = useQuery({
    queryKey: ["bank-codes"],
    queryFn: () => api.bankCodes(),
  });
  const bankCodeMap: Record<string, string> = {};
  const bankNames: string[] = (banksRes?.data?.banks ?? []).map(
    (b: { code: string; name: string }) => {
      bankCodeMap[b.name] = b.code;
      return b.name;
    },
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: onSelect is parent callback, stable
  useEffect(() => {
    if (!selectedBank || value.length !== 10) {
      setLookupResult(null);
      return;
    }

    let cancelled = false;
    setLookupLoading(true);
    api
      .bankLookup({ accountNumber: value, bankCode: bankCodeMap[selectedBank] })
      .then((res) => {
        if (cancelled) return;
        const name = res?.data?.accountName ?? null;
        setLookupResult(name);
        if (name) {
          onSelect({ bankCode: bankCodeMap[selectedBank], bankName: selectedBank, accountName: name });
        }
      })
      .catch(() => { if (!cancelled) setLookupResult(null); })
      .finally(() => { if (!cancelled) setLookupLoading(false); });
    return () => { cancelled = true; };
  }, [value, selectedBank]);

  function handleClear() {
    setSelectedBank(null);
    setLookupResult(null);
    onChange("");
    onSelect(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
        Bank
      </span>
      <Combobox
        items={bankNames}
        itemToStringValue={(name) => name}
        value={selectedBank}
        onValueChange={(name) => {
          setSelectedBank(name);
          setLookupResult(null);
        }}
      >
        <ComboboxInputPrimitive
          placeholder="Select bank"
          showClear={!!selectedBank}
        />
        <ComboboxContent>
          <ComboboxEmpty>No banks found</ComboboxEmpty>
          <ComboboxList>
            {(name) => (
              <ComboboxItem key={bankCodeMap[name]} value={name}>
                {name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      <span className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
        Account Number
      </span>
      <input
        type="text"
        inputMode="numeric"
        maxLength={10}
        placeholder="0123456789"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />

      {lookupLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loading01Icon className="size-4 animate-spin" />
          Verifying account...
        </div>
      )}

      {!lookupLoading && lookupResult && selectedBank && (
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
          <div className="flex flex-col">
            <span className="text-sm font-semibold">
              {selectedBank}
            </span>
            <span className="text-xs text-muted-foreground">
              {lookupResult}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Change
          </button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
