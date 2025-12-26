import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, OrderItem } from '../../types/order';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Trash2, Save, X, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface AdminOrderModificationProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminOrderModification({ order, isOpen, onClose }: AdminOrderModificationProps) {
  const { products, updateOrder, addAuditEntry } = useApp();
  const [modifiedItems, setModifiedItems] = useState<OrderItem[]>([...order.items]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    setModifiedItems(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, quantity: Math.max(0, newQuantity) } : item
      )
    );
  };

  const handlePriceChange = (productId: string, newPrice: number) => {
    setModifiedItems(prev =>
      prev.map(item => {
        if (item.productId === productId) {
          const subtotal = newPrice * item.quantity;
          return { ...item, unitPrice: newPrice, subtotal };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId: string) => {
    setModifiedItems(prev => prev.filter(item => item.productId !== productId));
    toast.success('Item removed');
  };

  const handleAddItem = () => {
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    // Check if already exists
    const existingItem = modifiedItems.find(item => item.productId === selectedProductId);
    if (existingItem) {
      toast.error('This item is already in the order. Update the quantity instead.');
      return;
    }

    const newItem: OrderItem = {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: 0,
      subtotal: 0
    };

    setModifiedItems(prev => [...prev, newItem]);
    setSelectedProductId('');
    toast.success('Item added. Set the price.');
  };

  const handleSave = () => {
    if (modifiedItems.length === 0) {
      toast.error('Order must contain at least one item');
      return;
    }

    // Filter out items with 0 quantity
    const validItems = modifiedItems.filter(item => item.quantity > 0);

    if (validItems.length === 0) {
      toast.error('Order must contain at least one item with quantity > 0');
      return;
    }

    // Check if all items have prices
    const allHavePrices = validItems.every(item => item.unitPrice !== undefined && item.unitPrice > 0);
    if (!allHavePrices) {
      toast.error('Please set prices for all items');
      return;
    }

    // Calculate total
    const total = validItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);

    updateOrder(order.id, {
      items: validItems,
      totalAmount: total,
      status: 'waiting_approval'
    });

    addAuditEntry(order.id, {
      action: 'Order Items Modified by Admin',
      user: 'Admin',
      details: `Updated to ${validItems.length} item(s), Total: $${total.toFixed(2)}`
    });

    toast.success('Order updated. Client will review the changes.');
    onClose();
  };

  const availableProducts = products.filter(
    p => !modifiedItems.some(item => item.productId === p.id)
  );

  const total = modifiedItems
    .filter(item => item.quantity > 0)
    .reduce((sum, item) => sum + (item.subtotal || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modify Order #{order.id} (Admin)</DialogTitle>
          <DialogDescription>
            Add/remove items and set pricing. Client will be notified to review changes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Items with Pricing */}
          <div>
            <Label className="mb-3 block">Order Items & Pricing</Label>
            <div className="space-y-2">
              {modifiedItems.map(item => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-gray-600 w-8">Qty:</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(item.productId, parseInt(e.target.value) || 0)
                        }
                        className="w-20 text-center"
                        min="0"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-gray-600">Price:</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                          type="number"
                          value={item.unitPrice || ''}
                          onChange={(e) =>
                            handlePriceChange(item.productId, parseFloat(e.target.value) || 0)
                          }
                          className="w-28 pl-8"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="w-28 text-right">
                      <span className="text-sm text-gray-600">Subtotal:</span>
                      <p className="font-medium text-green-700">
                        ${(item.subtotal || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleRemoveItem(item.productId)}
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {modifiedItems.length === 0 && (
                <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                  No items in order. Add items below.
                </div>
              )}
            </div>
          </div>

          {/* Add New Item */}
          <div className="border-t pt-6">
            <Label className="mb-3 block">Add New Item to Order</Label>
            <div className="flex gap-3">
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a product to add" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      All products already in order
                    </div>
                  ) : (
                    availableProducts.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.description}</p>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddItem}
                disabled={!selectedProductId}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-900">Total Items:</span>
              <Badge variant="secondary" className="text-base">
                {modifiedItems.filter(i => i.quantity > 0).length} items
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-blue-900">Order Total:</span>
              <span className="font-bold text-2xl text-blue-700">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save & Send to Client
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
