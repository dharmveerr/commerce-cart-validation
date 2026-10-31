import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

const selectedFields = ["sku", "qty", "quote_id", "item_id", "product_type", "product_option"];
const fields = (root: string) => selectedFields.map((name) => ({ name, source: `data.${root}.${name}` }));
const shared = { category: "validation" as const, env: ["saas"] as ["saas"] };
const hook = (webhook_method: string, hook_name: string) => ({
  webhook_method,
  webhook_type: "before" as const,
  batch_name: "cart_validation",
  hook_name,
  method: "POST" as const,
  required: false,
  timeout: 5000,
  soft_timeout: 3000,
  fallback_error_message: "We could not validate your cart right now. Please try again.",
});

export default defineConfig({
  metadata: {
    id: "cart-validation",
    displayName: "Cart Validation",
    description: "Limits the total units in a Commerce cart to an Admin-configurable maximum, validated synchronously via webhooks on add, quantity change, and guest cart merge at login.",
    version: "1.0.0",
  },
  businessConfig: {
    schema: [
      { name: "enabled", type: "boolean", label: "Enable cart validation", default: true },
      { name: "maxCartQuantity", type: "text", label: "Maximum total cart quantity", description: "Positive whole number of units across all cart lines.", default: "10" },
    ],
  },
  webhooks: [
    { ...shared, label: "Validate cart add", description: "Check the total units when an item is added.", runtimeAction: "cart-validation/validate-cart-add", webhook: { ...hook("observer.sales_quote_add_item", "validate_cart_add"), fields: fields("quote_item") } },
    { ...shared, label: "Validate cart update", description: "Check the total units when an item quantity changes.", runtimeAction: "cart-validation/validate-cart-update", webhook: { ...hook("observer.sales_quote_item_save_after", "validate_cart_update"), fields: fields("item") } },
    { ...shared, label: "Validate cart merge", description: "Check the total units when a guest cart merges.", runtimeAction: "cart-validation/validate-cart-merge", webhook: hook("observer.sales_quote_merge_after", "validate_cart_merge") },
  ],
});
