import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ShoppingCart, Plus, Minus, Send } from 'lucide-react';
import { OrderItem } from '../../types/order';
import { toast } from 'sonner';

export function CatalogBrowser() {
  const { products, addOrder } = useApp();
  const { currentUser } = useAuth();
  // Map<productId, { quantity: number, kg: number }>
  const [cart, setCart] = useState<Map<string, { quantity: number, kg: number }>>(new Map());

  const updateCartItem = (productId: string, updates: { quantity?: number, kg?: number }) => {
    setCart(prev => {
      const newCart = new Map(prev);
      const current = newCart.get(productId) || { quantity: 0, kg: 0 };

      const newQuantity = updates.quantity !== undefined ? Math.max(0, updates.quantity) : current.quantity;
      const newKg = updates.kg !== undefined ? Math.max(0, updates.kg) : current.kg;

      if (newQuantity === 0 && newKg === 0) {
        newCart.delete(productId);
      } else {
        newCart.set(productId, { quantity: newQuantity, kg: newKg });
      }

      return newCart;
    });
  };

  const handleSubmitInquiry = async () => {
    if (cart.size === 0) {
      toast.error('Please add at least one item to your inquiry');
      return;
    }

    if (!currentUser) {
      toast.error('Please log in to submit an inquiry');
      return;
    }

    console.log('Submitting inquiry for:', currentUser);

    const items: OrderItem[] = Array.from(cart.entries()).map(([productId, data]) => {
      const product = products.find(p => p.id === productId)!;
      return {
        productId,
        productName: product.name,
        quantity: data.quantity,
        kg: data.kg
      };
    });

    try {
      await addOrder({
        clientId: currentUser.id,
        clientName: currentUser.name,
        clientMobile: currentUser.mobile || 'Na',
        items,
        status: 'new_inquiry',
        paymentStatus: 'pending',
        isLocked: false
      });

      toast.success('Inquiry submitted successfully! Admin will review and provide pricing.');
      setCart(new Map());
    } catch (e) {
      console.error('Submit error:', e);
      toast.error('Failed to submit inquiry. Please try again.');
    }
  };

  const totalItems = Array.from(cart.values()).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Product Catalog</h2>
          <p className="text-gray-600">Browse items and submit your inquiry. Pricing will be provided by our team.</p>
        </div>
        {totalItems > 0 && (
          <Button onClick={handleSubmitInquiry} size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
            <Send className="w-4 h-4 mr-2" />
            Submit Inquiry ({totalItems} items)
          </Button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-xl border border-dashed border-gray-300">
          <p className="text-lg text-gray-600">Loading products...</p>
          <p className="text-sm text-gray-400 mt-2">If this persists, please contact admin.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => {
            const cartItem = cart.get(product.id);
            const quantity = cartItem?.quantity || 0;

            return (
              <Card key={product.id} className="hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-2 hover:border-blue-300 overflow-hidden">
                {/* Product Image */}
                {product.imageUrl && (
                  <div className="h-48 overflow-hidden bg-gray-100">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{product.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {product.description}
                      </CardDescription>
                    </div>
                    {product.category && (
                      <Badge variant="outline" className="ml-2 bg-blue-50">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Unit:</span>
                      <Badge variant="secondary" className="bg-indigo-100">{product.unitOfMeasure}</Badge>
                    </div>

                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-3 text-center">
                      <p className="text-sm text-amber-800 font-medium">
                        💰 Price available after inquiry
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      {quantity === 0 ? (
                        <Button
                          onClick={() => updateCartItem(product.id, { quantity: 1 })}
                          variant="default"
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add to Inquiry
                        </Button>
                      ) : (
                        <div className="space-y-3 mt-4">
                          {/* Quantity Control */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Quantity</span>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => updateCartItem(product.id, { quantity: (cart.get(product.id)?.quantity || 0) - 1 })}
                                variant="outline"
                                size="icon"
                                className="w-8 h-8 border-blue-300 hover:bg-blue-50"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <Input
                                type="number"
                                value={cart.get(product.id)?.quantity || 0}
                                onChange={(e) => updateCartItem(product.id, { quantity: parseInt(e.target.value) || 0 })}
                                className="w-20 text-center bg-white h-8"
                                min="0"
                              />
                              <Button
                                onClick={() => updateCartItem(product.id, { quantity: (cart.get(product.id)?.quantity || 0) + 1 })}
                                variant="outline"
                                size="icon"
                                className="w-8 h-8 border-blue-300 hover:bg-blue-50"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Weight (kg) Control */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Weight (kg)</span>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => updateCartItem(product.id, { kg: Math.max(0, (cart.get(product.id)?.kg || 0) - 1) })}
                                variant="outline"
                                size="icon"
                                className="w-8 h-8 border-blue-300 hover:bg-blue-50"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <Input
                                type="number"
                                value={cart.get(product.id)?.kg || 0}
                                onChange={(e) => updateCartItem(product.id, { kg: parseFloat(e.target.value) || 0 })}
                                className="w-20 text-center bg-white h-8"
                                min="0"
                              />
                              <Button
                                onClick={() => updateCartItem(product.id, { kg: (cart.get(product.id)?.kg || 0) + 1 })}
                                variant="outline"
                                size="icon"
                                className="w-8 h-8 border-blue-300 hover:bg-blue-50"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {cart.size > 0 && (
        <Card className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 border-2 border-blue-300 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 rounded-full">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-lg">Your Inquiry Cart</p>
                  <p className="text-sm text-gray-700">{totalItems} items selected</p>
                </div>
              </div>
              <Button onClick={handleSubmitInquiry} size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg">
                <Send className="w-4 h-4 mr-2" />
                Submit Inquiry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}