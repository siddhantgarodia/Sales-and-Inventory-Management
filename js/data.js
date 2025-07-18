// Data Management System
class DataManager {
  constructor() {
    this.init();
  }

  init() {
    // Initialize localStorage keys if they don't exist
    if (!localStorage.getItem("inventory")) {
      localStorage.setItem("inventory", JSON.stringify([]));
    }
    if (!localStorage.getItem("sales")) {
      localStorage.setItem("sales", JSON.stringify([]));
    }
    if (!localStorage.getItem("customers")) {
      localStorage.setItem("customers", JSON.stringify([]));
    }
    if (!localStorage.getItem("settings")) {
      localStorage.setItem(
        "settings",
        JSON.stringify({
          companyName: "Your Store Name",
          companyTagline: "Quality Products, Great Service",
          taxRate: 0.18, // 18% GST
          lowStockThreshold: 10,
          gstMode: "inclusive", // 'inclusive' or 'exclusive'
        })
      );
    }
  }

  // Inventory Management
  getInventory() {
    try {
      return JSON.parse(localStorage.getItem("inventory")) || [];
    } catch (error) {
      console.error("Error reading inventory:", error);
      return [];
    }
  }

  saveInventory(inventory) {
    try {
      localStorage.setItem("inventory", JSON.stringify(inventory));
      return true;
    } catch (error) {
      console.error("Error saving inventory:", error);
      return false;
    }
  }

  addItem(item) {
    const inventory = this.getInventory();
    item.id = this.generateId();
    item.createdAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    inventory.push(item);
    return this.saveInventory(inventory);
  }

  updateItem(itemId, updates) {
    const inventory = this.getInventory();
    const index = inventory.findIndex((item) => item.id === itemId);

    if (index !== -1) {
      inventory[index] = {
        ...inventory[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return this.saveInventory(inventory);
    }
    return false;
  }

  deleteItem(itemId) {
    const inventory = this.getInventory();
    const filteredInventory = inventory.filter((item) => item.id !== itemId);
    return this.saveInventory(filteredInventory);
  }

  getItem(itemId) {
    const inventory = this.getInventory();
    return inventory.find((item) => item.id === itemId);
  }

  updateItemQuantity(itemId, newQuantity) {
    return this.updateItem(itemId, { quantity: newQuantity });
  }

  searchItems(query) {
    const inventory = this.getInventory();
    const searchTerm = query.toLowerCase();

    return inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm)
    );
  }

  getItemsByCategory(category) {
    const inventory = this.getInventory();
    return inventory.filter(
      (item) => item.category.toLowerCase() === category.toLowerCase()
    );
  }

  getLowStockItems() {
    const inventory = this.getInventory();
    const settings = this.getSettings();
    return inventory.filter(
      (item) => item.quantity <= settings.lowStockThreshold
    );
  }

  getOutOfStockItems() {
    const inventory = this.getInventory();
    return inventory.filter((item) => item.quantity === 0);
  }

  // Sales Management
  getSales() {
    try {
      return JSON.parse(localStorage.getItem("sales")) || [];
    } catch (error) {
      console.error("Error reading sales:", error);
      return [];
    }
  }

  saveSales(sales) {
    try {
      localStorage.setItem("sales", JSON.stringify(sales));
      return true;
    } catch (error) {
      console.error("Error saving sales:", error);
      return false;
    }
  }

  addSale(sale) {
    const sales = this.getSales();
    sale.id = this.generateId();
    sale.saleDate = new Date().toISOString();
    sale.billNumber = this.generateBillNumber();

    const settings = this.getSettings();

    // Calculate totals based on GST mode
    if (settings.gstMode === "inclusive") {
      // For GST-inclusive pricing: extract GST from selling price
      const totalInclusive = sale.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      sale.total = totalInclusive;
      sale.subtotal = totalInclusive / (1 + settings.taxRate);
      sale.tax = sale.total - sale.subtotal;
    } else {
      // For GST-exclusive pricing: add GST on top of selling price
      sale.subtotal = sale.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      sale.tax = sale.subtotal * settings.taxRate;
      sale.total = sale.subtotal + sale.tax;
    }

    // Calculate profit
    sale.profit = sale.items.reduce((sum, item) => {
      const inventoryItem = this.getItem(item.itemId);
      const itemProfit = inventoryItem
        ? (item.price - inventoryItem.cost) * item.quantity
        : 0;
      return sum + itemProfit;
    }, 0);

    sales.push(sale);

    // Update inventory quantities
    sale.items.forEach((item) => {
      const currentItem = this.getItem(item.itemId);
      if (currentItem) {
        this.updateItemQuantity(
          item.itemId,
          currentItem.quantity - item.quantity
        );
      }
    });

    return this.saveSales(sales);
  }

  getSalesByDateRange(startDate, endDate) {
    const sales = this.getSales();
    const start = new Date(startDate);
    const end = new Date(endDate);

    return sales.filter((sale) => {
      const saleDate = new Date(sale.saleDate);
      return saleDate >= start && saleDate <= end;
    });
  }

  getSalesToday() {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    return this.getSalesByDateRange(startOfDay, endOfDay);
  }

  getSalesThisWeek() {
    const today = new Date();
    const startOfWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay()
    );
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.getSalesByDateRange(startOfWeek, endOfWeek);
  }

  getSalesThisMonth() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    return this.getSalesByDateRange(startOfMonth, endOfMonth);
  }

  getSalesThisYear() {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear() + 1, 0, 1);

    return this.getSalesByDateRange(startOfYear, endOfYear);
  }

  // Customer Management
  getCustomers() {
    try {
      return JSON.parse(localStorage.getItem("customers")) || [];
    } catch (error) {
      console.error("Error reading customers:", error);
      return [];
    }
  }

  saveCustomers(customers) {
    try {
      localStorage.setItem("customers", JSON.stringify(customers));
      return true;
    } catch (error) {
      console.error("Error saving customers:", error);
      return false;
    }
  }

  addCustomer(customer) {
    const customers = this.getCustomers();
    customer.id = this.generateId();
    customer.createdAt = new Date().toISOString();
    customers.push(customer);
    return this.saveCustomers(customers);
  }

  getCustomerByPhone(phone) {
    const customers = this.getCustomers();
    return customers.find((customer) => customer.phone === phone);
  }

  // Settings Management
  getSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem("settings")) || {
        companyName: "Your Store Name",
        companyTagline: "Quality Products, Great Service",
        taxRate: 0.18,
        lowStockThreshold: 10,
        gstMode: "inclusive",
      };

      // Ensure gstMode is set (for backward compatibility)
      if (!settings.gstMode) {
        settings.gstMode = "inclusive";
        this.updateSettings(settings);
      }

      return settings;
    } catch (error) {
      console.error("Error reading settings:", error);
      return {
        companyName: "Your Store Name",
        companyTagline: "Quality Products, Great Service",
        taxRate: 0.18,
        lowStockThreshold: 10,
        gstMode: "inclusive",
      };
    }
  }

  updateSettings(settings) {
    try {
      localStorage.setItem("settings", JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error("Error saving settings:", error);
      return false;
    }
  }

  // Analytics and Reports
  getTotalSalesAmount(period = "all") {
    let sales;

    switch (period) {
      case "today":
        sales = this.getSalesToday();
        break;
      case "week":
        sales = this.getSalesThisWeek();
        break;
      case "month":
        sales = this.getSalesThisMonth();
        break;
      case "year":
        sales = this.getSalesThisYear();
        break;
      default:
        sales = this.getSales();
    }

    return sales.reduce((sum, sale) => sum + sale.total, 0);
  }

  getTotalProfit(period = "all") {
    let sales;

    switch (period) {
      case "today":
        sales = this.getSalesToday();
        break;
      case "week":
        sales = this.getSalesThisWeek();
        break;
      case "month":
        sales = this.getSalesThisMonth();
        break;
      case "year":
        sales = this.getSalesThisYear();
        break;
      default:
        sales = this.getSales();
    }

    return sales.reduce((sum, sale) => sum + sale.profit, 0);
  }

  getTopSellingItems(period = "all", limit = 10) {
    let sales;

    switch (period) {
      case "today":
        sales = this.getSalesToday();
        break;
      case "week":
        sales = this.getSalesThisWeek();
        break;
      case "month":
        sales = this.getSalesThisMonth();
        break;
      case "year":
        sales = this.getSalesThisYear();
        break;
      default:
        sales = this.getSales();
    }

    const itemSales = {};

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!itemSales[item.itemId]) {
          itemSales[item.itemId] = {
            itemId: item.itemId,
            name: item.name,
            totalQuantity: 0,
            totalRevenue: 0,
          };
        }
        itemSales[item.itemId].totalQuantity += item.quantity;
        itemSales[item.itemId].totalRevenue += item.price * item.quantity;
      });
    });

    return Object.values(itemSales)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit);
  }

  getSalesAnalytics(period = "month") {
    const sales =
      period === "today"
        ? this.getSalesToday()
        : period === "week"
        ? this.getSalesThisWeek()
        : period === "month"
        ? this.getSalesThisMonth()
        : this.getSalesThisYear();

    const analytics = {
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
      totalProfit: sales.reduce((sum, sale) => sum + sale.profit, 0),
      averageOrderValue: 0,
      cashSales: 0,
      upiSales: 0,
    };

    if (sales.length > 0) {
      analytics.averageOrderValue = analytics.totalRevenue / sales.length;
    }

    sales.forEach((sale) => {
      if (sale.paymentMode === "cash") {
        analytics.cashSales += sale.total;
      } else if (sale.paymentMode === "upi") {
        analytics.upiSales += sale.total;
      }
    });

    return analytics;
  }

  // Utility Functions
  generateId() {
    return "id_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  generateBillNumber() {
    const sales = this.getSales();
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, "0");
    const day = today.getDate().toString().padStart(2, "0");

    const todaysSales = sales.filter((sale) => {
      const saleDate = new Date(sale.saleDate);
      return saleDate.toDateString() === today.toDateString();
    });

    const billNumber = `INV${year}${month}${day}${(todaysSales.length + 1)
      .toString()
      .padStart(3, "0")}`;
    return billNumber;
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Backup and Restore
  exportData() {
    const data = {
      inventory: this.getInventory(),
      sales: this.getSales(),
      customers: this.getCustomers(),
      settings: this.getSettings(),
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = `inventory_backup_${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();
  }

  importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);

          if (data.inventory)
            localStorage.setItem("inventory", JSON.stringify(data.inventory));
          if (data.sales)
            localStorage.setItem("sales", JSON.stringify(data.sales));
          if (data.customers)
            localStorage.setItem("customers", JSON.stringify(data.customers));
          if (data.settings)
            localStorage.setItem("settings", JSON.stringify(data.settings));

          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("File reading failed"));
      reader.readAsText(file);
    });
  }

  clearAllData() {
    if (
      confirm(
        "Are you sure you want to clear all data? This action cannot be undone."
      )
    ) {
      localStorage.removeItem("inventory");
      localStorage.removeItem("sales");
      localStorage.removeItem("customers");
      localStorage.removeItem("settings");
      this.init();
      return true;
    }
    return false;
  }

  // Demo Data (for testing)
  loadDemoData() {
    const demoItems = [
      {
        name: "Laptop - Dell Inspiron",
        category: "Electronics",
        description: "High-performance laptop for professional use",
        quantity: 15,
        cost: 45000,
        price: 55000,
        image: null,
      },
      {
        name: "Wireless Mouse",
        category: "Electronics",
        description: "Ergonomic wireless mouse with long battery life",
        quantity: 50,
        cost: 800,
        price: 1200,
        image: null,
      },
      {
        name: "Office Chair",
        category: "Furniture",
        description: "Comfortable ergonomic office chair",
        quantity: 8,
        cost: 3500,
        price: 5000,
        image: null,
      },
      {
        name: "Notebook Set",
        category: "Stationery",
        description: "Set of 5 premium notebooks",
        quantity: 100,
        cost: 150,
        price: 250,
        image: null,
      },
    ];

    demoItems.forEach((item) => this.addItem(item));

    console.log("Demo data loaded successfully!");
    return true;
  }
}

// Initialize the data manager
window.dataManager = new DataManager();
