import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import customerAPI from "../../../api/customer";
import { dialogs } from "../../../utils/dialogs";

interface CustomerFormDialogProps {
  isOpen: boolean;
  mode: "add" | "edit";
  customerId?: number;
  initialData?: Partial<{
    name: string;
    email: string;
    phone: string;
    loyaltyPointsBalance: number;
  }>;
  onClose: () => void;
  onSuccess: () => void;
}

export const CustomerFormDialog: React.FC<CustomerFormDialogProps> = ({
  isOpen,
  mode,
  customerId,
  initialData,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    loyaltyPointsBalance: 0,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        loyaltyPointsBalance: initialData.loyaltyPointsBalance || 0,
      });
    } else {
      setFormData({ name: "", email: "", phone: "", loyaltyPointsBalance: 0 });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    // Optional: email format validation
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    // Optional: phone validation (basic)
    if (formData.phone && !/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number";
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      if (mode === "add") {
        await customerAPI.create(
          {
            name: formData.name,
            email: formData.email || undefined,
            phone: formData.phone || undefined,
            loyaltyPointsBalance: formData.loyaltyPointsBalance,
          },
          "system"
        );
        dialogs.alert({
          title: "Success",
          message: "Customer created successfully.",
        });
      } else {
        if (!customerId) throw new Error("Customer ID missing for edit");
        await customerAPI.update(
          customerId,
          {
            name: formData.name,
            email: formData.email || undefined,
            phone: formData.phone || undefined,
            loyaltyPointsBalance: formData.loyaltyPointsBalance,
          },
          "system"
        );
        dialogs.alert({
          title: "Success",
          message: "Customer updated successfully.",
        });
      }
      onSuccess();
    } catch (err: any) {
      dialogs.alert({ title: "Error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
        <div className="relative bg-[var(--card-bg)] rounded-lg w-full max-w-md p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {mode === "add" ? "Add Customer" : "Edit Customer"}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-[var(--card-hover-bg)] rounded">
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full bg-[var(--input-bg)] border ${
                  errors.name ? "border-[var(--accent-red)]" : "border-[var(--input-border)]"
                } rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-[var(--accent-red)]">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full bg-[var(--input-bg)] border ${
                  errors.email ? "border-[var(--accent-red)]" : "border-[var(--input-border)]"
                } rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]`}
                placeholder="customer@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-[var(--accent-red)]">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full bg-[var(--input-bg)] border ${
                  errors.phone ? "border-[var(--accent-red)]" : "border-[var(--input-border)]"
                } rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]`}
                placeholder="+1234567890"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-[var(--accent-red)]">{errors.phone}</p>
              )}
            </div>

            {/* Loyalty Points */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Initial Loyalty Points
              </label>
              <input
                type="number"
                min="0"
                value={formData.loyaltyPointsBalance}
                onChange={(e) =>
                  setFormData({ ...formData, loyaltyPointsBalance: Number(e.target.value) })
                }
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)] disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === "add" ? "Create" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};