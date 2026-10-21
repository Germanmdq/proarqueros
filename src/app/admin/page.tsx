"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import "./admin.css";

type Variant = { id: string; size: string; stock: number; product_id: string };
type Product = { id: string; name: string; price_cash_ars: number | null; active: boolean; brands: { name: string }[]; product_variants: Variant[] };
type Supplier = { id: string; name: string };
const adminUsername = "proarqueros2026";
const adminEmail = "proarqueros2026@proarqueros.com";

export default function AdminPage() {
  const [username, setUsername] = useState(""); const [password, setPassword] = useState(""); const [message, setMessage] = useState("");
  const [admin, setAdmin] = useState(false); const [products, setProducts] = useState<Product[]>([]); const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedVariant, setSelectedVariant] = useState(""); const [quantity, setQuantity] = useState("1"); const [supplierId, setSupplierId] = useState("");
  async function load() {
    if (!supabase) return setMessage("Falta configurar Supabase.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setAdmin(false);
    const access = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!access.data) { setAdmin(false); return setMessage("Tu cuenta no tiene acceso de administración."); }
    setAdmin(true);
    const [productResult, supplierResult] = await Promise.all([
      supabase.from("products").select("id,name,price_cash_ars,active,brands(name),product_variants(id,size,stock,product_id)").order("name").limit(250),
      supabase.from("suppliers").select("id,name").eq("active", true).order("name"),
    ]);
    setProducts((productResult.data ?? []) as Product[]); setSuppliers((supplierResult.data ?? []) as Supplier[]);
  }
  useEffect(() => {
    load();
    if (!supabase) return;
    const { data: listener } = supabase.auth.onAuthStateChange(() => undefined);
    return () => listener.subscription.unsubscribe();
  }, []);
  async function login(event: FormEvent) { event.preventDefault(); if (!supabase) return; if (username !== adminUsername) return setMessage("Usuario o contraseña incorrectos."); const result = await supabase.auth.signInWithPassword({ email: adminEmail, password }); setMessage(result.error ? "Usuario o contraseña incorrectos." : "Sesión iniciada."); if (!result.error) load(); }
  async function addSupplier(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!supabase) return; const name = new FormData(event.currentTarget).get("supplier")?.toString().trim(); if (!name) return; const result = await supabase.from("suppliers").insert({ name }); setMessage(result.error?.message ?? "Proveedor agregado."); if (!result.error) { event.currentTarget.reset(); load(); } }
  async function addStock(event: FormEvent) { event.preventDefault(); if (!supabase || !selectedVariant) return; const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const amount = Number(quantity); if (!Number.isInteger(amount) || amount === 0) return setMessage("Ingresá una cantidad distinta de cero."); const result = await supabase.from("stock_movements").insert({ variant_id: selectedVariant, supplier_id: supplierId || null, quantity_delta: amount, reason: amount > 0 ? "ingreso" : "ajuste", created_by: user.id }); setMessage(result.error?.message ?? "Stock actualizado."); if (!result.error) load(); }
  async function updatePrice(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!supabase) return; const data = new FormData(event.currentTarget); const id = String(data.get("product_id")); const price = Number(data.get("price")); const result = await supabase.from("products").update({ price_cash_ars: Number.isFinite(price) && price > 0 ? price : null }).eq("id", id); setMessage(result.error?.message ?? "Precio actualizado."); if (!result.error) load(); }
  if (!admin) return <main className="admin"><section className="login"><p>PROARQUERO / ADMIN</p><h1>Panel privado</h1><form onSubmit={login}><label>Usuario<input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required /></label><label>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label><button>Ingresar</button></form><small>{message || "Ingresá con tu usuario administrador."}</small></section></main>;
  return <main className="admin"><header><p>PROARQUERO / ADMIN</p><h1>Stock y catálogo</h1><button onClick={() => supabase?.auth.signOut().then(load)}>Cerrar sesión</button></header><p className="status">{message}</p><section className="summary"><b>{products.length}<small>productos</small></b><b>{products.reduce((n,p) => n + p.product_variants.reduce((s,v) => s + v.stock, 0), 0)}<small>unidades</small></b><b>{products.filter((p) => p.product_variants.some((v) => v.stock < 3)).length}<small>stock bajo</small></b></section><section className="cards"><form onSubmit={addStock}><h2>Movimiento de stock</h2><label>Variante<select value={selectedVariant} onChange={(e) => setSelectedVariant(e.target.value)} required><option value="">Elegí un talle</option>{products.flatMap((p) => p.product_variants.map((v) => <option key={v.id} value={v.id}>{p.name} · Talle {v.size} · {v.stock} u.</option>))}</select></label><label>Cantidad (+ ingreso / − ajuste)<input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required /></label><label>Proveedor<select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}><option value="">Sin proveedor</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><button>Guardar movimiento</button></form><form onSubmit={addSupplier}><h2>Nuevo proveedor</h2><label>Nombre<input name="supplier" required placeholder="Ej. VGFC" /></label><button>Agregar proveedor</button></form></section><section className="catalog"><h2>Productos</h2>{products.map((p) => <article key={p.id}><div><b>{p.name}</b><small>{p.brands[0]?.name ?? "Sin marca"} · {p.product_variants.map((v) => `${v.size}: ${v.stock}`).join(" · ")}</small></div><form onSubmit={updatePrice}><input name="product_id" type="hidden" value={p.id} /><input name="price" type="number" defaultValue={p.price_cash_ars ?? ""} placeholder="Precio" /><button>Guardar</button></form></article>)}</section></main>;
}
