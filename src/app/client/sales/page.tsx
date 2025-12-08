'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiClient } from '@/lib/api-client';
import { StockItem, ScrapCategory, ScrapSubCategory, Sale } from '@/lib/types';
import { ShoppingCart, Trash2, Plus, Receipt, CheckCircle, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface CartItem {
  stockItemId: number;
  categoryId: number;
  subCategoryId?: number;
  quantity: number;
  rate: number;
  totalValue: number;
}

export default function SalesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'new-sale' | 'history'>('new-sale');

  // Stock and master data
  const [stock, setStock] = useState<StockItem[]>([]);
  const [categories, setCategories] = useState<ScrapCategory[]>([]);
  const [subCategories, setSubCategories] = useState<ScrapSubCategory[]>([]);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedStock, setSelectedStock] = useState('');
  const [quantity, setQuantity] = useState('');
  const [rate, setRate] = useState('');

  // Filters
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterSubCategoryId, setFilterSubCategoryId] = useState('');
  const [filteredSubCategories, setFilteredSubCategories] = useState<ScrapSubCategory[]>([]);

  // Sale details
  const [buyerName, setBuyerName] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [saleRemarks, setSaleRemarks] = useState('');

  // Success state
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState('');

  // Sales history
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [stockData, cats, subs, sales] = await Promise.all([
        apiClient.getStock(user.id),
        apiClient.getCategories(user.id),
        apiClient.getSubCategories(user.id),
        apiClient.getSales(user.id),
      ]) as [StockItem[], ScrapCategory[], ScrapSubCategory[], Sale[]];

      // Only show stock items with available quantity
      const availableStock = stockData.filter((s: StockItem) => s.availableStock > 0);

      setStock(availableStock);
      setCategories(cats);
      setSubCategories(subs);

      // Filter sales for current user (if needed - adjust based on your requirements)
      setSalesHistory(sales);
    } catch (error) {
      console.error('Error loading sales data:', error);
    }
  };

  const getCategoryName = (catId: number) => {
    return categories.find(c => c.id === catId)?.name || 'N/A';
  };

  const getSubCategoryName = (subId?: number) => {
    if (!subId) return '-';
    return subCategories.find(s => s.id === subId)?.name || '-';
  };

  const getStockItemDetails = (stockId: number) => {
    return stock.find(s => s.id === stockId);
  };

  const getRemainingStock = (stockId: number): number => {
    const stockItem = getStockItemDetails(stockId);
    if (!stockItem) return 0;
    const quantityInCart = cart.filter(item => item.stockItemId === stockId).reduce((sum, item) => sum + item.quantity, 0);
    return stockItem.availableStock - quantityInCart;
  };

  const handleAddToCart = () => {
    if (!selectedStock || !quantity || !rate) return;

    const stockItem = getStockItemDetails(parseInt(selectedStock));
    if (!stockItem) return;

    const qty = parseFloat(quantity);
    const remaining = getRemainingStock(parseInt(selectedStock));
    if (qty > remaining) {
      toast.error(`Not enough stock. Remaining: ${remaining} ${stockItem.unit}`);
      return;
    }

    const cartItem: CartItem = {
      stockItemId: stockItem.id,
      categoryId: stockItem.categoryId,
      subCategoryId: stockItem.subCategoryId,
      quantity: qty,
      rate: parseFloat(rate),
      totalValue: qty * parseFloat(rate),
    };

    setCart([...cart, cartItem]);
    setSelectedStock('');
    setQuantity('');
    setRate('');
  };

  const handleRemoveFromCart = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  const handleStockChange = (stockId: string) => {
    setSelectedStock(stockId);
    const stockItem = getStockItemDetails(parseInt(stockId));
    if (stockItem) {
      setRate(stockItem.averageRate.toString());
    }
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.totalValue, 0);
  };

  const handleCheckout = async () => {
    if (!user || cart.length === 0 || !buyerName) {
      toast.error('Please fill in all required fields and add items to cart');
      return;
    }

    try {
      // Create sale items from cart
      const saleItems = cart.map(item => ({
        categoryId: item.categoryId,
        subCategoryId: item.subCategoryId,
        quantity: item.quantity,
        rate: item.rate,
        totalValue: item.totalValue,
      }));

      const sale = await apiClient.createSale({
        buyerName,
        buyerContact,
        saleItems,
        totalAmount: getCartTotal(),
        remarks: saleRemarks,
        createdBy: user.id,
      }) as any;

      // Show success toast
      toast.success(`Sale completed successfully! Invoice: ${sale.invoiceNumber}`, {
        duration: 5000,
      });

      // Show success message
      setLastInvoiceNumber(sale.invoiceNumber || 'N/A');
      setShowSuccess(true);

      // Reset form
      setCart([]);
      setBuyerName('');
      setBuyerContact('');
      setSaleRemarks('');

      // Reload data to update stock
      await loadData();

      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create sale');
      console.error('Sale creation error:', error);
    }
  };

  const handleCategoryFilterChange = (categoryId: string) => {
    setFilterCategoryId(categoryId);
    setFilterSubCategoryId('');
    if (categoryId) {
      const subs = subCategories.filter(s => s.categoryId === parseInt(categoryId));
      setFilteredSubCategories(subs);
    } else {
      setFilteredSubCategories([]);
    }
  };

  const getFilteredStock = () => {
    let filtered = stock;

    if (filterCategoryId) {
      filtered = filtered.filter(s => s.categoryId === parseInt(filterCategoryId));
    }

    if (filterSubCategoryId) {
      filtered = filtered.filter(s => s.subCategoryId === parseInt(filterSubCategoryId));
    }

    return filtered;
  };

  const handlePrintInvoice = (sale: Sale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${sale.invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; background: white; }
          .invoice-container { max-width: 800px; margin: 0 auto; border: 2px solid #333; padding: 30px; }
          .header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
          .company-name { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 5px; }
          .invoice-title { font-size: 20px; font-weight: bold; margin-top: 10px; }
          .details-section { display: flex; justify-content: space-between; margin: 20px 0; }
          .details-box { flex: 1; }
          .details-box h3 { font-size: 14px; color: #666; margin-bottom: 8px; }
          .details-box p { margin: 4px 0; font-size: 13px; }
          .details-box strong { font-weight: bold; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th { background: #2563eb; color: white; padding: 12px; text-align: left; font-size: 13px; }
          .items-table td { padding: 10px 12px; border-bottom: 1px solid #ddd; font-size: 13px; }
          .items-table tr:last-child td { border-bottom: 2px solid #333; }
          .total-section { margin-top: 20px; text-align: right; }
          .total-row { display: flex; justify-content: flex-end; margin: 8px 0; }
          .total-label { font-size: 16px; margin-right: 20px; }
          .total-amount { font-size: 24px; font-weight: bold; color: #16a34a; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; }
          .footer p { font-size: 12px; color: #666; margin: 4px 0; }
          .remarks-section { margin: 20px 0; padding: 15px; background: #f9fafb; border-left: 4px solid #2563eb; }
          .remarks-section h3 { font-size: 14px; margin-bottom: 8px; color: #333; }
          .remarks-section p { font-size: 13px; color: #666; }
          @media print {
            body { padding: 0; }
            .invoice-container { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="company-name">PrintScrap.ai</div>
            <div style="color: #666; font-size: 14px;">Scrap Management System</div>
            <div class="invoice-title">SALES INVOICE</div>
          </div>

          <div class="details-section">
            <div class="details-box">
              <h3>INVOICE DETAILS</h3>
              <p><strong>Invoice Number:</strong> ${sale.invoiceNumber}</p>
              <p><strong>Date:</strong> ${new Date(sale.saleDate).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    })}</p>
            </div>
            <div class="details-box">
              <h3>BUYER DETAILS</h3>
              <p><strong>Name:</strong> ${sale.buyerName}</p>
              ${sale.buyerContact ? `<p><strong>Contact:</strong> ${sale.buyerContact}</p>` : ''}
            </div>
            <div class="details-box">
              <h3>SELLER DETAILS</h3>
              <p><strong>Company:</strong> ${user?.companyName || 'N/A'}</p>
              ${user?.contactNumber ? `<p><strong>Contact:</strong> ${user.contactNumber}</p>` : ''}
              ${user?.address ? `<p><strong>Address:</strong> ${user.address}</p>` : ''}
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Category</th>
                <th>Sub-Category</th>
                <th>Quantity</th>
                <th>Rate (Rs.)</th>
                <th>Total (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              ${sale.saleItems.map((item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${getCategoryName(item.categoryId)}</td>
                  <td>${getSubCategoryName(item.subCategoryId)}</td>
                  <td>${item.quantity}</td>
                  <td>${item.rate.toFixed(2)}</td>
                  <td>${item.totalValue.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span class="total-label">Grand Total:</span>
              <span class="total-amount">Rs. ${sale.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          ${sale.remarks ? `
            <div class="remarks-section">
              <h3>Remarks:</h3>
              <p>${sale.remarks}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p><strong>Thank you for your business!</strong></p>
            <p>This is a computer-generated invoice and does not require a signature.</p>
            <p style="margin-top: 8px;">Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  };

  const selectedStockItem = selectedStock ? getStockItemDetails(parseInt(selectedStock)) : null;
  const filteredStock = getFilteredStock();

  return (
    <DashboardLayout requiredRole="client">
      <div className="p-3 md:p-6 lg:p-8">
        <div className="mb-4 md:mb-6">
          <h1 className="text-lg md:text-xl font-bold text-gray-900">Sales</h1>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-green-800">
                <CheckCircle className="h-6 w-6" />
                <div>
                  <p className="font-semibold">Sale completed successfully!</p>
                  <p className="text-sm">Invoice Number: {lastInvoiceNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4 md:mb-6">
          <button
            className={`py-1.5 md:py-2 px-3 md:px-4 rounded-full font-medium flex items-center gap-1.5 md:gap-2 text-xs md:text-sm transition-all ${activeTab === 'new-sale'
              ? 'bg-slate-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            onClick={() => setActiveTab('new-sale')}
          >
            <ShoppingCart className="h-3.5 w-3.5 md:h-4 md:w-4" />
            New Sale
          </button>
          <button
            className={`py-1.5 md:py-2 px-3 md:px-4 rounded-full font-medium flex items-center gap-1.5 md:gap-2 text-xs md:text-sm transition-all ${activeTab === 'history'
              ? 'bg-slate-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            onClick={() => setActiveTab('history')}
          >
            <Receipt className="h-3.5 w-3.5 md:h-4 md:w-4" />
            History
          </button>
        </div>

        {/* New Sale Tab */}
        {activeTab === 'new-sale' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Add to Cart */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add Items to Cart</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                    <div>
                      <Label htmlFor="filterCategory">Filter by Category</Label>
                      <Select
                        id="filterCategory"
                        value={filterCategoryId}
                        onChange={(e) => handleCategoryFilterChange(e.target.value)}
                      >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="filterSubCategory">Filter by Sub-Category</Label>
                      <Select
                        id="filterSubCategory"
                        value={filterSubCategoryId}
                        onChange={(e) => setFilterSubCategoryId(e.target.value)}
                        disabled={!filterCategoryId}
                      >
                        <option value="">All Sub-Categories</option>
                        {filteredSubCategories.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="stockItem">Select Stock Item *</Label>
                      <Select
                        id="stockItem"
                        value={selectedStock}
                        onChange={(e) => handleStockChange(e.target.value)}
                      >
                        <option value="">Choose from available stock</option>
                        {filteredStock.map((item) => (
                          <option key={item.id} value={item.id}>
                            {getCategoryName(item.categoryId)} - {getSubCategoryName(item.subCategoryId)}
                            (Available: {item.availableStock} {item.unit})
                          </option>
                        ))}
                      </Select>
                      {filteredStock.length === 0 && (filterCategoryId || filterSubCategoryId) && (
                        <p className="text-sm text-gray-500 mt-1">No stock available for selected filters</p>
                      )}
                    </div>

                    {selectedStockItem && (
                      <div className="md:col-span-2 bg-gray-50 p-3 rounded-md border">
                        <p className="text-sm text-gray-600">
                          Available: <span className="font-semibold">{selectedStockItem.availableStock} {selectedStockItem.unit}</span> |
                          Avg Rate: <span className="font-semibold">Rs.{selectedStockItem.averageRate}</span>
                          {(() => {
                            const remaining = getRemainingStock(selectedStockItem.id);
                            const inCart = selectedStockItem.availableStock - remaining;
                            return (
                              <>
                                {inCart > 0 && (
                                  <span className="ml-2 text-orange-600">
                                    | In Cart: <span className="font-semibold">{inCart}</span>
                                    {' '}→ Remaining: <span className="font-semibold">{remaining} {selectedStockItem.unit}</span>
                                  </span>
                                )}
                                {quantity && parseFloat(quantity) > 0 && (
                                  <span className="ml-2 text-blue-600">
                                    | After This: <span className="font-semibold">{(remaining - parseFloat(quantity)).toFixed(2)} {selectedStockItem.unit}</span>
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </p>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        step="0.01"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Enter quantity"
                        disabled={!selectedStock}
                      />
                    </div>

                    <div>
                      <Label htmlFor="rate">Rate (Rs. per unit) *</Label>
                      <Input
                        id="rate"
                        type="number"
                        step="0.01"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        placeholder="Enter rate"
                        disabled={!selectedStock}
                      />
                    </div>
                  </div>

                  {quantity && rate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-sm font-medium text-blue-900">
                        Item Total: Rs.{(parseFloat(quantity) * parseFloat(rate)).toFixed(2)}
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleAddToCart}
                    disabled={!selectedStock || !quantity || !rate}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>

              {/* Buyer Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Buyer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="buyerName">Buyer Name *</Label>
                    <Input
                      id="buyerName"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Enter buyer name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="buyerContact">Buyer Contact *</Label>
                    <Input
                      id="buyerContact"
                      value={buyerContact}
                      onChange={(e) => setBuyerContact(e.target.value)}
                      placeholder="Phone or email"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="saleRemarks">Remarks</Label>
                    <Textarea
                      id="saleRemarks"
                      value={saleRemarks}
                      onChange={(e) => setSaleRemarks(e.target.value)}
                      placeholder="Optional notes about this sale"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Cart */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Cart ({cart.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Cart is empty</p>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item, index) => (
                        <div key={index} className="border-b pb-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{getCategoryName(item.categoryId)}</p>
                              <p className="text-xs text-gray-600">{getSubCategoryName(item.subCategoryId)}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFromCart(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p>Qty: {item.quantity} × Rs.{item.rate}</p>
                            <p className="font-semibold text-gray-900">Total: Rs.{item.totalValue.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}

                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-semibold">Grand Total:</span>
                          <span className="text-2xl font-bold text-green-600">
                            Rs.{getCartTotal().toFixed(2)}
                          </span>
                        </div>

                        {cart.length > 0 && buyerName && buyerContact && (
                          <Button
                            onClick={handleCheckout}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Receipt className="h-4 w-4 mr-2" />
                            Complete Sale
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Sales History Tab */}
        {activeTab === 'history' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Sales History ({salesHistory.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salesHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No sales yet. Complete your first sale to see it here.</p>
              ) : (
                <div className="space-y-4">
                  {salesHistory.map((sale) => (
                    <Card key={sale.id} className="border">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                            <div>
                              <p className="text-sm text-gray-600">Invoice Number</p>
                              <p className="font-semibold">{sale.invoiceNumber}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Date</p>
                              <p className="font-semibold">{new Date(sale.saleDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Buyer</p>
                              <p className="font-semibold">{sale.buyerName}</p>
                              {sale.buyerContact && <p className="text-sm text-gray-500">{sale.buyerContact}</p>}
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Total Amount</p>
                              <p className="text-xl font-bold text-green-600">Rs.{sale.totalAmount.toFixed(2)}</p>
                            </div>
                          </div>
                          <Button
                            onClick={() => handlePrintInvoice(sale)}
                            variant="outline"
                            size="sm"
                            className="ml-4"
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            Print Invoice
                          </Button>
                        </div>

                        <div className="border-t pt-4">
                          <p className="text-sm font-semibold mb-2">Items Sold:</p>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Category</TableHead>
                                <TableHead>Sub-Category</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead>Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sale.saleItems.map((item, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>{getCategoryName(item.categoryId)}</TableCell>
                                  <TableCell>{getSubCategoryName(item.subCategoryId)}</TableCell>
                                  <TableCell>{item.quantity}</TableCell>
                                  <TableCell>Rs.{item.rate}</TableCell>
                                  <TableCell>Rs.{item.totalValue.toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {sale.remarks && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm text-gray-600">Remarks:</p>
                            <p className="text-sm">{sale.remarks}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
