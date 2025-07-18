// Dashboard Module
class DashboardManager {
  constructor() {
    this.salesChart = null;
    this.itemsChart = null;
    this.currentPeriod = "month";
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateDashboard();
  }

  bindEvents() {
    // Period filter
    document.getElementById("period-filter").addEventListener("change", (e) => {
      this.currentPeriod = e.target.value;
      this.updateDashboard();
    });

    // Export buttons
    document
      .getElementById("export-excel-btn")
      .addEventListener("click", () => {
        this.exportToExcel();
      });

    document
      .getElementById("export-detailed-btn")
      .addEventListener("click", () => {
        this.exportDetailedReport();
      });
  }

  updateDashboard() {
    this.updateStats();
    this.updateCharts();
    this.updateRecentSales();
  }

  updateStats() {
    const analytics = dataManager.getSalesAnalytics(this.currentPeriod);
    const inventory = dataManager.getInventory();
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);

    // Update stat cards
    document.getElementById("total-sales").textContent =
      dataManager.formatCurrency(analytics.totalRevenue);
    document.getElementById("total-profit").textContent =
      dataManager.formatCurrency(analytics.totalProfit);
    document.getElementById("total-orders").textContent = analytics.totalSales;
    document.getElementById("total-items").textContent = totalItems;

    // Add trend indicators if you want to show changes
    this.updateTrendIndicators(analytics);
  }

  updateTrendIndicators(analytics) {
    // You can add trend calculations here comparing with previous period
    // For now, we'll keep it simple
  }

  updateCharts() {
    this.updateSalesChart();
    this.updateItemsChart();
  }

  updateSalesChart() {
    const chartData = this.getSalesChartData();
    const ctx = document.getElementById("sales-chart").getContext("2d");

    // Destroy existing chart if it exists
    if (this.salesChart) {
      this.salesChart.destroy();
    }

    this.salesChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: "Sales",
            data: chartData.sales,
            borderColor: "#3498db",
            backgroundColor: "rgba(52, 152, 219, 0.1)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Profit",
            data: chartData.profit,
            borderColor: "#27ae60",
            backgroundColor: "rgba(39, 174, 96, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: function (context) {
                return (
                  context.dataset.label +
                  ": " +
                  dataManager.formatCurrency(context.parsed.y)
                );
              },
            },
          },
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: this.getXAxisLabel(),
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: "Amount (₹)",
            },
            ticks: {
              callback: function (value) {
                return "₹" + value.toLocaleString();
              },
            },
          },
        },
        interaction: {
          mode: "nearest",
          axis: "x",
          intersect: false,
        },
      },
    });
  }

  getSalesChartData() {
    let sales, labels, groupBy;

    switch (this.currentPeriod) {
      case "today":
        sales = dataManager.getSalesToday();
        labels = this.getHourlyLabels();
        groupBy = "hour";
        break;
      case "week":
        sales = dataManager.getSalesThisWeek();
        labels = this.getDailyLabels(7);
        groupBy = "day";
        break;
      case "month":
        sales = dataManager.getSalesThisMonth();
        labels = this.getDailyLabels(30);
        groupBy = "day";
        break;
      case "year":
        sales = dataManager.getSalesThisYear();
        labels = this.getMonthlyLabels();
        groupBy = "month";
        break;
      default:
        sales = dataManager.getSales();
        labels = this.getMonthlyLabels();
        groupBy = "month";
    }

    return this.groupSalesData(sales, labels, groupBy);
  }

  getHourlyLabels() {
    const labels = [];
    for (let i = 0; i < 24; i++) {
      labels.push(`${i.toString().padStart(2, "0")}:00`);
    }
    return labels;
  }

  getDailyLabels(days) {
    const labels = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      labels.push(
        date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
      );
    }

    return labels;
  }

  getMonthlyLabels() {
    const labels = [];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const currentMonth = new Date().getMonth();

    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth - 11 + i + 12) % 12;
      labels.push(months[monthIndex]);
    }

    return labels;
  }

  groupSalesData(sales, labels, groupBy) {
    const salesData = new Array(labels.length).fill(0);
    const profitData = new Array(labels.length).fill(0);

    sales.forEach((sale) => {
      const saleDate = new Date(sale.saleDate);
      let index;

      switch (groupBy) {
        case "hour":
          index = saleDate.getHours();
          break;
        case "day":
          if (this.currentPeriod === "week") {
            const today = new Date();
            const diffTime = today - saleDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            index = 6 - diffDays;
          } else {
            const today = new Date();
            const diffTime = today - saleDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            index = 29 - diffDays;
          }
          break;
        case "month":
          const currentMonth = new Date().getMonth();
          const saleMonth = saleDate.getMonth();
          index = (saleMonth - currentMonth + 12) % 12;
          break;
      }

      if (index >= 0 && index < labels.length) {
        salesData[index] += sale.total;
        profitData[index] += sale.profit;
      }
    });

    return {
      labels: labels,
      sales: salesData,
      profit: profitData,
    };
  }

  getXAxisLabel() {
    switch (this.currentPeriod) {
      case "today":
        return "Hours";
      case "week":
        return "Days";
      case "month":
        return "Days";
      case "year":
        return "Months";
      default:
        return "Time";
    }
  }

  updateItemsChart() {
    const topItems = dataManager.getTopSellingItems(this.currentPeriod, 5);
    const ctx = document.getElementById("items-chart").getContext("2d");

    // Destroy existing chart if it exists
    if (this.itemsChart) {
      this.itemsChart.destroy();
    }

    if (topItems.length === 0) {
      this.renderEmptyChart(ctx, "No sales data available");
      return;
    }

    const colors = ["#3498db", "#27ae60", "#f39c12", "#e74c3c", "#9b59b6"];

    this.itemsChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: topItems.map((item) => item.name),
        datasets: [
          {
            data: topItems.map((item) => item.totalQuantity),
            backgroundColor: colors.slice(0, topItems.length),
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const item = topItems[context.dataIndex];
                return `${context.label}: ${
                  context.parsed
                } units (${dataManager.formatCurrency(item.totalRevenue)})`;
              },
            },
          },
        },
      },
    });
  }

  renderEmptyChart(ctx, message) {
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw empty state
    ctx.fillStyle = "#6c757d";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(message, ctx.canvas.width / 2, ctx.canvas.height / 2);
  }

  updateRecentSales() {
    let sales;

    switch (this.currentPeriod) {
      case "today":
        sales = dataManager.getSalesToday();
        break;
      case "week":
        sales = dataManager.getSalesThisWeek();
        break;
      case "month":
        sales = dataManager.getSalesThisMonth();
        break;
      case "year":
        sales = dataManager.getSalesThisYear();
        break;
      default:
        sales = dataManager.getSales();
    }

    // Sort by date (newest first) and limit to 10
    sales = sales
      .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
      .slice(0, 10);

    const tableContainer = document.getElementById("sales-table");

    if (sales.length === 0) {
      tableContainer.innerHTML = this.getEmptyTableHTML();
      return;
    }

    tableContainer.innerHTML = this.createSalesTableHTML(sales);
  }

  createSalesTableHTML(sales) {
    return `
            <table>
                <thead>
                    <tr>
                        <th>Bill No.</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Amount</th>
                        <th>Profit</th>
                        <th>Payment</th>
                    </tr>
                </thead>
                <tbody>
                    ${sales
                      .map(
                        (sale) => `
                        <tr>
                            <td>${sale.billNumber}</td>
                            <td class="customer-name">${sale.customer.name}</td>
                            <td class="date">${dataManager.formatDate(
                              sale.saleDate
                            )}</td>
                            <td>${sale.items.length} item${
                          sale.items.length > 1 ? "s" : ""
                        }</td>
                            <td class="amount">${dataManager.formatCurrency(
                              sale.total
                            )}</td>
                            <td class="profit">${dataManager.formatCurrency(
                              sale.profit
                            )}</td>
                            <td>
                                <span class="payment-method ${
                                  sale.paymentMode
                                }">
                                    ${sale.paymentMode.toUpperCase()}
                                </span>
                            </td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        `;
  }

  getEmptyTableHTML() {
    return `
            <div class="empty-dashboard">
                <i class="fas fa-chart-bar"></i>
                <h3>No Sales Data</h3>
                <p>No sales found for the selected period</p>
                <button class="btn btn-primary" onclick="app.switchSection('billing')">
                    <i class="fas fa-plus"></i> Make First Sale
                </button>
            </div>
        `;
  }

  // Export functionality
  exportSalesReport() {
    let sales;

    switch (this.currentPeriod) {
      case "today":
        sales = dataManager.getSalesToday();
        break;
      case "week":
        sales = dataManager.getSalesThisWeek();
        break;
      case "month":
        sales = dataManager.getSalesThisMonth();
        break;
      case "year":
        sales = dataManager.getSalesThisYear();
        break;
      default:
        sales = dataManager.getSales();
    }

    if (sales.length === 0) {
      this.showNotification("No sales data to export", "error");
      return;
    }

    const csvContent = this.convertSalesToCSV(sales);

    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `sales_report_${this.currentPeriod}_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();

    this.showNotification("Sales report exported successfully", "success");
  }

  convertSalesToCSV(sales) {
    const headers = [
      "Bill Number",
      "Date",
      "Customer Name",
      "Customer Phone",
      "Items Count",
      "Subtotal",
      "Tax",
      "Total",
      "Profit",
      "Payment Mode",
    ];

    const rows = sales.map((sale) => [
      sale.billNumber,
      dataManager.formatDate(sale.saleDate),
      sale.customer.name,
      sale.customer.phone,
      sale.items.length,
      sale.subtotal,
      sale.tax,
      sale.total,
      sale.profit,
      sale.paymentMode,
    ]);

    return [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
  }

  // Excel Export Functionality
  exportToExcel() {
    try {
      let sales;

      switch (this.currentPeriod) {
        case "today":
          sales = dataManager.getSalesToday();
          break;
        case "week":
          sales = dataManager.getSalesThisWeek();
          break;
        case "month":
          sales = dataManager.getSalesThisMonth();
          break;
        case "year":
          sales = dataManager.getSalesThisYear();
          break;
        default:
          sales = dataManager.getSales();
      }

      if (sales.length === 0) {
        this.showNotification("No sales data to export", "error");
        return;
      }

      // Create workbook with multiple sheets
      const workbook = XLSX.utils.book_new();

      // Sales Summary Sheet
      this.addSalesSummarySheet(workbook, sales);

      // Detailed Sales Sheet
      this.addDetailedSalesSheet(workbook, sales);

      // Items Analysis Sheet
      this.addItemsAnalysisSheet(workbook, sales);

      // Customer Analysis Sheet
      this.addCustomerAnalysisSheet(workbook, sales);

      // Export the workbook
      const fileName = `Sales_Report_${this.currentPeriod}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(workbook, fileName);

      this.showNotification("Excel report exported successfully!", "success");
    } catch (error) {
      console.error("Excel export error:", error);
      this.showNotification("Failed to export Excel file", "error");
    }
  }

  addSalesSummarySheet(workbook, sales) {
    const analytics = dataManager.getSalesAnalytics(this.currentPeriod);
    const inventory = dataManager.getInventory();

    const summaryData = [
      ["SALES SUMMARY REPORT"],
      ["Period:", this.currentPeriod.toUpperCase()],
      ["Generated:", new Date().toLocaleString()],
      [""],
      ["KEY METRICS"],
      ["Total Sales:", analytics.totalSales],
      ["Total Revenue:", dataManager.formatCurrency(analytics.totalRevenue)],
      ["Total Profit:", dataManager.formatCurrency(analytics.totalProfit)],
      [
        "Average Order Value:",
        dataManager.formatCurrency(analytics.averageOrderValue),
      ],
      ["Cash Sales:", dataManager.formatCurrency(analytics.cashSales)],
      ["UPI Sales:", dataManager.formatCurrency(analytics.upiSales)],
      [""],
      ["INVENTORY STATUS"],
      ["Total Items:", inventory.length],
      [
        "Items in Stock:",
        inventory.reduce((sum, item) => sum + item.quantity, 0),
      ],
      ["Low Stock Items:", dataManager.getLowStockItems().length],
      ["Out of Stock Items:", dataManager.getOutOfStockItems().length],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(summaryData);

    // Style the header
    worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Summary");
  }

  addDetailedSalesSheet(workbook, sales) {
    const detailedData = [
      [
        "Bill No",
        "Date",
        "Time",
        "Customer Name",
        "Phone",
        "Reg No",
        "Payment Mode",
        "Items Count",
        "Subtotal",
        "Tax",
        "Total",
        "Profit",
        "Profit %",
      ],
    ];

    sales.forEach((sale) => {
      const saleDate = new Date(sale.saleDate);
      const profitPercent =
        sale.subtotal > 0
          ? ((sale.profit / sale.subtotal) * 100).toFixed(2)
          : 0;

      detailedData.push([
        sale.billNumber,
        saleDate.toLocaleDateString(),
        saleDate.toLocaleTimeString(),
        sale.customer.name,
        sale.customer.phone,
        sale.customer.regNumber || "",
        sale.paymentMode.toUpperCase(),
        sale.items.length,
        sale.subtotal,
        sale.tax,
        sale.total,
        sale.profit,
        profitPercent + "%",
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(detailedData);

    // Auto-width columns
    const colWidths = detailedData[0].map((_, i) => {
      const maxLength = Math.max(
        ...detailedData.map((row) => String(row[i] || "").length)
      );
      return { wch: Math.min(maxLength + 2, 30) };
    });
    worksheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Detailed Sales");
  }

  addItemsAnalysisSheet(workbook, sales) {
    const topItems = dataManager.getTopSellingItems(this.currentPeriod, 50);

    const itemsData = [
      ["ITEMS ANALYSIS"],
      [""],
      ["Item Name", "Total Quantity Sold", "Total Revenue", "Average Price"],
    ];

    topItems.forEach((item) => {
      const avgPrice =
        item.totalQuantity > 0 ? item.totalRevenue / item.totalQuantity : 0;
      itemsData.push([
        item.name,
        item.totalQuantity,
        item.totalRevenue,
        avgPrice.toFixed(2),
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(itemsData);

    // Merge header
    worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Items Analysis");
  }

  addCustomerAnalysisSheet(workbook, sales) {
    const customerData = {};

    sales.forEach((sale) => {
      const phone = sale.customer.phone;
      if (!customerData[phone]) {
        customerData[phone] = {
          name: sale.customer.name,
          phone: phone,
          totalOrders: 0,
          totalSpent: 0,
          firstOrder: sale.saleDate,
          lastOrder: sale.saleDate,
        };
      }

      customerData[phone].totalOrders++;
      customerData[phone].totalSpent += sale.total;

      if (new Date(sale.saleDate) < new Date(customerData[phone].firstOrder)) {
        customerData[phone].firstOrder = sale.saleDate;
      }
      if (new Date(sale.saleDate) > new Date(customerData[phone].lastOrder)) {
        customerData[phone].lastOrder = sale.saleDate;
      }
    });

    const customers = Object.values(customerData).sort(
      (a, b) => b.totalSpent - a.totalSpent
    );

    const customerAnalysisData = [
      ["CUSTOMER ANALYSIS"],
      [""],
      [
        "Customer Name",
        "Phone",
        "Total Orders",
        "Total Spent",
        "Avg Order Value",
        "First Order",
        "Last Order",
      ],
    ];

    customers.forEach((customer) => {
      const avgOrderValue =
        customer.totalOrders > 0
          ? customer.totalSpent / customer.totalOrders
          : 0;
      customerAnalysisData.push([
        customer.name,
        customer.phone,
        customer.totalOrders,
        customer.totalSpent,
        avgOrderValue.toFixed(2),
        new Date(customer.firstOrder).toLocaleDateString(),
        new Date(customer.lastOrder).toLocaleDateString(),
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(customerAnalysisData);

    // Merge header
    worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Analysis");
  }

  exportDetailedReport() {
    try {
      // Create comprehensive report with charts and analysis
      this.generateAdvancedReport();
    } catch (error) {
      console.error("Detailed report error:", error);
      this.showNotification("Failed to generate detailed report", "error");
    }
  }

  generateAdvancedReport() {
    const reportWindow = window.open("", "_blank");
    const analytics = dataManager.getSalesAnalytics(this.currentPeriod);
    const topItems = dataManager.getTopSellingItems(this.currentPeriod, 10);
    const topCustomers = this.getTopCustomers(dataManager.getSales(), 10);

    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Advanced Sales Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3498db; padding-bottom: 20px; }
          .section { margin: 30px 0; }
          .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
          .metric-card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; text-align: center; }
          .metric-value { font-size: 2em; font-weight: bold; color: #3498db; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .table th { background-color: #f8f9fa; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Advanced Sales Report</h1>
          <p>Period: ${this.currentPeriod.toUpperCase()} | Generated: ${new Date().toLocaleString()}</p>
          <button class="no-print" onclick="window.print()">Print Report</button>
        </div>

        <div class="section">
          <h2>Key Performance Metrics</h2>
          <div class="metrics">
            <div class="metric-card">
              <div class="metric-value">${analytics.totalSales}</div>
              <div>Total Orders</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${dataManager.formatCurrency(
                analytics.totalRevenue
              )}</div>
              <div>Total Revenue</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${dataManager.formatCurrency(
                analytics.totalProfit
              )}</div>
              <div>Total Profit</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${dataManager.formatCurrency(
                analytics.averageOrderValue
              )}</div>
              <div>Average Order Value</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Top Selling Items</h2>
          <table class="table">
            <thead>
              <tr><th>Item</th><th>Quantity Sold</th><th>Revenue</th></tr>
            </thead>
            <tbody>
              ${topItems
                .map(
                  (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.totalQuantity}</td>
                  <td>${dataManager.formatCurrency(item.totalRevenue)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Top Customers</h2>
          <table class="table">
            <thead>
              <tr><th>Customer</th><th>Orders</th><th>Total Spent</th></tr>
            </thead>
            <tbody>
              ${topCustomers
                .map(
                  (customer) => `
                <tr>
                  <td>${customer.name}</td>
                  <td>${customer.orderCount}</td>
                  <td>${dataManager.formatCurrency(customer.totalSpent)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;

    reportWindow.document.write(reportHTML);
    reportWindow.document.close();

    this.showNotification("Advanced report generated in new window", "success");
  }

  // Additional analytics
  getAdvancedAnalytics() {
    const sales = dataManager.getSales();

    if (sales.length === 0) {
      return null;
    }

    const analytics = {
      averageOrderValue:
        sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length,
      totalCustomers: new Set(sales.map((sale) => sale.customer.phone)).size,
      profitMargin:
        (sales.reduce((sum, sale) => sum + sale.profit, 0) /
          sales.reduce((sum, sale) => sum + sale.total, 0)) *
        100,
      paymentMethods: {
        cash: sales.filter((sale) => sale.paymentMode === "cash").length,
        upi: sales.filter((sale) => sale.paymentMode === "upi").length,
      },
      topCustomers: this.getTopCustomers(sales),
      salesGrowth: this.calculateGrowth(sales),
    };

    return analytics;
  }

  getTopCustomers(sales, limit = 5) {
    const customerSales = {};

    sales.forEach((sale) => {
      const phone = sale.customer.phone;
      if (!customerSales[phone]) {
        customerSales[phone] = {
          name: sale.customer.name,
          phone: phone,
          totalSpent: 0,
          orderCount: 0,
        };
      }
      customerSales[phone].totalSpent += sale.total;
      customerSales[phone].orderCount += 1;
    });

    return Object.values(customerSales)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  }

  calculateGrowth(sales) {
    // Calculate month-over-month growth
    const currentMonth = dataManager.getSalesThisMonth();
    const lastMonth = this.getLastMonthSales();

    const currentTotal = currentMonth.reduce(
      (sum, sale) => sum + sale.total,
      0
    );
    const lastTotal = lastMonth.reduce((sum, sale) => sum + sale.total, 0);

    const growth =
      lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0;

    return {
      currentMonth: currentTotal,
      lastMonth: lastTotal,
      growthPercentage: growth,
    };
  }

  getLastMonthSales() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    return dataManager.getSalesByDateRange(lastMonth, endLastMonth);
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

// Initialize dashboard manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.dashboardManager = new DashboardManager();
});
