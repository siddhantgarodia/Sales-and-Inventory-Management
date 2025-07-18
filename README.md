# Sales & Inventory Management System

A comprehensive web-based sales and inventory management solution built with HTML, CSS, and JavaScript. Features real-time inventory tracking, point-of-sale billing, and detailed analytics dashboard.

## 🚀 Features

### 📦 Inventory Management

- Add, edit, and delete inventory items
- Upload product images
- Track quantities, cost price, and sales price
- Automatic profit margin calculations
- Low stock alerts
- Category-based filtering and search
- Inventory statistics and reporting

### 💳 Billing System

- Customer information management (name, phone, registration number)
- Real-time item search and selection
- Shopping cart with quantity controls
- Multiple payment modes (Cash & UPI)
- Automatic tax calculations (18% GST)
- Professional invoice generation
- Print functionality for bills
- Automatic inventory updates after sales

### 📊 Analytics Dashboard

- Real-time sales statistics
- Profit tracking and analysis
- Interactive charts and graphs
- Top-selling items analysis
- Sales filtering by time periods (Today, Week, Month, Year)
- Recent sales history
- Export functionality for reports

## 🛠️ Setup Instructions

1. **Download the files** to your computer
2. **Open `index.html`** in any modern web browser
3. **That's it!** The system is ready to use

### Browser Requirements

- Chrome, Firefox, Safari, or Edge (latest versions)
- JavaScript enabled
- Local storage support

## 📖 Usage Guide

### Getting Started

1. **First Launch**: When you open the app for the first time, you'll be asked if you want to load demo data to get started.

2. **Navigation**: Use the tabs at the top to switch between:
   - **Inventory**: Manage your products
   - **Billing**: Process sales
   - **Dashboard**: View analytics

### Inventory Management

#### Adding Items

1. Click "Add New Item" button
2. Fill in the required details:
   - Item name (required)
   - Category
   - Quantity (required)
   - Cost price (required)
   - Sales price (required)
   - Description (optional)
   - Upload image (optional)
3. Click "Save Item"

#### Managing Items

- **Search**: Use the search bar to find items by name, category, or description
- **Filter**: Use the category dropdown to filter items
- **Edit**: Click the "Edit" button on any item card
- **Delete**: Click the "Delete" button (with confirmation)
- **Stock Alerts**: Low stock items are automatically highlighted

### Billing System

#### Processing a Sale

1. Go to the "Billing" section
2. Enter customer details:
   - Customer name (required)
   - Phone number (required)
   - Registration number (optional)
   - Payment mode (required)
3. Search and add items to cart:
   - Type in the search box to find items
   - Click on items to add them to cart
   - Adjust quantities using +/- buttons
4. Review the cart and totals
5. Click "Generate Bill" to create invoice
6. Print or save the sale

#### Customer Management

- Customer details are automatically saved
- Returning customers are auto-filled based on phone number
- Customer purchase history is tracked

### Dashboard Analytics

#### Key Metrics

- **Total Sales**: Revenue for selected period
- **Total Profit**: Profit margins for selected period
- **Total Orders**: Number of transactions
- **Items in Stock**: Current inventory count

#### Charts and Reports

- **Sales Overview**: Line chart showing sales and profit trends
- **Top Selling Items**: Doughnut chart of best-performing products
- **Recent Sales**: Detailed table of recent transactions
- **Period Filters**: View data for Today, Week, Month, or Year

## ⌨️ Keyboard Shortcuts

- `Ctrl + 1`: Switch to Inventory
- `Ctrl + 2`: Switch to Billing
- `Ctrl + 3`: Switch to Dashboard
- `Ctrl + N`: Add new item / Start new sale
- `Ctrl + S`: Export all data
- `Escape`: Close modals and forms

## 💾 Data Management

### Data Storage

- All data is stored locally in your browser's localStorage
- No internet connection required after initial load
- Data persists between browser sessions

### Backup & Export

- **Auto Backup**: System automatically backs up data every 5 minutes
- **Manual Export**: Use Ctrl+S or the settings menu to export data
- **Data Import**: Restore from exported backup files
- **Clear Data**: Option to reset all data (with confirmation)

### Data Security

- Data never leaves your device
- No external servers or accounts required
- Complete privacy and control over your data

## 🎨 Customization

### Company Information

You can customize company details in the settings:

- Company name
- Company tagline
- Tax rate (default: 18% GST)
- Low stock threshold

### Categories

- Categories are created automatically when adding items
- Filter and search by categories
- No limit on number of categories

## 📱 Mobile Support

The system is fully responsive and works on:

- Desktop computers
- Tablets
- Mobile phones
- All screen sizes

## 🔧 Technical Details

### Technologies Used

- **HTML5**: Structure and semantics
- **CSS3**: Modern styling with Flexbox and Grid
- **JavaScript ES6+**: Application logic and functionality
- **Chart.js**: Interactive charts and graphs
- **Font Awesome**: Icons
- **LocalStorage API**: Data persistence

### Architecture

- **Modular Design**: Separate modules for inventory, billing, and dashboard
- **Data Layer**: Centralized data management with DataManager class
- **Responsive UI**: Mobile-first design approach
- **Event-Driven**: Real-time updates across all modules

## 🚨 Troubleshooting

### Common Issues

**Data not saving?**

- Ensure JavaScript is enabled
- Check if localStorage is supported and available
- Try refreshing the page

**Charts not showing?**

- Ensure you have sales data
- Try changing the time period filter
- Check browser console for errors

**Images not displaying?**

- Supported formats: JPG, PNG, GIF, WebP
- Max recommended size: 5MB per image
- Images are stored as base64 in localStorage

**Performance issues?**

- Large amounts of data may slow down the app
- Export and clear old data periodically
- Use modern browser for best performance

### Browser Support

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Support

For questions or issues:

1. Check this README for solutions
2. Review the in-app help (settings gear icon)
3. Check browser console for error messages

---

**Happy Selling! 🛍️**
