import React, { useState } from "react";
import { X, Loader2, Search } from "lucide-react";
import loyaltyAPI from "../../../api/loyalty";
import customerAPI, { type Customer } from "../../../api/customer";
import { dialogs } from "../../../utils/dialogs";

interface LoyaltyAdjustmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LoyaltyAdjustmentDialog: React.FC<LoyaltyAdjustmentDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<"select" | "adjust">("select");
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [type, setType] = useState<"earn" | "redeem">("earn");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setSearchLoading(true);
    try {
      const response = await customerAPI.search(searchTerm, 10);
      if (response.status) {
        setCustomers(response.data);
      } else {
        dialogs.alert({ title: "Error", message: response.message });
      }
    } catch (err: any) {
      dialogs.alert({ title: "Error", message: err.message });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setStep("adjust");
    setCustomers([]);
    setSearchTerm("");
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) return;
    if (points <= 0) {
      dialogs.alert({ title: "Error", message: "Points must be greater than 0." });
      return;
    }
    if (!reason.trim()) {
      dialogs.alert({ title: "Error", message: "Please provide a reason." });
      return;
    }

    setLoading(true);
    try {
      const pointsChange = type === "earn" ? points : -points;
      const response = await loyaltyAPI.create({
        customerId: selectedCustomer.id,
        pointsChange,
        notes: reason,
        user: "system",
      });
      if (response.status) {
        dialogs.alert({ title: "Success", message: "Points adjusted successfully." });
        onSuccess();
        reset();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.alert({ title: "Error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("select");
    setSearchTerm("");
    setCustomers([]);
    setSelectedCustomer(null);
    setPoints(0);
    setType("earn");
    setReason("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={reset} />
        <div className="relative bg-[var(--card-bg)] rounded-lg w-full max-w-md p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {step === "select" ? "Select Customer" : "Adjust Points"}
            </h2>
            <button onClick={reset} className="p-1 hover:bg-[var(--card-hover-bg)] rounded">
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          {step === "select" ? (
            <div>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Search by name or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                />
                <button
                  onClick={handleSearch}
                  disabled={searchLoading}
                  className="p-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)] disabled:opacity-50"
                >
                  {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>

              {customers.length > 0 && (
                <ul className="border border-[var(--border-color)] rounded-lg divide-y divide-[var(--border-color)] max-h-60 overflow-auto">
                  {customers.map((c) => (
                    <li
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="p-3 hover:bg-[var(--card-hover-bg)] cursor-pointer"
                    >
                      <p className="font-medium text-[var(--text-primary)]">{c.name}</p>
                      <p className="text-sm text-[var(--text-tertiary)]">{c.contactInfo || "No contact"}</p>
                      <p className="text-xs text-[var(--accent-purple)]">Points: {c.loyaltyPointsBalance}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[var(--card-secondary-bg)] p-3 rounded-lg border border-[var(--border-color)]">
                <p className="text-sm text-[var(--text-tertiary)]">Selected Customer</p>
                <p className="font-medium text-[var(--text-primary)]">{selectedCustomer?.name}</p>
                <p className="text-xs text-[var(--accent-purple)]">Current Points: {selectedCustomer?.loyaltyPointsBalance}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Action</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="type"
                      value="earn"
                      checked={type === "earn"}
                      onChange={() => setType("earn")}
                    />
                    <span className="text-[var(--text-primary)]">Add Points</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="type"
                      value="redeem"
                      checked={type === "redeem"}
                      onChange={() => setType("redeem")}
                    />
                    <span className="text-[var(--text-primary)]">Deduct Points</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Points {type === "earn" ? "to Add" : "to Deduct"}
                </label>
                <input
                  type="number"
                  min="1"
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Reason</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Manual adjustment, Promo, Correction"
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep("select")}
                  className="px-4 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)]"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)] disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};