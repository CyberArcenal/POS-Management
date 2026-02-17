// src/renderer/pages/Settings/components/IntegrationsTab.tsx
import React, { useState } from "react";
import type { IntegrationsSettings, WebhookSetting } from "../../../api/system_config";

interface Props {
  settings: IntegrationsSettings;
  onUpdate: (field: keyof IntegrationsSettings, value: any) => void;
}

const IntegrationsTab: React.FC<Props> = ({ settings, onUpdate }) => {
  const [webhooks, setWebhooks] = useState<WebhookSetting[]>(settings.webhooks || []);

  const handleWebhookChange = (index: number, field: keyof WebhookSetting, value: any) => {
    const updated = [...webhooks];
    updated[index] = { ...updated[index], [field]: value };
    setWebhooks(updated);
    onUpdate("webhooks", updated);
  };

  const addWebhook = () => {
    const newWebhook: WebhookSetting = {
      url: "",
      events: [],
      enabled: true,
      secret: "",
    };
    const updated = [...webhooks, newWebhook];
    setWebhooks(updated);
    onUpdate("webhooks", updated);
  };

  const removeWebhook = (index: number) => {
    const updated = webhooks.filter((_, i) => i !== index);
    setWebhooks(updated);
    onUpdate("webhooks", updated);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">Integrations Settings</h3>

      {/* Accounting Integration */}
      <div className="border-b border-[var(--border-color)] pb-4">
        <h4 className="text-md font-medium text-[var(--text-primary)] mb-3">Accounting Integration</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="accounting_integration_enabled"
              checked={settings.accounting_integration_enabled || false}
              onChange={(e) => onUpdate("accounting_integration_enabled", e.target.checked)}
              className="windows-checkbox"
            />
            <label htmlFor="accounting_integration_enabled" className="text-sm text-[var(--text-secondary)]">
              Enable Accounting Integration
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Accounting API URL
            </label>
            <input
              type="url"
              value={settings.accounting_api_url || ""}
              onChange={(e) => onUpdate("accounting_api_url", e.target.value)}
              className="windows-input w-full"
              placeholder="https://api.accounting.com/v1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Accounting API Key
            </label>
            <input
              type="password"
              value={settings.accounting_api_key || ""}
              onChange={(e) => onUpdate("accounting_api_key", e.target.value)}
              className="windows-input w-full"
            />
          </div>
        </div>
      </div>

      {/* Payment Gateway */}
      <div className="border-b border-[var(--border-color)] pb-4">
        <h4 className="text-md font-medium text-[var(--text-primary)] mb-3">Payment Gateway</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="payment_gateway_enabled"
              checked={settings.payment_gateway_enabled || false}
              onChange={(e) => onUpdate("payment_gateway_enabled", e.target.checked)}
              className="windows-checkbox"
            />
            <label htmlFor="payment_gateway_enabled" className="text-sm text-[var(--text-secondary)]">
              Enable Payment Gateway
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Provider
            </label>
            <input
              type="text"
              value={settings.payment_gateway_provider || ""}
              onChange={(e) => onUpdate("payment_gateway_provider", e.target.value)}
              className="windows-input w-full"
              placeholder="Stripe, PayPal, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              API Key
            </label>
            <input
              type="password"
              value={settings.payment_gateway_api_key || ""}
              onChange={(e) => onUpdate("payment_gateway_api_key", e.target.value)}
              className="windows-input w-full"
            />
          </div>
        </div>
      </div>

      {/* Webhooks */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-md font-medium text-[var(--text-primary)]">Webhooks</h4>
          <button
            onClick={addWebhook}
            className="windows-button windows-button-primary text-sm px-3 py-1"
          >
            + Add Webhook
          </button>
        </div>

        <div className="space-y-4">
          {webhooks.map((webhook, index) => (
            <div key={index} className="border border-[var(--border-color)] rounded-lg p-4 bg-[var(--card-secondary-bg)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 flex justify-between items-start">
                  <h5 className="text-sm font-medium text-[var(--text-primary)]">Webhook #{index + 1}</h5>
                  <button
                    onClick={() => removeWebhook(index)}
                    className="text-[var(--danger-color)] hover:text-[var(--danger-hover)] text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    value={webhook.url}
                    onChange={(e) => handleWebhookChange(index, "url", e.target.value)}
                    className="windows-input w-full"
                    placeholder="https://example.com/webhook"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Events (comma separated)
                  </label>
                  <input
                    type="text"
                    value={webhook.events.join(", ")}
                    onChange={(e) =>
                      handleWebhookChange(
                        index,
                        "events",
                        e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                      )
                    }
                    className="windows-input w-full"
                    placeholder="sale.created, inventory.updated"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`webhook_enabled_${index}`}
                    checked={webhook.enabled}
                    onChange={(e) => handleWebhookChange(index, "enabled", e.target.checked)}
                    className="windows-checkbox"
                  />
                  <label htmlFor={`webhook_enabled_${index}`} className="text-sm text-[var(--text-secondary)]">
                    Enabled
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Secret (optional)
                  </label>
                  <input
                    type="text"
                    value={webhook.secret || ""}
                    onChange={(e) => handleWebhookChange(index, "secret", e.target.value)}
                    className="windows-input w-full"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IntegrationsTab;