"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import "./admin.css";

type Brand = { id: string; name: string };
type Category = { id: string; name: string };
type Variant = { id: string; size: string; stock: number; product_id: string };
type Product = { id: string; name: string; description: string | null; audience: string; category_id: string | null; brand_id: string | null; price_cash_ars: number | null; image_url: string | null; video_url: string | null; active: boolean; brands: Brand[]; product_variants: Variant[] };

const adminEmail = "mateogonzaleztortilla@gmail.com";
const adminUsername = "proarqueros2026";
const createSlug = (name: string) => `${name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`;

export default function AdminPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);

  async function load() {
    if (!supabase) return setMessage("Falta configurar Supabase.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setIsAdmin(false);
    const access = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!access.data) return setMessage("Tu cuenta no tiene acceso de administración.");
    setIsAdmin(true);
    const [productResult, brandResult, categoryResult] = await Promise.all([
      supabase.from("products").select("id,name,description,audience,category_id,brand_id,price_cash_ars,image_url,video_url,active,brands(id,name),product_variants(id,size,stock,product_id)").order("name").limit(250),
      supabase.from("brands").select("id,name").order("name"),
      supabase.from("categories").select("id,name").order("name"),
    ]);
    setProducts((productResult.data ?? []) as Product[]);
    setBrands((brandResult.data ?? []) as Brand[]);
    setCategories((categoryResult.data ?? []) as Category[]);
  }

  useEffect(() => { load(); }, []);

  async function upload(productId: string, file: File, kind: "image" | "video") {
    if (!supabase) return false;
    const allowed = kind === "image" ? ["image/jpeg", "image/png", "image/webp", "image/avif"] : ["video/mp4", "video/webm"];
    if (!allowed.includes(file.type)) { setMessage(kind === "image" ? "Usá JPG, PNG, WEBP o AVIF." : "Usá MP4 o WEBM."); return false; }
    if (file.size > 50 * 1024 * 1024) { setMessage("El archivo no puede superar 50 MB."); return false; }
    const extension = file.name.split(".").pop()?.toLowerCase() ?? (kind === "image" ? "jpg" : "mp4");
    const path = `${productId}/${kind}-${Date.now()}.${extension}`;
    const uploaded = await supabase.storage.from("product-media").upload(path, file, { contentType: file.type });
    if (uploaded.error) { setMessage(uploaded.error.message); return false; }
    const { data: url } = supabase.storage.from("product-media").getPublicUrl(path);
    const updated = await supabase.from("products").update(kind === "image" ? { image_url: url.publicUrl } : { video_url: url.publicUrl }).eq("id", productId);
    if (updated.error) { setMessage(updated.error.message); return false; }
    return true;
  }

  async function login(event: FormEvent) {
    event.preventDefault();
    if (!supabase || username !== adminUsername) return setMessage("Usuario o contraseña incorrectos.");
    const result = await supabase.auth.signInWithPassword({ email: adminEmail, password });
    setMessage(result.error ? "Usuario o contraseña incorrectos." : "Sesión iniciada.");
    if (!result.error) load();
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const brandId = String(form.get("brand_id") ?? "");
    const categoryId = String(form.get("category_id") ?? "");
    const photo = form.get("photo");
    if (!name || !brandId || !categoryId) return setMessage("Completá nombre, marca y categoría.");
    setUploading(true);
    const inserted = await supabase.from("products").insert({ name, slug: createSlug(name), brand_id: brandId, category_id: categoryId, audience: String(form.get("audience") ?? "Adulto"), description: String(form.get("description") ?? "").trim() || null, price_cash_ars: Number(form.get("price")) || null, active: true }).select("id").single();
    if (inserted.error || !inserted.data) { setUploading(false); return setMessage(inserted.error?.message ?? "No se pudo crear el producto."); }
    await supabase.from("product_variants").insert({ product_id: inserted.data.id, size: String(form.get("size") ?? "Único").trim() || "Único", stock: 0 });
    if (photo instanceof File && photo.size > 0) await upload(inserted.data.id, photo, "image");
    setUploading(false);
    setMessage(photo instanceof File && photo.size > 0 ? "Producto y foto cargados correctamente." : "Producto creado. Podés agregarle una foto cuando quieras.");
    event.currentTarget.reset();
    load();
  }

  async function updateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !editing) return;
    const form = new FormData(event.currentTarget);
    const result = await supabase.from("products").update({ name: String(form.get("name") ?? "").trim(), brand_id: String(form.get("brand_id")) || null, category_id: String(form.get("category_id")) || null, audience: String(form.get("audience")), description: String(form.get("description") ?? "").trim() || null, price_cash_ars: Number(form.get("price")) || null, active: form.get("active") === "on" }).eq("id", editing.id);
    setMessage(result.error?.message ?? "Producto actualizado.");
    if (!result.error) { setEditing(null); load(); }
  }

  async function changeMedia(event: ChangeEvent<HTMLInputElement>, kind: "image" | "video") {
    const file = event.target.files?.[0];
    if (!editing || !file) return;
    setUploading(true);
    const success = await upload(editing.id, file, kind);
    setUploading(false);
    if (success) { setMessage(`${kind === "image" ? "Foto" : "Video"} cargado correctamente.`); setEditing(null); load(); }
  }

  if (!isAdmin) return <main className="admin"><section className="login"><p>PROARQUEROS / ADMIN</p><h1>Panel privado</h1><form onSubmit={login}><label>Usuario<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></label><label>Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label><button>Ingresar</button></form><small>{message || "Ingresá con tu usuario administrador."}</small></section></main>;
  const filtered = products.filter((product) => [product.name, product.brands[0]?.name ?? "", ...product.product_variants.map((variant) => variant.size)].join(" ").toLocaleLowerCase("es-AR").includes(search.toLocaleLowerCase("es-AR")));
  return <main className="admin"><header><p>PROARQUEROS / ADMIN</p><h1>Stock y catálogo</h1><button onClick={() => supabase?.auth.signOut().then(load)}>Cerrar sesión</button></header><p className="status">{message}</p><section className="summary"><b>{products.length}<small>productos</small></b><b>{products.reduce((total, product) => total + product.product_variants.reduce((sum, variant) => sum + variant.stock, 0), 0)}<small>unidades</small></b><b>{products.filter((product) => product.product_variants.some((variant) => variant.stock < 3)).length}<small>stock bajo</small></b></section><section className="product-form"><h2>Agregar producto</h2><form onSubmit={createProduct}><label>Nombre<input name="name" required placeholder="Ej. Guante modelo X" /></label><label>Marca<select name="brand_id" required defaultValue=""><option value="" disabled>Elegí una marca</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label><label>Categoría<select name="category_id" required defaultValue=""><option value="" disabled>Elegí una categoría</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Tipo<select name="audience" defaultValue="Adulto"><option>Adulto</option><option>Junior</option><option>Unisex</option></select></label><label>Talle inicial<input name="size" defaultValue="Único" /></label><label>Precio de contado<input name="price" type="number" min="0" placeholder="0" /></label><label>Foto del producto<input name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/avif" /></label><label className="wide">Descripción<textarea name="description" rows={3} placeholder="Detalle breve del producto" /></label><button disabled={uploading}>{uploading ? "Cargando…" : "Crear producto y cargar foto"}</button></form></section>{editing ? <section className="product-editor"><div className="editor-title"><div><p>EDITANDO PRODUCTO</p><h2>{editing.name}</h2></div><button type="button" className="secondary" onClick={() => setEditing(null)}>Cerrar</button></div><form onSubmit={updateProduct}><label>Nombre<input name="name" defaultValue={editing.name} required /></label><label>Marca<select name="brand_id" defaultValue={editing.brand_id ?? ""}>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label><label>Categoría<select name="category_id" defaultValue={editing.category_id ?? ""}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Tipo<select name="audience" defaultValue={editing.audience}><option>Adulto</option><option>Junior</option><option>Unisex</option></select></label><label>Precio de contado<input name="price" type="number" defaultValue={editing.price_cash_ars ?? ""} /></label><label className="checkbox"><input name="active" type="checkbox" defaultChecked={editing.active} />Producto activo</label><label className="wide">Descripción<textarea name="description" rows={3} defaultValue={editing.description ?? ""} /></label><button>Guardar cambios</button></form><div className="media-tools"><div>{editing.image_url ? <img src={editing.image_url} alt={`Foto de ${editing.name}`} /> : <span>Sin foto</span>}<label className="upload">{uploading ? "Cargando…" : "Cambiar foto"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => changeMedia(event, "image")} disabled={uploading} /></label></div><div>{editing.video_url ? <video src={editing.video_url} controls /> : <span>Sin video</span>}<label className="upload">{uploading ? "Cargando…" : "Agregar video"}<input type="file" accept="video/mp4,video/webm" onChange={(event) => changeMedia(event, "video")} disabled={uploading} /></label></div></div></section> : null}<section className="catalog"><div className="catalog-toolbar"><div><h2>Productos</h2><small>{filtered.length} resultados</small></div><label>Buscar producto<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, marca o talle" /></label></div>{filtered.map((product) => <article key={product.id}><div><b>{product.name}</b><small>{product.brands[0]?.name ?? "Sin marca"} · {product.product_variants.map((variant) => `${variant.size}: ${variant.stock}`).join(" · ")}</small></div><button type="button" className="secondary" onClick={() => setEditing(product)}>Editar, foto y video</button></article>)}</section></main>;
}
