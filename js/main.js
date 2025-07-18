// Main Application Controller
class App {
  constructor() {
    this.currentSection = "inventory";
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadDemoDataIfEmpty();
    this.switchSection("inventory"); // Start with inventory section
  }

  bindEvents() {
    // Navigation tabs
    document.querySelectorAll(".nav-tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        const section =
          e.target.dataset.section ||
          e.target.closest(".nav-tab").dataset.section;
        this.switchSection(section);
      });
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      this.handleKeyboardShortcuts(e);
    });

    // Handle browser back/forward
    window.addEventListener("popstate", (e) => {
      if (e.state && e.state.section) {
        this.switchSection(e.state.section, false);
      }
    });

    // Auto-save data periodically
    setInterval(() => {
      this.autoBackup();
    }, 300000); // Every 5 minutes
  }

  switchSection(sectionName, updateHistory = true) {
    // Hide all sections
    document.querySelectorAll(".section").forEach((section) => {
      section.classList.remove("active");
    });

    // Remove active state from all tabs
    document.querySelectorAll(".nav-tab").forEach((tab) => {
      tab.classList.remove("active");
    });

    // Show target section
    const targetSection = document.getElementById(sectionName);
    const targetTab = document.querySelector(`[data-section="${sectionName}"]`);

    if (targetSection && targetTab) {
      targetSection.classList.add("active");
      targetTab.classList.add("active");
      this.currentSection = sectionName;

      // Update browser history
      if (updateHistory) {
        history.pushState({ section: sectionName }, "", `#${sectionName}`);
      }

      // Trigger section-specific updates
      this.handleSectionSwitch(sectionName);
    }
  }

  handleSectionSwitch(sectionName) {
    switch (sectionName) {
      case "inventory":
        if (window.inventoryManager) {
          inventoryManager.loadItems();
          inventoryManager.initializeStatsContainer();
        }
        break;
      case "billing":
        if (window.billingManager) {
          // No specific action needed, billing is ready
        }
        break;
      case "dashboard":
        if (window.dashboardManager) {
          dashboardManager.updateDashboard();
        }
        break;
    }
  }

  handleKeyboardShortcuts(e) {
    // Only handle shortcuts when not in input fields
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.tagName === "SELECT"
    ) {
      return;
    }

    // Ctrl/Cmd + key combinations
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "1":
          e.preventDefault();
          this.switchSection("inventory");
          break;
        case "2":
          e.preventDefault();
          this.switchSection("billing");
          break;
        case "3":
          e.preventDefault();
          this.switchSection("dashboard");
          break;
        case "s":
          e.preventDefault();
          this.exportAllData();
          break;
        case "n":
          e.preventDefault();
          if (this.currentSection === "inventory") {
            inventoryManager.showAddItemForm();
          } else if (this.currentSection === "billing") {
            billingManager.resetSale();
          }
          break;
      }
    }

    // Escape key to close modals/forms
    if (e.key === "Escape") {
      this.handleEscape();
    }
  }

  handleEscape() {
    // Close any open modals
    const modals = document.querySelectorAll(".modal");
    modals.forEach((modal) => {
      if (modal.style.display === "block") {
        modal.style.display = "none";
      }
    });

    // Hide add item form if visible
    const addItemForm = document.getElementById("add-item-form");
    if (addItemForm && addItemForm.style.display !== "none") {
      addItemForm.style.display = "none";
    }

    // Clear search results
    const searchResults = document.getElementById("search-results");
    if (searchResults) {
      searchResults.classList.remove("show");
    }
  }

  loadDemoDataIfEmpty() {
    const inventory = dataManager.getInventory();
    const sales = dataManager.getSales();

    // Load demo data if both inventory and sales are empty
    if (inventory.length === 0 && sales.length === 0) {
      if (confirm("Would you like to load some demo data to get started?")) {
        dataManager.loadDemoData();
        this.showNotification("Demo data loaded successfully!", "success");
      }
    }
  }

  exportAllData() {
    try {
      dataManager.exportData();
      this.showNotification("Data exported successfully!", "success");
    } catch (error) {
      this.showNotification("Failed to export data", "error");
      console.error("Export error:", error);
    }
  }

  autoBackup() {
    try {
      const backupData = {
        inventory: dataManager.getInventory(),
        sales: dataManager.getSales(),
        customers: dataManager.getCustomers(),
        settings: dataManager.getSettings(),
        timestamp: new Date().toISOString(),
      };

      // Store in localStorage with a backup key
      localStorage.setItem("auto_backup", JSON.stringify(backupData));
      console.log("Auto backup completed at", new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Auto backup failed:", error);
    }
  }

  restoreFromBackup() {
    try {
      const backup = localStorage.getItem("auto_backup");
      if (backup) {
        const backupData = JSON.parse(backup);

        if (
          confirm(
            `Restore data from backup created on ${dataManager.formatDate(
              backupData.timestamp
            )}?`
          )
        ) {
          if (backupData.inventory)
            localStorage.setItem(
              "inventory",
              JSON.stringify(backupData.inventory)
            );
          if (backupData.sales)
            localStorage.setItem("sales", JSON.stringify(backupData.sales));
          if (backupData.customers)
            localStorage.setItem(
              "customers",
              JSON.stringify(backupData.customers)
            );
          if (backupData.settings)
            localStorage.setItem(
              "settings",
              JSON.stringify(backupData.settings)
            );

          this.showNotification("Data restored from backup!", "success");
          location.reload(); // Reload to refresh all components
        }
      } else {
        this.showNotification("No backup found", "error");
      }
    } catch (error) {
      this.showNotification("Failed to restore backup", "error");
      console.error("Restore error:", error);
    }
  }

  clearAllData() {
    if (dataManager.clearAllData()) {
      this.showNotification("All data cleared successfully!", "success");
      location.reload(); // Reload to refresh all components
    }
  }

  showAppInfo() {
    const modal = this.createInfoModal();
    document.body.appendChild(modal);
    modal.style.display = "block";
  }

  createInfoModal() {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Sales & Inventory Management System</h3>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div style="padding: 2rem;">
                    <h4>Features:</h4>
                    <ul style="margin: 1rem 0; padding-left: 2rem;">
                        <li>Complete inventory management</li>
                        <li>Point of sale billing system</li>
                        <li>Sales analytics and reporting</li>
                        <li>Customer management</li>
                        <li>Data export and backup</li>
                    </ul>
                    
                    <h4>Keyboard Shortcuts:</h4>
                    <ul style="margin: 1rem 0; padding-left: 2rem;">
                        <li><strong>Ctrl + 1:</strong> Switch to Inventory</li>
                        <li><strong>Ctrl + 2:</strong> Switch to Billing</li>
                        <li><strong>Ctrl + 3:</strong> Switch to Dashboard</li>
                        <li><strong>Ctrl + N:</strong> Add new item / Start new sale</li>
                        <li><strong>Ctrl + S:</strong> Export all data</li>
                        <li><strong>Escape:</strong> Close modals</li>
                    </ul>
                    
                    <h4>Data Storage:</h4>
                    <p style="margin: 1rem 0; color: #6c757d;">
                        All data is stored locally in your browser. 
                        Use the export function to backup your data.
                    </p>
                    
                    <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e9ecef;">
                        <button class="btn btn-primary" onclick="app.exportAllData()">
                            <i class="fas fa-download"></i> Export Data
                        </button>
                        <button class="btn btn-secondary" onclick="app.restoreFromBackup()" style="margin-left: 0.5rem;">
                            <i class="fas fa-undo"></i> Restore Backup
                        </button>
                        <button class="btn btn-danger" onclick="app.clearAllData()" style="margin-left: 0.5rem;">
                            <i class="fas fa-trash"></i> Clear All Data
                        </button>
                    </div>
                </div>
            </div>
        `;

    // Close modal when clicking outside
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    return modal;
  }

  getAppStats() {
    const inventory = dataManager.getInventory();
    const sales = dataManager.getSales();
    const customers = dataManager.getCustomers();

    return {
      totalItems: inventory.length,
      totalSales: sales.length,
      totalCustomers: customers.length,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
      totalProfit: sales.reduce((sum, sale) => sum + sale.profit, 0),
      lowStockItems: dataManager.getLowStockItems().length,
      outOfStockItems: dataManager.getOutOfStockItems().length,
    };
  }

  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${
                  type === "success"
                    ? "fa-check-circle"
                    : type === "error"
                    ? "fa-times-circle"
                    : "fa-info-circle"
                }"></i>
                <span>${message}</span>
            </div>
        `;

    // Add to page
    document.body.appendChild(notification);

    // Style the notification
    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "1rem 1.5rem",
      borderRadius: "8px",
      color: "white",
      fontWeight: "500",
      zIndex: "9999",
      opacity: "0",
      transform: "translateX(100%)",
      transition: "all 0.3s ease",
      backgroundColor:
        type === "success"
          ? "#27ae60"
          : type === "error"
          ? "#e74c3c"
          : "#3498db",
    });

    // Animate in
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateX(0)";
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  // Initialize app settings menu
  initializeAppMenu() {
    const header = document.querySelector(".header");
    const menuButton = document.createElement("button");
    menuButton.className = "btn btn-secondary";
    menuButton.innerHTML = '<i class="fas fa-cog"></i>';
    menuButton.style.marginLeft = "1rem";
    menuButton.addEventListener("click", () => this.showAppInfo());

    const logo = header.querySelector(".logo");
    logo.appendChild(menuButton);
  }

  // Handle URL routing on page load
  handleInitialRoute() {
    const hash = window.location.hash.slice(1);
    if (hash && ["inventory", "billing", "dashboard"].includes(hash)) {
      this.switchSection(hash, false);
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();

  // Add settings menu
  app.initializeAppMenu();

  // Handle initial URL route
  app.handleInitialRoute();

  // Show app stats in console for debugging
  console.log("Sales & Inventory Management System loaded");
  console.log("App Stats:", app.getAppStats());

  // Add global error handler
  window.addEventListener("error", (e) => {
    console.error("Application error:", e.error);
    app.showNotification(
      "An error occurred. Check console for details.",
      "error"
    );
  });
});
