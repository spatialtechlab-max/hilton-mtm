/**
 * GET /api/admin/users/export — the customer book as a formatted .xlsx.
 *
 * Columns: identity + contact + order stats + every saved measurement (one
 * column each). No photographs — this is the at-a-glance tracking sheet the
 * atelier asked for. Built with ExcelJS server-side so the heavy library
 * stays out of the client bundle, and so we get real Excel formatting
 * (bold burgundy header, frozen first row, autofilter, column widths).
 */
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { assertAdmin, gatherCustomers } from "@/lib/adminUserData";
import { allMeasurements } from "@/lib/customizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fmtDate = (iso: string | null, withTime = false) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  if (!withTime) return date;
  return `${date}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
};

export async function GET(req: Request) {
  const gate = await assertAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.msg }, { status: gate.status });

  const result = await gatherCustomers(req);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const wb = new ExcelJS.Workbook();
  wb.creator = "Hilton Made to Measure";
  wb.created = new Date();
  const ws = wb.addWorksheet("Customers", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  // Fixed columns, then one column per measurement field.
  const baseCols: Partial<ExcelJS.Column>[] = [
    { header: "#", key: "n", width: 5 },
    { header: "Name", key: "name", width: 24 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "City", key: "city", width: 16 },
    { header: "Country", key: "country", width: 16 },
    { header: "Orders", key: "orders", width: 9 },
    { header: "Spend (BHD)", key: "spend", width: 13, style: { numFmt: "0.00" } },
    { header: "Joined", key: "joined", width: 16 },
    { header: "Last sign-in", key: "lastSeen", width: 20 },
    { header: "Profile", key: "profile", width: 11 },
    { header: "Unit", key: "unit", width: 7 },
  ];
  const measCols: Partial<ExcelJS.Column>[] = allMeasurements.map((m) => ({
    header: m.label,
    key: `m_${m.slug}`,
    width: Math.max(10, m.label.length + 2),
  }));
  ws.columns = [...baseCols, ...measCols];

  result.users
    .slice()
    .sort((a, b) => (a.full_name ?? a.email ?? "").localeCompare(b.full_name ?? b.email ?? ""))
    .forEach((u, i) => {
      const row: Record<string, string | number> = {
        n: i + 1,
        name: u.full_name ?? "",
        email: u.email ?? "",
        phone: u.phone ?? "",
        city: u.city ?? "",
        country: u.country ?? "",
        orders: u.orders_count,
        spend: Number(u.total_spent || 0),
        joined: fmtDate(u.created_at),
        lastSeen: fmtDate(u.last_sign_in_at, true),
        profile: u.profile_complete ? "Complete" : "Incomplete",
        unit: u.measurements?.unit ?? "",
      };
      for (const m of allMeasurements) {
        const v = u.measurements?.values?.[m.slug];
        row[`m_${m.slug}`] = v != null && String(v).trim() !== "" ? String(v) : "";
      }
      ws.addRow(row);
    });

  // Header styling — bold white text on the house burgundy.
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7A1F2B" } };
  header.alignment = { vertical: "middle", horizontal: "left" };
  header.height = 22;
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: ws.columnCount },
  };

  // Light separators on every body row.
  for (let r = 2; r <= ws.rowCount; r += 1) {
    ws.getRow(r).eachCell((cell) => {
      cell.border = { bottom: { style: "hair", color: { argb: "FFE6E0D8" } } };
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(Buffer.from(buf as ArrayBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="hilton-customers-${stamp}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
