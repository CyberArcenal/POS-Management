// src/utils/dialogs.ts
export type ConfirmIconType =
  | "question"
  | "warning"
  | "danger"
  | "info"
  | "success";

export interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: ConfirmIconType;
  showCloseButton?: boolean;
  persistent?: boolean;
}

export interface AlertOptions {
  title?: string;
  message: string;
  buttonText?: string;
  icon?: ConfirmIconType;
}

// Icon component definitions
const IconTemplates = {
  question: `
    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  `,
  warning: `
    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
    </svg>
  `,
  danger: `
    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
    </svg>
  `,
  info: `
    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  `,
  success: `
    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  `,
};

const IconColors: Record<ConfirmIconType, string> = {
  question: "text-blue-600 bg-emerald-100",
  warning: "text-yellow-600 bg-yellow-100",
  danger: "text-red-600 bg-red-100",
  info: "text-blue-600 bg-emerald-100",
  success: "text-green-600 bg-green-100",
};

class DialogManager {
  private static instance: DialogManager;
  private container: HTMLDivElement | null = null;
  private activeDialogs: Set<HTMLDivElement> = new Set();

  private constructor() {
    this.injectGlobalStyles();
  }

  static getInstance(): DialogManager {
    if (!DialogManager.instance) {
      DialogManager.instance = new DialogManager();
    }
    return DialogManager.instance;
  }

  private injectGlobalStyles(): void {
    if (document.getElementById("dialog-styles")) return;

    const styles = document.createElement("style");
    styles.id = "dialog-styles";
    styles.textContent = `
      .dialog-backdrop {
        background-color: rgba(0, 0, 0, 0.2); /* Mas lighter na overlay */
        backdrop-filter: blur(2px); /* Subtle blur lang */
        transition: opacity 150ms ease-out;
      }
      
      .dialog-enter {
        opacity: 0;
        transform: scale(0.9);
      }
      
      .dialog-enter-active {
        opacity: 1;
        transform: scale(1);
        transition: opacity 200ms cubic-bezier(0.16, 1, 0.3, 1), 
                    transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      .dialog-exit {
        opacity: 1;
        transform: scale(1);
      }
      
      .dialog-exit-active {
        opacity: 0;
        transform: scale(0.9);
        transition: opacity 150ms cubic-bezier(0.4, 0, 0.2, 1), 
                    transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      /* Para mas smooth ang backdrop */
      .backdrop-enter {
        opacity: 0;
      }
      
      .backdrop-enter-active {
        opacity: 1;
        transition: opacity 150ms ease-out;
      }
      
      .backdrop-exit {
        opacity: 1;
      }
      
      .backdrop-exit-active {
        opacity: 0;
        transition: opacity 150ms ease-in;
      }
    `;
    document.head.appendChild(styles);
  }

  private createContainer(): void {
    if (this.container) return;

    this.container = document.createElement("div");
    this.container.id = "dialog-container";
    this.container.className =
      "fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none";
    document.body.appendChild(this.container);
  }

  private createBackdrop(): HTMLDivElement {
    const backdrop = document.createElement("div");
    backdrop.className =
      "fixed inset-0 bg-black/10 dialog-backdrop backdrop-enter pointer-events-auto"; /* Mas light */
    return backdrop;
  }

  private createDialogElement(): HTMLDivElement {
    const dialog = document.createElement("div");
    dialog.className = `
      bg-white rounded-xl shadow-2xl
      w-full max-w-md
      overflow-hidden
      transform transition-all duration-200
      pointer-events-auto
      border border-gray-200
      dialog-enter
    `;
    return dialog;
  }

  private animateIn(element: HTMLElement): void {
    requestAnimationFrame(() => {
      element.classList.remove("dialog-enter");
      element.classList.add("dialog-enter-active");
    });
  }

  private animateOut(element: HTMLElement, callback: () => void): void {
    element.classList.remove("dialog-enter-active");
    element.classList.add("dialog-exit", "dialog-exit-active");

    setTimeout(() => {
      callback();
    }, 150);
  }

  private getIconMarkup(iconType: ConfirmIconType): string {
    const colorClasses = IconColors[iconType];
    return `
      <div class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${colorClasses}">
        ${IconTemplates[iconType]}
      </div>
    `;
  }

  public showConfirm(options: ConfirmOptions = {}): Promise<boolean> {
    this.createContainer();

    return new Promise((resolve) => {
      const {
        title = "Are you sure?",
        message = "This action cannot be undone.",
        confirmText = "Confirm",
        cancelText = "Cancel",
        icon = "question",
        showCloseButton = true,
        persistent = false,
      } = options;

      const backdrop = this.createBackdrop();
      const dialog = this.createDialogElement();

      dialog.innerHTML = `
        <div class="p-6 flex items-start gap-4">
          ${this.getIconMarkup(icon)}
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-gray-900 leading-6">
              ${title}
            </h3>
            <p class="mt-2 text-sm text-gray-600 leading-5">
              ${message}
            </p>
          </div>
          ${
            showCloseButton
              ? `
            <button type="button" class="close-btn flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          `
              : ""
          }
        </div>
        <div class="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-200">
          <button type="button" class="
            cancel-btn
            px-4 py-2 text-sm font-medium
            text-gray-700 hover:text-gray-800 hover:bg-gray-100
            rounded-lg transition-colors duration-200
            border border-gray-300
          ">
            ${cancelText}
          </button>
          <button type="button" class="
            confirm-btn
            px-4 py-2 text-sm font-medium
            bg-[#0E9D7C] hover:bg-[#1AB394]
            text-white
            rounded-lg transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-[#0E9D7C] focus:ring-page-2
          ">
            ${confirmText}
          </button>
        </div>
      `;

      // Append to container
      this.container!.appendChild(backdrop);
      this.container!.appendChild(dialog);
      this.activeDialogs.add(dialog);

      // Animate in backdrop first
      requestAnimationFrame(() => {
        backdrop.classList.remove("backdrop-enter");
        backdrop.classList.add("backdrop-enter-active");
      });

      // Animate in dialog
      setTimeout(() => {
        this.animateIn(dialog);
      }, 50);

      // Event handlers
      const cleanup = () => {
        // Animate out backdrop
        backdrop.classList.remove("backdrop-enter-active");
        backdrop.classList.add("backdrop-exit-active");

        // Animate out dialog
        this.animateOut(dialog, () => {
          dialog.remove();
          backdrop.remove();
          this.activeDialogs.delete(dialog);

          if (this.container && this.activeDialogs.size === 0) {
            this.container.remove();
            this.container = null;
          }
        });
      };

      const onConfirm = () => {
        if (!persistent) {
          cleanup();
        }
        resolve(true);
      };

      const onCancel = () => {
        if (!persistent) {
          cleanup();
        }
        resolve(false);
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !persistent) {
          onCancel();
        } else if (e.key === "Enter") {
          onConfirm();
        }
      };

      // Add event listeners
      dialog
        .querySelector<HTMLButtonElement>(".confirm-btn")!
        .addEventListener("click", onConfirm);
      dialog
        .querySelector<HTMLButtonElement>(".cancel-btn")!
        .addEventListener("click", onCancel);

      if (showCloseButton) {
        dialog
          .querySelector<HTMLButtonElement>(".close-btn")!
          .addEventListener("click", onCancel);
      }

      backdrop.addEventListener("click", onCancel);
      document.addEventListener("keydown", onKeyDown);

      // Focus the confirm button for accessibility
      setTimeout(() => {
        dialog.querySelector<HTMLButtonElement>(".confirm-btn")?.focus();
      }, 200);
    });
  }

  public showAlert(options: AlertOptions): Promise<void> {
    this.createContainer();

    return new Promise((resolve) => {
      const {
        title = "Information",
        message,
        buttonText = "OK",
        icon = "info",
      } = options;

      const backdrop = this.createBackdrop();
      const dialog = this.createDialogElement();

      dialog.innerHTML = `
        <div class="p-6 flex items-start gap-4">
          ${this.getIconMarkup(icon)}
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-gray-900 leading-6">
              ${title}
            </h3>
            <p class="mt-2 text-sm text-gray-600 leading-5">
              ${message}
            </p>
          </div>
        </div>
        <div class="px-6 py-4 bg-gray-50 flex justify-end border-t border-gray-200">
          <button type="button" class="
            alert-btn
            px-4 py-2 text-sm font-medium
            bg-[#0E9D7C] hover:bg-[#1AB394]
            text-white
            rounded-lg transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-[#0E9D7C] focus:ring-page-2
          ">
            ${buttonText}
          </button>
        </div>
      `;

      // Append to container
      this.container!.appendChild(backdrop);
      this.container!.appendChild(dialog);
      this.activeDialogs.add(dialog);

      // Animate in backdrop first
      requestAnimationFrame(() => {
        backdrop.classList.remove("backdrop-enter");
        backdrop.classList.add("backdrop-enter-active");
      });

      // Animate in dialog
      setTimeout(() => {
        this.animateIn(dialog);
      }, 50);

      // Event handlers
      const cleanup = () => {
        // Animate out backdrop
        backdrop.classList.remove("backdrop-enter-active");
        backdrop.classList.add("backdrop-exit-active");

        // Animate out dialog
        this.animateOut(dialog, () => {
          dialog.remove();
          backdrop.remove();
          this.activeDialogs.delete(dialog);

          if (this.container && this.activeDialogs.size === 0) {
            this.container.remove();
            this.container = null;
          }
        });
      };

      const onConfirm = () => {
        cleanup();
        resolve();
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" || e.key === "Enter") {
          onConfirm();
        }
      };

      // Add event listeners
      dialog
        .querySelector<HTMLButtonElement>(".alert-btn")!
        .addEventListener("click", onConfirm);
      backdrop.addEventListener("click", onConfirm);
      document.addEventListener("keydown", onKeyDown);

      // Focus the button for accessibility
      setTimeout(() => {
        dialog.querySelector<HTMLButtonElement>(".alert-btn")?.focus();
      }, 200);
    });
  }

  public closeAllDialogs(): void {
    this.activeDialogs.forEach((dialog) => {
      dialog.remove();
    });
    this.activeDialogs.clear();

    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}

// Create singleton instance
const dialogManager = DialogManager.getInstance();

// Export public API
export const showConfirm = (options?: ConfirmOptions): Promise<boolean> => {
  return dialogManager.showConfirm(options);
};

export const showAlert = (options: AlertOptions): Promise<void> => {
  return dialogManager.showAlert(options);
};

export const closeAllDialogs = (): void => {
  dialogManager.closeAllDialogs();
};

// Convenience functions for common dialog types
export const dialogs = {
  confirm: showConfirm,
  alert: showAlert,
  closeAll: closeAllDialogs,

  // Pre-configured dialogs
  delete: (itemName?: string) =>
    showConfirm({
      title: "Delete Confirmation",
      message: itemName
        ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
        : "Are you sure you want to delete this item? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      icon: "danger",
    }),

  success: (message: string, title: string = "Success!") =>
    showAlert({
      title,
      message,
      icon: "success",
    }),

  error: (message: string, title: string = "Error") =>
    showAlert({
      title,
      message,
      icon: "danger",
    }),

  warning: (message: string, title: string = "Warning") =>
    showAlert({
      title,
      message,
      icon: "warning",
    }),

  info: (message: string, title: string = "Information") =>
    showAlert({
      title,
      message,
      icon: "info",
    }),
};

// // Basic confirmation
// const confirmed = await showConfirm({
//   title: 'Delete Product',
//   message: 'Are you sure you want to delete this product?',
//   icon: 'danger'
// });

// // Pre-configured dialogs
// const confirmed = await dialogs.delete('iPhone 15 Pro');
// await dialogs.success('Product created successfully!');
// await dialogs.error('Failed to save product data.');

// // Alert dialog
// await showAlert({
//   title: 'Information',
//   message: 'Operation completed successfully.',
//   icon: 'success'
// });

// // Persistent dialog (cannot be closed by clicking backdrop)
// const confirmed = await showConfirm({
//   message: 'This action requires attention.',
//   persistent: true
// });
