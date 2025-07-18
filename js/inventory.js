// Inventory Management Module
class InventoryManager {
  constructor() {
    this.currentItems = [];
    this.filteredItems = [];
    this.selectedItem = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadItems();
    this.updateCategoryFilter();
  }

  bindEvents() {
    // Add item button
    document.getElementById("add-item-btn").addEventListener("click", () => {
      this.showAddItemForm();
    });

    // Cancel add item
    document.getElementById("cancel-add").addEventListener("click", () => {
      this.hideAddItemForm();
    });

    // Item form submission
    document.getElementById("item-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleItemSubmit();
    });

    // Image upload preview
    document.getElementById("item-image").addEventListener("change", (e) => {
      this.handleImagePreview(e);
    });

    // Search functionality
    document.getElementById("search-items").addEventListener("input", (e) => {
      this.handleSearch(e.target.value);
    });

    // Category filter
    document
      .getElementById("category-filter")
      .addEventListener("change", (e) => {
        this.handleCategoryFilter(e.target.value);
      });
  }

  showAddItemForm() {
    document.getElementById("add-item-form").style.display = "block";
    document.getElementById("item-form").reset();
    document.getElementById("image-preview").innerHTML = "";
    this.selectedItem = null;

    // Scroll to form
    document.getElementById("add-item-form").scrollIntoView({
      behavior: "smooth",
    });
  }

  hideAddItemForm() {
    document.getElementById("add-item-form").style.display = "none";
    this.selectedItem = null;
  }

  handleImagePreview(event) {
    const file = event.target.files[0];
    const preview = document.getElementById("image-preview");

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px;">
                `;
      };
      reader.readAsDataURL(file);
    } else {
      preview.innerHTML = "";
    }
  }

  handleItemSubmit() {
    const formData = {
      name: document.getElementById("item-name").value.trim(),
      category:
        document.getElementById("item-category").value.trim() || "General",
      description: document.getElementById("item-description").value.trim(),
      quantity: parseInt(document.getElementById("item-quantity").value),
      cost: parseFloat(document.getElementById("item-cost").value),
      price: parseFloat(document.getElementById("item-price").value),
      image: null,
    };

    // Validation
    if (!this.validateItemData(formData)) {
      return;
    }

    // Handle image
    const imageFile = document.getElementById("item-image").files[0];
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        formData.image = e.target.result;
        this.saveItem(formData);
      };
      reader.readAsDataURL(imageFile);
    } else {
      this.saveItem(formData);
    }
  }

  validateItemData(data) {
    if (!data.name) {
      this.showNotification("Item name is required", "error");
      return false;
    }

    if (data.quantity < 0) {
      this.showNotification("Quantity cannot be negative", "error");
      return false;
    }

    if (data.cost < 0) {
      this.showNotification("Cost price cannot be negative", "error");
      return false;
    }

    if (data.price < 0) {
      this.showNotification("Sales price cannot be negative", "error");
      return false;
    }

    if (data.price < data.cost) {
      if (
        !confirm(
          "Sales price is less than cost price. This will result in a loss. Continue?"
        )
      ) {
        return false;
      }
    }

    return true;
  }

  saveItem(itemData) {
    let success = false;

    if (this.selectedItem) {
      // Update existing item
      success = dataManager.updateItem(this.selectedItem.id, itemData);
      if (success) {
        this.showNotification("Item updated successfully", "success");
      }
    } else {
      // Add new item
      success = dataManager.addItem(itemData);
      if (success) {
        this.showNotification("Item added successfully", "success");
      }
    }

    if (success) {
      this.hideAddItemForm();
      this.loadItems();
      this.updateCategoryFilter();
    } else {
      this.showNotification("Failed to save item", "error");
    }
  }

  loadItems() {
    this.currentItems = dataManager.getInventory();
    this.filteredItems = [...this.currentItems];
    this.renderItems();
    this.updateInventoryStats();
  }

  renderItems() {
    const container = document.getElementById("items-grid");

    if (this.filteredItems.length === 0) {
      container.innerHTML = this.getEmptyStateHTML();
      return;
    }

    const itemsHTML = this.filteredItems
      .map((item) => this.createItemCardHTML(item))
      .join("");
    container.innerHTML = itemsHTML;

    // Bind item events
    this.bindItemEvents();
  }

  createItemCardHTML(item) {
    const stockStatus = this.getStockStatus(item.quantity);
    const profitMargin = (((item.price - item.cost) / item.cost) * 100).toFixed(
      1
    );

    return `
            <div class="item-card" data-item-id="${item.id}">
                <div class="stock-status ${stockStatus.class}">${
      stockStatus.text
    }</div>
                
                <div class="item-image ${item.image ? "" : "no-image"}">
                    ${
                      item.image
                        ? `<img src="${item.image}" alt="${item.name}">`
                        : '<i class="fas fa-box"></i>'
                    }
                </div>
                
                <div class="item-info">
                    <h4 class="item-name">${item.name}</h4>
                    <span class="item-category">${item.category}</span>
                    ${
                      item.description
                        ? `<p class="item-description">${item.description}</p>`
                        : ""
                    }
                </div>
                
                <div class="item-details">
                    <div class="detail-item">
                        <div class="detail-label">Quantity</div>
                        <div class="detail-value quantity">${
                          item.quantity
                        }</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Cost</div>
                        <div class="detail-value cost">${dataManager.formatCurrency(
                          item.cost
                        )}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Price (Inc. GST)</div>
                        <div class="detail-value price">${dataManager.formatCurrency(
                          item.price
                        )}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Profit/Unit</div>
                        <div class="detail-value price">${dataManager.formatCurrency(
                          item.price - item.cost
                        )}</div>
                    </div>
                </div>
                
                <div class="profit-margin">
                    <span class="profit-label">Profit Margin</span>
                    <span class="profit-value">${profitMargin}%</span>
                </div>
                
                <div class="item-actions">
                    <button class="btn btn-primary edit-item" data-item-id="${
                      item.id
                    }">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger delete-item" data-item-id="${
                      item.id
                    }">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
  }

  getStockStatus(quantity) {
    const threshold = dataManager.getSettings().lowStockThreshold;

    if (quantity === 0) {
      return { class: "out-of-stock", text: "Out of Stock" };
    } else if (quantity <= threshold) {
      return { class: "low-stock", text: "Low Stock" };
    } else {
      return { class: "in-stock", text: "In Stock" };
    }
  }

  getEmptyStateHTML() {
    return `
            <div class="empty-inventory">
                <i class="fas fa-boxes"></i>
                <h3>No Items Found</h3>
                <p>Start by adding your first inventory item</p>
                <button class="btn btn-primary" onclick="inventoryManager.showAddItemForm()">
                    <i class="fas fa-plus"></i> Add First Item
                </button>
            </div>
        `;
  }

  bindItemEvents() {
    // Edit item buttons
    document.querySelectorAll(".edit-item").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const itemId = e.target.closest(".edit-item").dataset.itemId;
        this.editItem(itemId);
      });
    });

    // Delete item buttons
    document.querySelectorAll(".delete-item").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const itemId = e.target.closest(".delete-item").dataset.itemId;
        this.deleteItem(itemId);
      });
    });
  }

  editItem(itemId) {
    const item = dataManager.getItem(itemId);
    if (!item) {
      this.showNotification("Item not found", "error");
      return;
    }

    this.selectedItem = item;
    this.populateEditForm(item);
    this.showAddItemForm();
  }

  populateEditForm(item) {
    document.getElementById("item-name").value = item.name;
    document.getElementById("item-category").value = item.category;
    document.getElementById("item-description").value = item.description || "";
    document.getElementById("item-quantity").value = item.quantity;
    document.getElementById("item-cost").value = item.cost;
    document.getElementById("item-price").value = item.price;

    const preview = document.getElementById("image-preview");
    if (item.image) {
      preview.innerHTML = `<img src="${item.image}" alt="Current image">`;
    } else {
      preview.innerHTML = "";
    }

    // Update form title
    document.querySelector("#add-item-form h3").textContent = "Edit Item";
  }

  deleteItem(itemId) {
    const item = dataManager.getItem(itemId);
    if (!item) {
      this.showNotification("Item not found", "error");
      return;
    }

    if (
      confirm(
        `Are you sure you want to delete "${item.name}"? This action cannot be undone.`
      )
    ) {
      if (dataManager.deleteItem(itemId)) {
        this.showNotification("Item deleted successfully", "success");
        this.loadItems();
        this.updateCategoryFilter();
      } else {
        this.showNotification("Failed to delete item", "error");
      }
    }
  }

  handleSearch(query) {
    if (!query.trim()) {
      this.filteredItems = [...this.currentItems];
    } else {
      this.filteredItems = dataManager.searchItems(query);
    }
    this.renderItems();
  }

  handleCategoryFilter(category) {
    if (!category) {
      this.filteredItems = [...this.currentItems];
    } else {
      this.filteredItems = this.currentItems.filter(
        (item) => item.category.toLowerCase() === category.toLowerCase()
      );
    }
    this.renderItems();
  }

  updateCategoryFilter() {
    const categories = [
      ...new Set(this.currentItems.map((item) => item.category)),
    ];
    const filterSelect = document.getElementById("category-filter");

    // Keep current selection
    const currentValue = filterSelect.value;

    filterSelect.innerHTML = '<option value="">All Categories</option>';
    categories.forEach((category) => {
      filterSelect.innerHTML += `<option value="${category}">${category}</option>`;
    });

    // Restore selection if it still exists
    if (categories.includes(currentValue)) {
      filterSelect.value = currentValue;
    }
  }

  updateInventoryStats() {
    const inventory = this.currentItems;
    const lowStockItems = dataManager.getLowStockItems();
    const outOfStockItems = dataManager.getOutOfStockItems();

    const totalItems = inventory.length;
    const totalValue = inventory.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const totalCost = inventory.reduce(
      (sum, item) => sum + item.cost * item.quantity,
      0
    );
    const potentialProfit = totalValue - totalCost;

    // Update stats if stats container exists
    const statsContainer = document.querySelector(".inventory-stats");
    if (statsContainer) {
      statsContainer.innerHTML = `
                <div class="inventory-stat">
                    <h4>Total Items</h4>
                    <div class="stat-number">${totalItems}</div>
                </div>
                <div class="inventory-stat">
                    <h4>Inventory Value</h4>
                    <div class="stat-number">${dataManager.formatCurrency(
                      totalValue
                    )}</div>
                </div>
                <div class="inventory-stat">
                    <h4>Low Stock Items</h4>
                    <div class="stat-number">${lowStockItems.length}</div>
                </div>
                <div class="inventory-stat">
                    <h4>Out of Stock</h4>
                    <div class="stat-number">${outOfStockItems.length}</div>
                </div>
            `;
    }

    // Show low stock alert if needed
    this.showLowStockAlert(lowStockItems);
  }

  showLowStockAlert(lowStockItems) {
    const existingAlert = document.querySelector(".low-stock-alert");
    if (existingAlert) {
      existingAlert.remove();
    }

    if (lowStockItems.length > 0) {
      const alertHTML = `
                <div class="low-stock-alert">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div class="alert-content">
                        <h4>Low Stock Alert</h4>
                        <p>${lowStockItems.length} items are running low on stock</p>
                    </div>
                </div>
            `;

      const container = document.querySelector(".items-container");
      container.insertAdjacentHTML("afterbegin", alertHTML);
    }
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

  // Bulk operations
  exportInventory() {
    const inventory = dataManager.getInventory();
    const csvContent = this.convertToCSV(inventory);

    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  }

  convertToCSV(data) {
    const headers = [
      "Name",
      "Category",
      "Description",
      "Quantity",
      "Cost",
      "Price",
      "Profit Margin",
    ];
    const rows = data.map((item) => [
      item.name,
      item.category,
      item.description || "",
      item.quantity,
      item.cost,
      item.price,
      (((item.price - item.cost) / item.cost) * 100).toFixed(2) + "%",
    ]);

    return [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
  }

  // Initialize stats container on inventory section
  initializeStatsContainer() {
    const inventorySection = document.getElementById("inventory");
    const existingStats = inventorySection.querySelector(".inventory-stats");

    if (!existingStats) {
      const statsHTML = `
                <div class="inventory-stats">
                    <!-- Stats will be populated here -->
                </div>
            `;

      const sectionHeader = inventorySection.querySelector(".section-header");
      sectionHeader.insertAdjacentHTML("afterend", statsHTML);
    }
  }
}

// Initialize inventory manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.inventoryManager = new InventoryManager();
});
