import "./trade-picker.css";

export type TradePickerQuote = { ok: boolean; max: number; unitPrice: number; total: number; reason?: string };
export type TradePickerOptions = {
  label: string;
  action: "Kaufen" | "Verkaufen";
  quote: (quantity: number) => TradePickerQuote;
  confirm: (quantity: number, unitPrice: number) => { ok: boolean; message: string };
  cancel: () => void;
  /** Keep unfinished numeric input across the host's normal save/render cycle. */
  initialQuantity?: string;
  onQuantityChange?: (raw: string) => void;
};
let nextPickerId = 0;
const numbers = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
const money = (value: number) => `${numbers.format(value)} ₲`;

/** All controls edit a draft. Only the explicit confirmation can book a trade. */
export function renderTradePicker(parent: HTMLElement, options: TradePickerOptions): void {
  const id = `trade-picker-${++nextPickerId}`;
  const section = document.createElement("section");
  section.className = "trade-picker";
  section.setAttribute("aria-labelledby", `${id}-title`);
  const title = document.createElement("h3"); title.id = `${id}-title`; title.textContent = `${options.action} · ${options.label}`;
  const unit = document.createElement("p"); unit.className = "trade-picker-unit";
  const label = document.createElement("label"); label.htmlFor = `${id}-quantity`; label.textContent = "Menge";
  const controls = document.createElement("div"); controls.className = "trade-picker-controls";
  const button = (text: string, attribute: string, ariaLabel?: string) => {
    const element = document.createElement("button"); element.type = "button"; element.textContent = text; element.setAttribute(attribute, "");
    if (ariaLabel) element.setAttribute("aria-label", ariaLabel);
    return element;
  };
  const minus = button("−", "data-trade-minus", "Menge verringern");
  const quantity = document.createElement("input");
  quantity.type = "number"; quantity.inputMode = "numeric"; quantity.min = "1"; quantity.step = "1";
  quantity.id = `${id}-quantity`; quantity.setAttribute("data-trade-quantity", "");
  quantity.setAttribute("aria-describedby", `${id}-limit ${id}-status`);
  quantity.autocomplete = "off";
  quantity.value = options.initialQuantity ?? "1";
  const plus = button("+", "data-trade-plus", "Menge erhöhen");
  const max = button("Max", "data-trade-max", "Maximale Menge wählen");
  controls.append(minus, quantity, plus, max);
  const range = document.createElement("input");
  range.type = "range"; range.step = "1"; range.setAttribute("data-trade-range", "");
  range.setAttribute("aria-label", "Menge mit Schieberegler wählen"); range.setAttribute("aria-describedby", `${id}-limit`);
  const limit = document.createElement("p"); limit.id = `${id}-limit`; limit.className = "trade-picker-limit";
  const total = document.createElement("output"); total.className = "trade-picker-total"; total.setAttribute("data-trade-total", "");
  total.setAttribute("aria-live", "polite"); total.setAttribute("aria-atomic", "true");
  const status = document.createElement("p"); status.id = `${id}-status`; status.className = "trade-picker-status";
  status.setAttribute("data-trade-status", ""); status.setAttribute("role", "status");
  const actions = document.createElement("div"); actions.className = "trade-picker-actions";
  const confirm = button(options.action, "data-trade-confirm"); confirm.className = "trade-picker-confirm";
  const cancel = button("Abbrechen", "data-trade-cancel"); cancel.className = "trade-picker-cancel";
  actions.append(confirm, cancel);
  section.append(title, unit, label, controls, range, limit, total, status, actions);
  parent.append(section);

  let submitting = false;
  let quote: TradePickerQuote = { ok: false, max: 0, unitPrice: 0, total: 0 };
  const numberValue = () => quantity.value.trim() === "" ? NaN : Number(quantity.value);
  const validQuantity = (value: number) => Number.isSafeInteger(value) && value >= 1;
  function refresh(message = "") {
    const value = numberValue();
    quote = options.quote(validQuantity(value) ? value : 0);
    const maximum = Number.isSafeInteger(quote.max) && quote.max >= 0 ? quote.max : 0;
    const validPrice = Number.isSafeInteger(quote.unitPrice) && quote.unitPrice > 0;
    const valid = validQuantity(value) && value <= maximum && validPrice && quote.ok && Number.isSafeInteger(quote.total) && quote.total > 0;
    quantity.max = String(maximum); quantity.disabled = submitting;
    quantity.setAttribute("aria-invalid", String(!valid));
    range.min = maximum ? "1" : "0"; range.max = String(maximum);
    range.value = String(maximum ? Math.min(maximum, validQuantity(value) ? value : 1) : 0);
    range.disabled = submitting || maximum < 1;
    minus.disabled = submitting || !validQuantity(value) || value <= 1 || maximum < 1;
    plus.disabled = submitting || maximum < 1 || (validQuantity(value) && value >= maximum);
    max.disabled = submitting || maximum < 1;
    confirm.disabled = submitting || !valid;
    cancel.disabled = submitting;
    unit.textContent = validPrice ? `${money(quote.unitPrice)} je Stück` : "Für dieses Item ist aktuell kein Handel möglich.";
    limit.textContent = `${options.action === "Kaufen" ? "Maximal kaufbar" : "Maximal verkaufbar"}: ${numbers.format(maximum)} Stück`;
    total.textContent = `${options.action === "Kaufen" ? "Gesamtpreis" : "Gesamterlös"}: ${valid ? money(quote.total) : "—"}`;
    confirm.textContent = valid ? `${numbers.format(value)} × ${options.label} ${options.action.toLowerCase()} · ${money(quote.total)}` : options.action;
    status.textContent = message || (!validQuantity(value) ? "Bitte eine ganze Menge ab 1 eingeben." : !valid ? quote.reason || "Diese Menge ist aktuell nicht verfügbar." : "Erst mit der Bestätigung wird die gesamte Menge gehandelt.");
  }
  function change(raw: string) {
    quantity.value = raw;
    options.onQuantityChange?.(quantity.value);
    refresh();
  }
  quantity.addEventListener("input", () => { options.onQuantityChange?.(quantity.value); refresh(); });
  range.addEventListener("input", () => change(range.value));
  minus.addEventListener("click", () => change(String(Math.max(1, Math.min(quote.max, numberValue() - 1)))));
  plus.addEventListener("click", () => change(String(Math.min(quote.max, validQuantity(numberValue()) ? numberValue() + 1 : 1))));
  max.addEventListener("click", () => change(String(quote.max)));
  cancel.addEventListener("click", () => { if (!submitting) options.cancel(); });
  quantity.addEventListener("keydown", event => {
    if (event.key === "Enter") { event.preventDefault(); if (!confirm.disabled && !event.repeat) confirm.click(); }
  });
  confirm.addEventListener("click", () => {
    if (submitting || confirm.disabled) return;
    const value = numberValue(), expectedPrice = quote.unitPrice;
    if (!validQuantity(value)) { refresh(); return; }
    // Do not silently replace the displayed price during confirmation. The state
    // transaction revalidates it together with current stock, capacity and funds.
    submitting = true;
    confirm.disabled = true; cancel.disabled = true;
    quantity.disabled = range.disabled = minus.disabled = plus.disabled = max.disabled = true;
    try {
      const result = options.confirm(value, expectedPrice);
      if (result.ok) { status.textContent = result.message; return; }
      submitting = false; refresh(result.message);
    } catch {
      submitting = false; refresh("Der Handel konnte nicht abgeschlossen werden. Bitte erneut bestätigen.");
    }
  });
  refresh();
}
