import React, { useEffect, useState } from "react";
import { api, formatApiError } from "../lib/api";
import { useLang } from "../context/LangContext";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { toast } from "sonner";
import { Trash2, Plus, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);

export default function InputGIGR() {
  const { t } = useLang();
  const [products, setProducts] = useState([]);
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState("gr");
  const [form, setForm] = useState({ date: today(), product_id: "", type: "gr", quantity: 0, reference: "", notes: "" });

  const load = async () => {
    const [p, m] = await Promise.all([api.get("/products"), api.get("/stock/movements")]);
    setProducts(p.data);
    setRows(m.data.filter((r) => r.type === "gi" || r.type === "gr"));
  };
  useEffect(() => { load(); }, []);

  useEffect(() => { setForm((f) => ({ ...f, type: tab })); }, [tab]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.product_id) return toast.error("Product required");
    if (Number(form.quantity) <= 0) return toast.error("Quantity must be > 0");
    try {
      await api.post("/stock/movements", { ...form, quantity: Number(form.quantity), type: tab });
      toast.success(t("saved"));
      setForm({ date: today(), product_id: "", type: tab, quantity: 0, reference: "", notes: "" });
      load();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const prodName = (id) => products.find((p) => p.product_id === id)?.code || id;

  const filtered = rows.filter((r) => r.type === tab);

  return (
    <div className="space-y-6" data-testid="page-gigr">
      <div>
        <div className="label-caps">{t("input_menu")}</div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("gigr")}</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="rounded-sm">
          <TabsTrigger value="gr" data-testid="tab-gr" className="rounded-sm gap-2"><ArrowDownCircle className="h-4 w-4" /> {t("goods_receipt")}</TabsTrigger>
          <TabsTrigger value="gi" data-testid="tab-gi" className="rounded-sm gap-2"><ArrowUpCircle className="h-4 w-4" /> {t("goods_issue")}</TabsTrigger>
        </TabsList>

        <TabsContent value="gr" className="mt-4"></TabsContent>
        <TabsContent value="gi" className="mt-4"></TabsContent>
      </Tabs>

      <form onSubmit={submit} className="hairline bg-card p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div><div className="label-caps mb-1">{t("date")}</div>
          <Input data-testid="gigr-date" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-9 rounded-sm" /></div>
        <div><div className="label-caps mb-1">{t("product")}</div>
          <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
            <SelectTrigger data-testid="gigr-product" className="h-9 rounded-sm"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>{products.map((p) => <SelectItem key={p.product_id} value={p.product_id}>{p.code} · {p.name}</SelectItem>)}</SelectContent>
          </Select></div>
        <div><div className="label-caps mb-1">{t("quantity")}</div>
          <Input data-testid="gigr-qty" type="number" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="h-9 rounded-sm font-mono" /></div>
        <div><div className="label-caps mb-1">{t("reference")}</div>
          <Input data-testid="gigr-ref" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="h-9 rounded-sm" placeholder={tab === "gr" ? "GR-2026-…" : "GI-2026-…"} /></div>
        <div className="md:col-span-2"><div className="label-caps mb-1">{t("notes")}</div>
          <Textarea data-testid="gigr-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-sm min-h-[36px]" /></div>
        <div className="md:col-span-3 flex justify-end">
          <Button type="submit" data-testid="gigr-submit" className="rounded-sm"><Plus className="h-4 w-4 mr-1" />{t("submit")} {tab.toUpperCase()}</Button>
        </div>
      </form>

      <div className="hairline bg-card">
        <div className="p-4 border-b border-border label-caps">{tab === "gr" ? t("goods_receipt") : t("goods_issue")}</div>
        <table className="w-full text-sm dense-table">
          <thead className="bg-secondary/50 label-caps"><tr>
            <th className="text-left">{t("date")}</th><th className="text-left">{t("product")}</th>
            <th className="text-right">{t("quantity")}</th><th className="text-left">{t("reference")}</th><th></th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">{t("no_data")}</td></tr>}
            {filtered.map((r) => (
              <tr key={r.movement_id} className="border-t border-border hover:bg-secondary/40">
                <td className="font-mono">{r.date}</td>
                <td>{prodName(r.product_id)}</td>
                <td className="text-right font-mono">{Number(r.quantity).toLocaleString()}</td>
                <td className="font-mono text-xs">{r.reference}</td>
                <td className="text-right">
                  <button onClick={async () => { if (window.confirm(t("confirm_delete"))) { await api.delete(`/stock/movements/${r.movement_id}`); toast.success(t("deleted")); load(); } }} className="p-1 hover:bg-secondary text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
