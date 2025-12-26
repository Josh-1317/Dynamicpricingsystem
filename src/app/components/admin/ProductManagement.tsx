import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';
import { Plus, Edit, Trash2, Package, Search } from 'lucide-react';
import { Product } from '../../types/order';
import { dbQuery } from '../../../utils/api';
import { toast } from 'sonner';

export function ProductManagement() {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<Partial<Product>>({
        name: '',
        description: '',
        unitOfMeasure: 'units',
        unitPrice: 0,
        category: '',
        imageUrl: ''
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const result = await dbQuery<Product[]>('/data/read?table=products', 'GET');
            if (result.success && result.data) {
                setProducts(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
            toast.error('Failed to load products');
        }
    };

    const handleOpenDialog = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData(product);
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                description: '',
                unitOfMeasure: 'units',
                unitPrice: 0,
                category: '',
                imageUrl: ''
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.unitOfMeasure) {
            toast.error('Name and Unit of Measure are required');
            return;
        }

        try {
            if (editingProduct) {
                const result = await dbQuery('/data/update', 'PUT', {
                    table: 'products',
                    where: { id: editingProduct.id },
                    data: formData
                });
                if (result.success) {
                    toast.success('Product updated');
                } else {
                    toast.error('Failed to update product');
                }
            } else {
                const newProduct = {
                    ...formData,
                    id: `prod_${Date.now()}`
                };
                const result = await dbQuery('/data/insert', 'POST', {
                    table: 'products',
                    data: newProduct
                });
                if (result.success) {
                    toast.success('Product created');
                } else {
                    toast.error('Failed to create product');
                }
            }
            setIsDialogOpen(false);
            fetchProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error('An error occurred');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const result = await dbQuery('/data/delete', 'DELETE', {
                table: 'products',
                where: { id }
            });
            if (result.success) {
                toast.success('Product deleted');
                fetchProducts();
            } else {
                toast.error('Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('An error occurred');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Master Catalog</h2>
                    <p className="text-gray-500">Manage your product inventory and pricing</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search products..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {products.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600">No products in catalog</p>
                            <Button variant="link" onClick={() => handleOpenDialog()}>Add your first product</Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead className="text-right">Unit Price</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{product.name}</div>
                                                <div className="text-sm text-gray-500 truncate max-w-[300px]">{product.description}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {product.category && <Badge variant="secondary">{product.category}</Badge>}
                                        </TableCell>
                                        <TableCell>{product.unitOfMeasure}</TableCell>
                                        <TableCell className="text-right">
                                            {product.unitPrice ? `$${product.unitPrice.toFixed(2)}` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(product)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(product.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                        <DialogDescription>
                            {editingProduct ? 'Update product details and pricing.' : 'Add a new item to your master catalog.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">Category</Label>
                            <Input
                                id="category"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">Unit Price</Label>
                            <Input
                                id="price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.unitPrice || ''}
                                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="uom" className="text-right">Unit</Label>
                            <Input
                                id="uom"
                                value={formData.unitOfMeasure}
                                onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                                className="col-span-3"
                                placeholder="e.g., kg, pcs, box"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="desc" className="text-right">Description</Label>
                            <Input
                                id="desc"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
