const CONFIG: Record<string, { dot: string; text: string; label: string }> = {
  confirmed: { dot: "bg-success", text: "text-success", label: "Terkonfirmasi" },
  pending: { dot: "bg-warning", text: "text-warning", label: "Menunggu Bayar" },
  cancelled: { dot: "bg-danger", text: "text-danger", label: "Dibatalkan" },
  completed: { dot: "bg-on-surface-variant", text: "text-on-surface-variant", label: "Selesai" },
  paid: { dot: "bg-success", text: "text-success", label: "Lunas" },
  failed: { dot: "bg-danger", text: "text-danger", label: "Gagal" },
  available: { dot: "bg-success", text: "text-success", label: "Tersedia" },
  booked: { dot: "bg-danger", text: "text-danger", label: "Terisi" },
};

export default function StatusChip({ status, label }: { status: string; label?: string }) {
  const cfg = CONFIG[status] ?? { dot: "bg-outline", text: "text-outline", label: status };
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-medium ${cfg.text}`}>
      <span className={`w-2 h-2 ${cfg.dot}`} />
      {label ?? cfg.label}
    </span>
  );
}
