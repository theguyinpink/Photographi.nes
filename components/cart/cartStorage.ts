// components/cart/cartStorage.ts
export type CartItem = {
  id: string;
  title: string;
  image_url: string;
  price_cents: number;
  currency: "EUR";
  qty: number;
};

const KEY = "photographines_cart_v1";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function addItem(item: Omit<CartItem, "qty">, qty = 1) {
  const cart = getCart();
  const idx = cart.findIndex((i) => i.id === item.id);

  if (idx >= 0) cart[idx] = { ...cart[idx], qty: cart[idx].qty + qty };
  else cart.push({ ...item, qty });

  saveCart(cart);
  return cart;
}

export function setQty(id: string, qty: number) {
  const cart = getCart()
    .map((i) => (i.id === id ? { ...i, qty } : i))
    .filter((i) => i.qty > 0);

  saveCart(cart);
  return cart;
}

export function removeFromCart(id: string) {
  const cart = getCart().filter((i) => i.id !== id);
  saveCart(cart);
  return cart;
}

export function clearCart() {
  saveCart([]);
}
