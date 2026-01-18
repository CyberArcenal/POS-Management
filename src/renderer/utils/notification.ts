// src/utils/notification.ts
interface NotificationOptions {
  duration?: number;
  autoClose?: boolean;
  swipeClose?: boolean;
  showClose?: boolean;
}

type NotificationType = "success" | "error" | "warning" | "info" | "critical";

interface ApiErrorResponse {
  status?: number;
  statusText?: string;
  data?: any;
}

interface ApiError extends Error {
  response?: ApiErrorResponse;
}

class NotificationManager {
  private toastContainer: HTMLElement | null;
  private bannerContainer: HTMLElement | null;
  private loadingOverlay: HTMLElement | null;
  private nextToastId: number;

  constructor() {
    this.toastContainer = null;
    this.bannerContainer = null;
    this.loadingOverlay = null;
    this.nextToastId = 1;
    this.initContainers();
  }

  private initContainers(): void {
    // Remove existing containers if they exist
    if (this.toastContainer) this.toastContainer.remove();
    if (this.bannerContainer) this.bannerContainer.remove();
    if (this.loadingOverlay) this.loadingOverlay.remove();

    // Create toast container (bottom center for mobile)
    this.toastContainer = document.createElement("div");
    this.toastContainer.id = "toast-container";
    this.toastContainer.className =
      "fixed bottom-4 left-0 right-0 z-[9999] px-4 flex flex-col items-center space-y-3 pointer-events-none";
    document.body.appendChild(this.toastContainer);

    // Create banner container (below navigation)
    this.bannerContainer = document.createElement("div");
    this.bannerContainer.id = "banner-container";
    this.bannerContainer.className = "fixed top-16 left-0 right-0 z-[9998]";
    document.body.appendChild(this.bannerContainer);

    // Create loading overlay
    this.loadingOverlay = document.createElement("div");
    this.loadingOverlay.id = "loading-overlay";
    this.loadingOverlay.className =
      "fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center hidden";
    this.loadingOverlay.innerHTML = `
      <div class="bg-white rounded-xl p-6 w-64 text-center shadow-2xl border border-gray-200">
        <div class="spinner mx-auto mb-4"></div>
        <p class="text-gray-700 font-medium">Processing request...</p>
      </div>
    `;
    document.body.appendChild(this.loadingOverlay);
  }

  private getIcon(type: NotificationType): string {
    const icons = {
      success: `
        <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      `,
      error: `
        <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      `,
      warning: `
        <svg class="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      `,
      info: `
        <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
      `,
      critical: `
        <svg class="h-6 w-6 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.29 3.86L1.82 18a1 1 0 00.86 1.5h18.64a1 1 0 00.86-1.5L13.71 3.86a1 1 0 00-1.72 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01"/>
        </svg>
      `,
    };

    return icons[type] || icons.info;
  }

  private getToastClasses(type: NotificationType): string {
    const baseClasses = `
      w-full max-w-md rounded-lg shadow-lg p-4 flex items-start pointer-events-auto
      bg-white border-l-4 animate-slideInBottom
    `;

    const typeClasses = {
      success: "border-green-500",
      error: "border-red-500",
      warning: "border-amber-500",
      info: "border-blue-500",
      critical: "border-red-700",
    };

    return `${baseClasses} ${typeClasses[type]}`;
  }

  private getBannerClasses(type: NotificationType): string {
    const baseClasses =
      "w-full py-3 px-4 shadow-md border-b-2 animate-slideInTop";

    const typeClasses = {
      success: "bg-green-50 border-green-500 text-green-800",
      error: "bg-red-50 border-red-500 text-red-800",
      warning: "bg-amber-50 border-amber-500 text-amber-800",
      info: "bg-blue-50 border-blue-500 text-emerald-800",
      critical: "bg-red-100 border-red-700 text-red-900",
    };

    return `${baseClasses} ${typeClasses[type]}`;
  }

  public showToast(
    message: string,
    type: NotificationType = "info",
    options: NotificationOptions = {}
  ): HTMLElement {
    const toastId = `toast-${this.nextToastId++}`;
    const defaultOptions: NotificationOptions = {
      duration: 5000,
      autoClose: true,
      swipeClose: true,
      ...options,
    };

    const toast = document.createElement("div");
    toast.id = toastId;
    toast.className = this.getToastClasses(type);
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");

    toast.innerHTML = `
      <div class="mr-3 mt-0.5 flex-shrink-0">
        ${this.getIcon(type)}
      </div>
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-900">${message}</p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 ml-2 transition-colors duration-200 flex-shrink-0">
        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    `;

    this.toastContainer?.appendChild(toast);

    // Add close button handler
    const closeBtn = toast.querySelector("button");
    closeBtn?.addEventListener("click", () => this.removeToast(toast));

    // Auto-close if enabled
    if (
      defaultOptions.autoClose &&
      defaultOptions.duration &&
      defaultOptions.duration > 0
    ) {
      setTimeout(() => this.removeToast(toast), defaultOptions.duration);
    }

    // Swipe close if enabled
    if (defaultOptions.swipeClose) {
      this.addSwipeClose(toast);
    }

    return toast;
  }

  public removeToast(toastElement: HTMLElement): void {
    if (toastElement) {
      toastElement.classList.remove("animate-slideInBottom");
      toastElement.classList.add("animate-slideOutBottom");
      setTimeout(() => {
        if (toastElement.parentNode) {
          toastElement.parentNode.removeChild(toastElement);
        }
      }, 300);
    }
  }

  private addSwipeClose(toast: HTMLElement): void {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      isDragging = true;
      toast.style.transition = "none";
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      currentX = e.touches[0].clientX;
      const diff = currentX - startX;
      if (diff > 0) {
        toast.style.transform = `translateX(${diff}px)`;
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
      toast.style.transition = "transform 0.3s ease";
      const diff = currentX - startX;
      if (diff > toast.offsetWidth / 2) {
        this.removeToast(toast);
      } else {
        toast.style.transform = "translateX(0)";
      }
    };

    toast.addEventListener("touchstart", onTouchStart);
    toast.addEventListener("touchmove", onTouchMove);
    toast.addEventListener("touchend", onTouchEnd);
  }

  public showLoading(message = "Processing request..."): void {
    const textElement = this.loadingOverlay?.querySelector("p");
    if (textElement) textElement.textContent = message;
    this.loadingOverlay?.classList.remove("hidden");
  }

  public hideLoading(): void {
    this.loadingOverlay?.classList.add("hidden");
  }

  public createBanner(
    message: string,
    type: NotificationType = "info",
    options: NotificationOptions = {}
  ): HTMLElement {
    // Remove existing banner if any
    const existingBanner = this.bannerContainer?.querySelector(".banner");
    if (existingBanner) existingBanner.remove();

    const defaultOptions: NotificationOptions = {
      duration: 0, // 0 means don't auto-close
      autoClose: false,
      showClose: true,
      ...options,
    };

    const banner = document.createElement("div");
    banner.className = `banner ${this.getBannerClasses(type)}`;
    banner.setAttribute("role", "alert");
    banner.setAttribute("aria-live", "assertive");

    const closeButton = defaultOptions.showClose
      ? `<button class="text-current hover:opacity-70 ml-2 transition-opacity duration-200 flex-shrink-0">
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
        </button>`
      : "";

    banner.innerHTML = `
      <div class="container mx-auto px-4 flex items-center justify-center">
        <div class="mr-3 flex-shrink-0">
          ${this.getIcon(type)}
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium">${message}</p>
        </div>
        ${closeButton}
      </div>
    `;

    this.bannerContainer?.appendChild(banner);

    // Add close handler if close button exists
    if (defaultOptions.showClose) {
      const closeBtn = banner.querySelector("button");
      closeBtn?.addEventListener("click", () => this.removeBanner(banner));
    }

    // Auto-close if duration is set
    if (
      defaultOptions.autoClose &&
      defaultOptions.duration &&
      defaultOptions.duration > 0
    ) {
      setTimeout(() => this.removeBanner(banner), defaultOptions.duration);
    }

    return banner;
  }

  public removeBanner(bannerElement: HTMLElement): void {
    if (bannerElement) {
      bannerElement.classList.remove("animate-slideInTop");
      bannerElement.classList.add("animate-slideOutTop");
      setTimeout(() => {
        if (bannerElement.parentNode) {
          bannerElement.parentNode.removeChild(bannerElement);
        }
      }, 300);
    }
  }
}

// Singleton instance
const notificationManager = new NotificationManager();

// Add global styles for animations and inventory app theme
const style = document.createElement("style");
style.textContent = `
  @keyframes slideInBottom {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes slideOutBottom {
    from { transform: translateY(0); opacity: 1; }
    to { transform: translateY(100%); opacity: 0; }
  }
  
  @keyframes slideInTop {
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes slideOutTop {
    from { transform: translateY(0); opacity: 1; }
    to { transform: translateY(-100%); opacity: 0; }
  }
  
  .animate-slideInBottom {
    animation: slideInBottom 0.3s forwards;
  }
  
  .animate-slideOutBottom {
    animation: slideOutBottom 0.3s forwards;
  }
  
  .animate-slideInTop {
    animation: slideInTop 0.3s forwards;
  }
  
  .animate-slideOutTop {
    animation: slideOutTop 0.3s forwards;
  }
  
  .spinner {
    width: 24px;
    height: 24px;
    border: 3px solid #e5e7eb;
    border-radius: 50%;
    border-top: 3px solid #0E9D7C;
    animation: spin 1s linear infinite;
    margin: 0 auto;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Inventory App Color Scheme */
  .text-green-600 { color: #0E9D7C; }
  .text-red-600 { color: #ef4444; }
  .text-amber-600 { color: #f59e0b; }
  .text-blue-600 { color: #3b82f6; }
  .text-red-700 { color: #dc2626; }

  .bg-green-50 { background-color: #f0fdf4; }
  .bg-red-50 { background-color: #fef2f2; }
  .bg-amber-50 { background-color: #fffbeb; }
  .bg-blue-50 { background-color: #eff6ff; }
  .bg-red-100 { background-color: #fee2e2; }

  .border-green-500 { border-color: #0E9D7C; }
  .border-red-500 { border-color: #ef4444; }
  .border-amber-500 { border-color: #f59e0b; }
  .border-blue-500 { border-color: #3b82f6; }
  .border-red-700 { border-color: #dc2626; }

  .text-green-800 { color: #166534; }
  .text-red-800 { color: #991b1b; }
  .text-amber-800 { color: #92400e; }
  .text-emerald-800 { color: #1e40af; }
  .text-red-900 { color: #7f1d1d; }
`;
document.head.appendChild(style);

// Export functions
export const showToast = (
  message: string,
  type: NotificationType = "info",
  options: NotificationOptions = {}
): HTMLElement => {
  return notificationManager.showToast(message, type, options);
};

export const showSuccess = (
  message: string,
  options?: NotificationOptions
): HTMLElement => showToast(message, "success", options);

export const showError = (
  message: string,
  options?: NotificationOptions
): HTMLElement => showToast(message, "error", options);

export const showWarning = (
  message: string,
  options?: NotificationOptions
): HTMLElement => showToast(message, "warning", options);

export const showInfo = (
  message: string,
  options?: NotificationOptions
): HTMLElement => showToast(message, "info", options);

export const showCritical = (
  message: string,
  options?: NotificationOptions
): HTMLElement => showToast(message, "critical", options);

export const showLoading = (message?: string): void => {
  notificationManager.showLoading(message);
};

export const hideLoading = (): void => {
  notificationManager.hideLoading();
};

export const showBanner = (
  message: string,
  type: NotificationType = "info",
  options: NotificationOptions = {}
): HTMLElement => {
  return notificationManager.createBanner(message, type, options);
};

export const showCriticalBanner = (
  message: string,
  options?: NotificationOptions
): HTMLElement => showBanner(message, "critical", options);

/**
 * Extracts error message from backend response
 */
export const extractErrorMessage = (error: ApiError): string => {
  // Handle network errors
  if (!error.response) {
    return "Network error. Please check your connection.";
  }

  const response = error.response;
  const data = response.data;

  // Handle string responses
  if (typeof data === "string") {
    return data;
  }

  // Handle array responses
  if (Array.isArray(data)) {
    return data
      .map((item) =>
        typeof item === "string" ? item : item.string || JSON.stringify(item)
      )
      .join(". ");
  }

  // Handle object responses
  if (typeof data === "object" && data !== null) {
    // Common fields
    if (data.detail)
      return typeof data.detail === "string"
        ? data.detail
        : JSON.stringify(data.detail);
    if (data.error) {
      const err = data.error;
      return typeof err === "string"
        ? err
        : Array.isArray(err)
          ? err.map((e) => e.string || e).join(". ")
          : JSON.stringify(err);
    }
    if (data.message) return data.message;
    if (data.errors && Array.isArray(data.errors))
      return data.errors.join(". ");

    // General validation errors
    const messages: string[] = [];
    Object.values(data).forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item === "object" && item !== null && "string" in item) {
            messages.push(item.string);
          } else if (typeof item === "string") {
            messages.push(item);
          } else {
            messages.push(JSON.stringify(item));
          }
        });
      } else if (typeof value === "string") {
        messages.push(value);
      } else if (
        typeof value === "object" &&
        value !== null &&
        "string" in value
      ) {
        messages.push((value as any).string);
      } else {
        messages.push(JSON.stringify(value));
      }
    });

    if (messages.length > 0) {
      return messages.join(". ");
    }
  }

  // Fallback
  return response.statusText || `Request failed with status ${response.status}`;
};

/**
 * Shows appropriate toast based on API response error
 */
export const showApiError = (
  error: unknown,
  fallback: string = "",
  options: NotificationOptions = {}
): void => {
  let message = "An unexpected error occurred";
  let status: number | undefined;

  // Handle different error formats
  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, any>;

    // Axios-style error with response object
    if (err.response) {
      status = err.response.status;
      message = extractErrorMessage(err as ApiError);
    }
    // Django REST Framework-style error
    else if (err.status) {
      status = err.status;
      if (err.data) {
        message = extractErrorMessage({
          response: { data: err.data, status: err.status },
        } as ApiError);
      } else {
        message = err.message || fallback;
      }
    }
    // Simple error object with message
    else if (err.message) {
      message = err.message;
    }
    // Direct API response data
    else if (err.detail || err.error || err.message) {
      message = extractErrorMessage({ response: { data: error } } as ApiError);
    }
  }
  // String errors
  else if (typeof error === "string") {
    message = error;
  }

  // Determine error type based on status code
  let type: NotificationType = "error";
  if (status === 401) type = "critical";
  if (status === 403) type = "critical";
  if (status === 404) type = "warning";
  if (status && status >= 500) type = "critical";

  showToast(message, type, {
    duration: 7000,
    autoClose: true,
    ...options,
  });
};

// Convenience notification functions for inventory app
export const inventoryNotifications = {
  // Product-related notifications
  productCreated: (productName: string) =>
    showSuccess(`Product "${productName}" created successfully`),
  productUpdated: (productName: string) =>
    showSuccess(`Product "${productName}" updated successfully`),
  productDeleted: (productName: string) =>
    showSuccess(`Product "${productName}" deleted successfully`),
  lowStockWarning: (productName: string, quantity: number) =>
    showWarning(
      `Low stock alert: "${productName}" has only ${quantity} units left`
    ),
  outOfStock: (productName: string) =>
    showError(`Out of stock: "${productName}" is no longer available`),

  // Order-related notifications
  orderCreated: (orderId: string) =>
    showSuccess(`Order #${orderId} created successfully`),
  orderUpdated: (orderId: string) =>
    showSuccess(`Order #${orderId} updated successfully`),
  orderCompleted: (orderId: string) =>
    showSuccess(`Order #${orderId} marked as completed`),

  // Purchase-related notifications
  purchaseCreated: (purchaseId: string) =>
    showSuccess(`Purchase order #${purchaseId} created successfully`),
  purchaseReceived: (purchaseId: string) =>
    showSuccess(`Purchase order #${purchaseId} received and stock updated`),

  // System notifications
  dataExported: (format: string) =>
    showSuccess(`${format.toUpperCase()} export completed successfully`),
  backupCreated: () => showSuccess("Database backup created successfully"),
  settingsUpdated: () => showSuccess("Settings updated successfully"),
};

// // Product operations
// inventoryNotifications.productCreated("iPhone 15 Pro");
// inventoryNotifications.lowStockWarning("Samsung Tablet", 5);
// inventoryNotifications.outOfStock("Wireless Mouse");

// // Order operations
// inventoryNotifications.orderCreated("ORD-001");
// inventoryNotifications.orderCompleted("ORD-001");

// // System operations
// inventoryNotifications.dataExported("CSV");
// inventoryNotifications.backupCreated();

// // Traditional notifications still available
// showSuccess("Operation completed successfully");
// showError("Something went wrong");
