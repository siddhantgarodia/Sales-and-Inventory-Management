// Billing System Module
class BillingManager {
  constructor() {
    this.cart = [];
    this.currentCustomer = null;
    this.searchTimeout = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateCartDisplay();
  }

  bindEvents() {
    // New sale button
    document.getElementById("new-sale-btn").addEventListener("click", () => {
      this.resetSale();
    });

    // Customer form inputs
    document
      .getElementById("customer-name")
      .addEventListener("input", this.validateForm.bind(this));
    document
      .getElementById("customer-phone")
      .addEventListener("input", this.validateForm.bind(this));
    document
      .getElementById("payment-mode")
      .addEventListener("change", this.validateForm.bind(this));

    // Item search
    document.getElementById("billing-search").addEventListener("input", (e) => {
      this.handleItemSearch(e.target.value);
    });

    // Generate bill button
    document
      .getElementById("generate-bill-btn")
      .addEventListener("click", () => {
        this.generateBill();
      });

    // Bill modal events
    document.getElementById("close-bill").addEventListener("click", () => {
      this.closeBillModal();
    });

    document.getElementById("print-bill").addEventListener("click", () => {
      this.printBill();
    });

    document.getElementById("save-sale").addEventListener("click", () => {
      this.saveSale();
    });

    // Close modal when clicking outside
    document.getElementById("bill-modal").addEventListener("click", (e) => {
      if (e.target.id === "bill-modal") {
        this.closeBillModal();
      }
    });

    // Auto-fill customer data on phone number change
    document.getElementById("customer-phone").addEventListener("blur", (e) => {
      this.autoFillCustomer(e.target.value);
    });
  }

  resetSale() {
    this.cart = [];
    this.currentCustomer = null;

    // Reset forms
    document.getElementById("customer-form").reset();
    document.getElementById("billing-search").value = "";

    // Hide search results
    document.getElementById("search-results").classList.remove("show");

    // Update displays
    this.updateCartDisplay();
    this.validateForm();

    this.showNotification("New sale started", "success");
  }

  handleItemSearch(query) {
    // Clear previous timeout
    clearTimeout(this.searchTimeout);

    const resultsContainer = document.getElementById("search-results");

    if (!query.trim()) {
      resultsContainer.classList.remove("show");
      return;
    }

    // Debounce search
    this.searchTimeout = setTimeout(() => {
      const items = dataManager.searchItems(query);
      this.displaySearchResults(items);
    }, 300);
  }

  displaySearchResults(items) {
    const resultsContainer = document.getElementById("search-results");

    if (items.length === 0) {
      resultsContainer.innerHTML =
        '<div class="search-result-item">No items found</div>';
      resultsContainer.classList.add("show");
      return;
    }

    const resultsHTML = items
      .map((item) => this.createSearchResultHTML(item))
      .join("");
    resultsContainer.innerHTML = resultsHTML;
    resultsContainer.classList.add("show");

    // Bind click events
    this.bindSearchResultEvents();
  }

  createSearchResultHTML(item) {
    const stockStatus = item.quantity > 0 ? "In Stock" : "Out of Stock";
    const isOutOfStock = item.quantity === 0;

    return `
            <div class="search-result-item ${
              isOutOfStock ? "out-of-stock" : ""
            }" 
                 data-item-id="${item.id}" 
                 ${
                   isOutOfStock
                     ? 'style="opacity: 0.5; cursor: not-allowed;"'
                     : ""
                 }>
                <div class="search-result-image ${
                  item.image ? "" : "no-image"
                }">
                    ${
                      item.image
                        ? `<img src="${item.image}" alt="${item.name}">`
                        : '<i class="fas fa-box"></i>'
                    }
                </div>
                <div class="search-result-info">
                    <div class="search-result-name">${item.name}</div>
                    <div class="search-result-details">
                        <span>${dataManager.formatCurrency(item.price)}</span>
                        <span>Stock: ${item.quantity}</span>
                        <span class="${
                          isOutOfStock ? "text-danger" : "text-success"
                        }">${stockStatus}</span>
                    </div>
                </div>
            </div>
        `;
  }

  bindSearchResultEvents() {
    document.querySelectorAll(".search-result-item").forEach((item) => {
      const itemId = item.dataset.itemId;
      const inventoryItem = dataManager.getItem(itemId);

      if (inventoryItem && inventoryItem.quantity > 0) {
        item.addEventListener("click", () => {
          this.addToCart(inventoryItem);
          document.getElementById("billing-search").value = "";
          document.getElementById("search-results").classList.remove("show");
        });
      }
    });
  }

  addToCart(item) {
    // Check if item already in cart
    const existingItem = this.cart.find(
      (cartItem) => cartItem.itemId === item.id
    );

    if (existingItem) {
      // Check if we can add more
      if (existingItem.quantity < item.quantity) {
        existingItem.quantity++;
        this.showNotification(`Increased ${item.name} quantity`, "success");
      } else {
        this.showNotification(
          `Cannot add more ${item.name}. Maximum stock reached.`,
          "error"
        );
        return;
      }
    } else {
      // Add new item to cart
      this.cart.push({
        itemId: item.id,
        name: item.name,
        price: item.price,
        cost: item.cost,
        image: item.image,
        quantity: 1,
        maxQuantity: item.quantity,
      });
      this.showNotification(`Added ${item.name} to cart`, "success");
    }

    this.updateCartDisplay();
    this.validateForm();
  }

  updateCartDisplay() {
    const cartContainer = document.getElementById("cart-items");

    if (this.cart.length === 0) {
      cartContainer.innerHTML = '<p class="empty-cart">No items in cart</p>';
      this.updateCartSummary();
      return;
    }

    const cartHTML = this.cart
      .map((item) => this.createCartItemHTML(item))
      .join("");
    cartContainer.innerHTML = cartHTML;

    this.bindCartEvents();
    this.updateCartSummary();
  }

  createCartItemHTML(cartItem) {
    const totalPrice = cartItem.price * cartItem.quantity;

    return `
            <div class="cart-item" data-item-id="${cartItem.itemId}">
                <div class="cart-item-image ${
                  cartItem.image ? "" : "no-image"
                }">
                    ${
                      cartItem.image
                        ? `<img src="${cartItem.image}" alt="${cartItem.name}">`
                        : '<i class="fas fa-box"></i>'
                    }
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${cartItem.name}</div>
                    <div class="cart-item-price">${dataManager.formatCurrency(
                      cartItem.price
                    )} each</div>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-control">
                        <button class="quantity-btn minus" data-item-id="${
                          cartItem.itemId
                        }">-</button>
                        <input type="number" class="quantity-input" value="${
                          cartItem.quantity
                        }" 
                               min="1" max="${
                                 cartItem.maxQuantity
                               }" data-item-id="${cartItem.itemId}">
                        <button class="quantity-btn plus" data-item-id="${
                          cartItem.itemId
                        }">+</button>
                    </div>
                    <button class="remove-item" data-item-id="${
                      cartItem.itemId
                    }">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="cart-item-total">${dataManager.formatCurrency(
                  totalPrice
                )}</div>
            </div>
        `;
  }

  bindCartEvents() {
    // Quantity buttons
    document.querySelectorAll(".quantity-btn.minus").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const itemId = e.target.dataset.itemId;
        this.updateCartItemQuantity(itemId, -1);
      });
    });

    document.querySelectorAll(".quantity-btn.plus").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const itemId = e.target.dataset.itemId;
        this.updateCartItemQuantity(itemId, 1);
      });
    });

    // Quantity inputs
    document.querySelectorAll(".quantity-input").forEach((input) => {
      input.addEventListener("change", (e) => {
        const itemId = e.target.dataset.itemId;
        const newQuantity = parseInt(e.target.value);
        this.setCartItemQuantity(itemId, newQuantity);
      });
    });

    // Remove buttons
    document.querySelectorAll(".remove-item").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const itemId = e.target.dataset.itemId;
        this.removeFromCart(itemId);
      });
    });
  }

  updateCartItemQuantity(itemId, change) {
    const cartItem = this.cart.find((item) => item.itemId === itemId);
    if (!cartItem) return;

    const newQuantity = cartItem.quantity + change;
    this.setCartItemQuantity(itemId, newQuantity);
  }

  setCartItemQuantity(itemId, quantity) {
    const cartItem = this.cart.find((item) => item.itemId === itemId);
    if (!cartItem) return;

    if (quantity <= 0) {
      this.removeFromCart(itemId);
      return;
    }

    if (quantity > cartItem.maxQuantity) {
      this.showNotification(
        `Maximum available quantity is ${cartItem.maxQuantity}`,
        "error"
      );
      return;
    }

    cartItem.quantity = quantity;
    this.updateCartDisplay();
  }

  removeFromCart(itemId) {
    const cartItem = this.cart.find((item) => item.itemId === itemId);
    if (!cartItem) return;

    this.cart = this.cart.filter((item) => item.itemId !== itemId);
    this.showNotification(`Removed ${cartItem.name} from cart`, "success");
    this.updateCartDisplay();
    this.validateForm();
  }

  updateCartSummary() {
    const totalInclusive = this.cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const settings = dataManager.getSettings();

    let subtotal, tax, total;

    if (settings.gstMode === "inclusive") {
      // For GST-inclusive pricing: extract GST from selling price
      total = totalInclusive;
      subtotal = totalInclusive / (1 + settings.taxRate);
      tax = total - subtotal;
    } else {
      // For GST-exclusive pricing: add GST on top of selling price
      subtotal = totalInclusive;
      tax = subtotal * settings.taxRate;
      total = subtotal + tax;
    }

    document.getElementById("subtotal").textContent =
      dataManager.formatCurrency(subtotal);
    document.getElementById("tax-amount").textContent =
      dataManager.formatCurrency(tax);
    document.getElementById("total-amount").textContent =
      dataManager.formatCurrency(total);
  }

  validateForm() {
    const customerName = document.getElementById("customer-name").value.trim();
    const customerPhone = document
      .getElementById("customer-phone")
      .value.trim();
    const paymentMode = document.getElementById("payment-mode").value;

    const isValid =
      customerName && customerPhone && paymentMode && this.cart.length > 0;

    document.getElementById("generate-bill-btn").disabled = !isValid;

    return isValid;
  }

  autoFillCustomer(phone) {
    if (!phone) return;

    const customer = dataManager.getCustomerByPhone(phone);
    if (customer) {
      document.getElementById("customer-name").value = customer.name;
      document.getElementById("customer-reg").value = customer.regNumber || "";
      this.showNotification("Customer details auto-filled", "info");
    }
  }

  generateBill() {
    if (!this.validateForm()) {
      this.showNotification("Please fill all required fields", "error");
      return;
    }

    // Get customer data
    const customerData = {
      name: document.getElementById("customer-name").value.trim(),
      phone: document.getElementById("customer-phone").value.trim(),
      regNumber: document.getElementById("customer-reg").value.trim(),
      paymentMode: document.getElementById("payment-mode").value,
    };

    // Generate bill content
    const billData = this.prepareBillData(customerData);
    this.displayBill(billData);

    // Show modal
    document.getElementById("bill-modal").style.display = "block";
  }

  prepareBillData(customerData) {
    const settings = dataManager.getSettings();
    const totalInclusive = this.cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    let subtotal, tax, total;

    if (settings.gstMode === "inclusive") {
      // For GST-inclusive pricing: extract GST from selling price
      total = totalInclusive;
      subtotal = totalInclusive / (1 + settings.taxRate);
      tax = total - subtotal;
    } else {
      // For GST-exclusive pricing: add GST on top of selling price
      subtotal = totalInclusive;
      tax = subtotal * settings.taxRate;
      total = subtotal + tax;
    }

    return {
      billNumber: dataManager.generateBillNumber(),
      date: new Date(),
      customer: customerData,
      items: this.cart,
      subtotal: subtotal,
      tax: tax,
      taxRate: settings.taxRate,
      total: total,
      settings: settings,
    };
  }

  displayBill(billData) {
    const billContent = document.getElementById("bill-content");
    billContent.innerHTML = this.createBillHTML(billData);

    // Store bill data for saving
    this.currentBillData = billData;
  }

  createBillHTML(data) {
    return `
            <div class="bill-header">
                <div class="company-info">
                    <div class="company-name">${data.settings.companyName}</div>
                    <div class="company-tagline">${
                      data.settings.companyTagline
                    }</div>
                </div>
                <div class="bill-number">Invoice #${data.billNumber}</div>
                <div class="bill-date">${dataManager.formatDate(
                  data.date
                )}</div>
            </div>

            <div class="bill-details">
                <div class="bill-section">
                    <h4>Bill To:</h4>
                    <div class="detail-row">
                        <strong>Name:</strong> ${data.customer.name}
                    </div>
                    <div class="detail-row">
                        <strong>Phone:</strong> ${data.customer.phone}
                    </div>
                    ${
                      data.customer.regNumber
                        ? `
                        <div class="detail-row">
                            <strong>Reg No:</strong> ${data.customer.regNumber}
                        </div>
                    `
                        : ""
                    }
                </div>
                <div class="bill-section">
                    <h4>Payment:</h4>
                    <div class="detail-row">
                        <strong>Mode:</strong> 
                        <span class="payment-badge ${
                          data.customer.paymentMode
                        }">
                            ${data.customer.paymentMode.toUpperCase()}
                        </span>
                    </div>
                    <div class="detail-row">
                        <strong>Amount:</strong> ${dataManager.formatCurrency(
                          data.total
                        )}
                    </div>
                </div>
            </div>

            <table class="bill-items">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th class="text-right">Price</th>
                        <th class="text-right">Qty</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items
                      .map(
                        (item) => `
                        <tr>
                            <td>${item.name}</td>
                            <td class="text-right">${dataManager.formatCurrency(
                              item.price
                            )}</td>
                            <td class="text-right">${item.quantity}</td>
                            <td class="text-right item-total">${dataManager.formatCurrency(
                              item.price * item.quantity
                            )}</td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>

            <div class="bill-summary">
                <div class="bill-summary-row">
                    <strong>Subtotal (Pre-GST):</strong>
                    <strong>${dataManager.formatCurrency(
                      data.subtotal
                    )}</strong>
                </div>
                <div class="bill-summary-row">
                    <strong>Tax (GST ${(data.taxRate * 100).toFixed(
                      0
                    )}%):</strong>
                    <strong>${dataManager.formatCurrency(data.tax)}</strong>
                </div>
                <div class="bill-summary-row total">
                    <strong>Total Amount (GST Inclusive):</strong>
                    <strong>${dataManager.formatCurrency(data.total)}</strong>
                </div>
            </div>

            <div class="bill-footer">
                <p>Thank you for your business!</p>
                <p><em>Note: All prices are inclusive of GST</em></p>
                <p>Generated on ${dataManager.formatDate(data.date)}</p>
            </div>
        `;
  }

  printBill() {
    window.print();
  }

  saveSale() {
    if (!this.currentBillData) {
      this.showNotification("No bill data to save", "error");
      return;
    }

    // Prepare sale data
    const saleData = {
      customer: this.currentBillData.customer,
      items: this.currentBillData.items.map((item) => ({
        itemId: item.itemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      paymentMode: this.currentBillData.customer.paymentMode,
      billNumber: this.currentBillData.billNumber,
    };

    // Save customer if new
    const existingCustomer = dataManager.getCustomerByPhone(
      saleData.customer.phone
    );
    if (!existingCustomer) {
      dataManager.addCustomer(saleData.customer);
    }

    // Save sale
    if (dataManager.addSale(saleData)) {
      this.showNotification("Sale saved successfully!", "success");
      this.closeBillModal();
      this.resetSale();

      // Update inventory display if on inventory tab
      if (window.inventoryManager) {
        window.inventoryManager.loadItems();
      }

      // Update dashboard if on dashboard tab
      if (window.dashboardManager) {
        window.dashboardManager.updateDashboard();
      }
    } else {
      this.showNotification("Failed to save sale", "error");
    }
  }

  closeBillModal() {
    document.getElementById("bill-modal").style.display = "none";
    this.currentBillData = null;
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
}

// Initialize billing manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.billingManager = new BillingManager();
});
