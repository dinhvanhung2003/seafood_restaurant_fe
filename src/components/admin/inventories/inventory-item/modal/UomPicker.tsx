"use client";
import * as React from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useUomsQuery,
  useUomDetailQuery,
} from "@/hooks/admin/useUnitsOfMeasure";
import { ChevronDown, History } from "lucide-react";

type Props = {
  value?: string;
  onChange?: (code: string) => void;
};

const RECENT_KEY = "recent_uoms_v1";

export function UomPicker({ value, onChange }: Props) {
  const { data } = useUomsQuery({
    page: 1,
    limit: 500,
    sortBy: "code",
    sortDir: "ASC",
    isActive: true,
  });
  const all = data?.data || [];
  // if a selected value is inactive and not in the active list, fetch it individually
  const selectedDetail = useUomDetailQuery(
    value ? { code: value } : (undefined as any),
    {
      enabled: Boolean(value && !all.some((u) => u.code === value)),
    }
  );
  const listAll = React.useMemo(() => {
    const list = [...all];
    if (
      selectedDetail?.data &&
      !list.some((u) => u.code === selectedDetail.data.code)
    ) {
      list.push(selectedDetail.data);
    }
    return list;
  }, [all, selectedDetail?.data]);
  const [open, setOpen] = React.useState(false);
  const [recent, setRecent] = React.useState<string[]>([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {}
  }, []);

  const pushRecent = (code: string) => {
    setRecent((r) => {
      const next = [code, ...r.filter((c) => c !== code)].slice(0, 8);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const current =
    listAll.find((u) => u.code === value) || all.find((u) => u.code === value);

  // Nhóm theo dimension để dễ đọc
  const groups: Record<string, typeof listAll> = {
    count: [],
    mass: [],
    volume: [],
  };
  listAll.forEach((u) => groups[u.dimension].push(u));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
          size="sm"
        >
          {current ? (
            <span className="truncate">
              <span className="font-mono font-semibold">{current.code}</span> ·{" "}
              {current.name}
            </span>
          ) : (
            <span className="text-muted-foreground">Chọn đơn vị</span>
          )}
          <ChevronDown className="h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[320px]" align="start" sideOffset={6}>
        <Command>
          <CommandInput placeholder="Tìm mã hoặc tên..." />
          <CommandList>
            <CommandEmpty>Không tìm thấy</CommandEmpty>
            {recent.length > 0 && (
              <CommandGroup heading="Gần đây">
                {recent
                  .map((code) => listAll.find((u) => u.code === code))
                  .filter(Boolean)
                  .map((u) => (
                    <CommandItem
                      key={`recent-${u!.code}`}
                      value={`${u!.code} ${u!.name}`}
                      onSelect={() => {
                        onChange?.(u!.code);
                        pushRecent(u!.code);
                        setOpen(false);
                      }}
                    >
                      <History className="h-4 w-4 opacity-60" />
                      <span className="font-mono text-xs">{u!.code}</span>
                      <span className="ml-2 truncate">{u!.name}</span>
                      <Badge
                        variant="secondary"
                        className="ml-auto uppercase text-[10px]"
                      >
                        {u!.dimension}
                      </Badge>
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}
            <CommandSeparator />
            {Object.entries(groups).map(([dim, list]) => (
              <CommandGroup
                heading={
                  dim === "count"
                    ? "Số lượng"
                    : dim === "mass"
                    ? "Khối lượng"
                    : "Thể tích"
                }
                key={dim}
              >
                {list.map((u) => (
                  <CommandItem
                    key={u.code}
                    value={`${u.code} ${u.name}`}
                    onSelect={() => {
                      onChange?.(u.code);
                      pushRecent(u.code);
                      setOpen(false);
                    }}
                  >
                    <span className="font-mono text-xs font-semibold">
                      {u.code}
                    </span>
                    <span className="ml-2 truncate">{u.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
