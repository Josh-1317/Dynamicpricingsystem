import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Order, OrderItem } from '../../types/order';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface OrderModificationDialogProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderModificationDialog({ order, isOpen, onClose }: OrderModificationDialogProps) {
  const { products, updateOrder, addAuditEntry } = useApp();
  const { currentUser } = useAuth();
  const [modifiedItems, setModifiedItems] = useState<OrderItem[]>([...order.items]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    setModifiedItems(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, quantity: Math.max(0, newQuantity) } : item
      )
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
      toast.error('This item is already in your order. Update the quantity instead.');
      return;
    }

    const newItem: OrderItem = {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: undefined,
      subtotal: undefined
    };

    setModifiedItems(prev => [...prev, newItem]);
    setSelectedProductId('');
    toast.success('Item added to order');
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

    // Reset pricing for all items
    const itemsWithoutPricing = validItems.map(item => ({
      ...item,
      unitPrice: undefined,
      subtotal: undefined
    }));

    updateOrder(order.id, {
      items: itemsWithoutPricing,
      status: 'pending_pricing',
      totalAmount: undefined
    });

    addAuditEntry(order.id, {
      action: 'Order Modified',
      user: currentUser?.name || 'Client',
      details: `Updated to ${validItems.length} item(s)`
    });

    toast.success('Order modified. Admin will review and update pricing.');
    onClose();
  };

  const availableProducts = products.filter(
    p => !modifiedItems.some(item => item.productId === p.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modify Order #{order.id}</DialogTitle>
          <DialogDescription>
            Add new items, remove existing ones, or adjust quantities. Prices will be re-calculated by admin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Items */}
          <div>
            <Label className="mb-3 block">Current Items</Label>
            <div className="space-y-2">
              {modifiedItems.map(item => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-gray-600">Qty:</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleQuantityChange(item.productId, parseInt(e.target.value) || 0)
                      }
                      className="w-24 text-center"
                      min="0"
                    />
                    <span className="text-sm text-gray-500 w-8">
                      kg
                    </span>
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
                <div className="text-center p-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                  No items in order. Add items below.
                </div>
              )}
            </div>
          </div>

          {/* Add New Item */}
          <div className="border-t pt-6">
            <Label className="mb-3 block">Add New Item</Label>
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-blue-900">Total Items:</span>
              <Badge variant="secondary" className="text-lg">
                {modifiedItems.filter(i => i.quantity > 0).length} items
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
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
