'use client'

import React, { useState, useEffect, useCallback } from 'react';

// Disable prerendering for this page since it uses Firebase
export const dynamic = 'force-dynamic';
// Firebase imports removed - using Supabase
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CreateAddOnSchema, AddOn } from '@/lib/schemas';

type AddOnFormData = z.infer<typeof CreateAddOnSchema>;
import { Plus, Edit, Trash2, Upload, Image as ImageIcon, Package, DollarSign, Tag } from 'lucide-react';

// Slider settings for image previews
const sliderSettings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  adaptiveHeight: true,
  arrows: true,
};

// Form schema for add-on creation/editing
// AddOnFormData is now defined above from CreateAddOnSchema

export default function AddOnsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAddOn, setSelectedAddOn] = useState<(AddOn & { id: string }) | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  // Supabase data fetching
  const [addOns, setAddOns] = useState<(AddOn & { id: string })[]>([]);
  const [loadingAddOns, setLoadingAddOns] = useState(true);
  const [errorAddOns, setErrorAddOns] = useState<string | null>(null);

  // Fetch add-ons from Supabase
  const fetchAddOns = useCallback(async () => {
    try {
      setLoadingAddOns(true);
      setErrorAddOns(null);
      const { data, error } = await supabase
        .from('add_ons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedAddOns = data?.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        images: item.images || [],
        isActive: item.is_active,
        maxQuantity: item.max_quantity,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      })) as (AddOn & { id: string })[];

      setAddOns(formattedAddOns || []);
    } catch (error) {
      console.error('Error fetching add-ons:', error);
      setErrorAddOns('Failed to load add-ons');
    } finally {
      setLoadingAddOns(false);
    }
  }, []);

  useEffect(() => {
    fetchAddOns();

    // Set up real-time subscription for add-ons
    const addOnsSubscription = supabase
      .channel('add_ons_changes_admin')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'add_ons' },
        (payload) => {
          console.log('Add-ons change detected in admin:', payload);
          fetchAddOns(); // Refresh data when changes occur
        }
      )
      .subscribe();

    return () => {
      addOnsSubscription.unsubscribe();
    };
  }, [fetchAddOns]);

  // Form for creating/editing add-ons
  const form = useForm<AddOnFormData>({
    resolver: zodResolver(CreateAddOnSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: 'equipment',
      images: [],
      isActive: true,
    },
  });

  // Image upload handler
  const uploadImage = async (file: File): Promise<string> => {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      throw new Error('File must be JPG or PNG format');
    }

    setUploadingImage(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { error } = await supabase.storage
        .from('add-ons')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('add-ons')
        .getPublicUrl(fileName);

      return publicUrl;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imageUrl = await uploadImage(file);
      const currentImages = form.getValues('images') || [];
      form.setValue('images', [...currentImages, imageUrl]);
      toast.success('Image uploaded successfully');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    }
  };

  const handleCreateAddOn = async (data: AddOnFormData) => {
    try {
      // Check for duplicate add-on names
      const existingAddOn = addOns.find(addOn =>
        addOn.name.toLowerCase() === data.name.toLowerCase()
      );

      if (existingAddOn) {
        toast.error(`An add-on with the name "${data.name}" already exists`);
        return;
      }

      const { error } = await supabase
        .from('add_ons')
        .insert({
          name: data.name,
          description: data.description,
          price: data.price,
          category: data.category,
          images: data.images,
          is_active: data.isActive,
          max_quantity: data.maxQuantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Add-on created successfully');
      setShowCreateModal(false);
      form.reset();
    } catch (error: unknown) {
      toast.error(`Failed to create add-on: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateAddOn = async (addOnId: string, data: Partial<AddOnFormData>) => {
    try {
      const updateData: Record<string, string | number | boolean | string[] | undefined> = {
        updated_at: new Date().toISOString()
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.images !== undefined) updateData.images = data.images;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;
      if (data.maxQuantity !== undefined) updateData.max_quantity = data.maxQuantity;

      const { error } = await supabase
        .from('add_ons')
        .update(updateData)
        .eq('id', addOnId);

      if (error) throw error;
      toast.success('Add-on updated successfully');
    } catch (error: unknown) {
      toast.error(`Failed to update add-on: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteAddOn = async (addOnId: string) => {
    if (!confirm('Are you sure you want to delete this add-on?')) return;

    try {
      const { error } = await supabase
        .from('add_ons')
        .delete()
        .eq('id', addOnId);

      if (error) throw error;
      toast.success('Add-on deleted successfully');
    } catch (error: unknown) {
      toast.error(`Failed to delete add-on: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const openEditModal = (addOn: AddOn & { id: string }) => {
    setSelectedAddOn(addOn);
    form.reset({
      name: addOn.name,
      description: addOn.description || '',
      price: addOn.price,
      category: addOn.category,
      images: addOn.images || [],
      isActive: addOn.isActive,
      maxQuantity: addOn.maxQuantity,
    });
    setShowEditModal(true);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'equipment': return Package;
      case 'service': return DollarSign;
      case 'food': return Tag;
      case 'transport': return Package;
      default: return Package;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'equipment': return 'bg-heiwaOrange-100 text-heiwaOrange-800';
      case 'service': return 'bg-green-100 text-green-800';
      case 'food': return 'bg-orange-100 text-orange-800';
      case 'transport': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loadingAddOns) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading add-ons...</div>
      </div>
    );
  }

  if (errorAddOns) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        Failed to load add-ons: {errorAddOns}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add-ons</h1>
          <p className="text-gray-600">Manage additional services and equipment</p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Add-on</DialogTitle>
              <DialogDescription>
                Add a new add-on service or equipment to your offerings.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateAddOn)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Add-on Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Surfboard Rental" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="equipment">Equipment</SelectItem>
                            <SelectItem value="service">Service</SelectItem>
                            <SelectItem value="food">Food & Beverage</SelectItem>
                            <SelectItem value="transport">Transportation</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            min={0}
                            step={0.01}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Quantity (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            min={1}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the add-on service or equipment..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Image Upload Section */}
                <div className="space-y-4">
                  <div>
                    <FormLabel>Add-on Images</FormLabel>
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="addon-image-upload"
                        disabled={uploadingImage}
                      />
                      <label
                        htmlFor="addon-image-upload"
                        className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                      >
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            {uploadingImage ? 'Uploading...' : 'Click to upload images (JPG/PNG, max 5MB)'}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Image Preview */}
                  {form.watch('images') && form.watch('images').length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {form.watch('images').map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={imageUrl}
                            alt={`Add-on image ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const currentImages = form.getValues('images');
                              form.setValue('images', currentImages.filter((_, i) => i !== index));
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Add-on</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Add-ons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {addOns.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No add-ons found. Create your first add-on to get started.
            </div>
          ) : (
            addOns.map((addOn) => {
              const CategoryIcon = getCategoryIcon(addOn.category);

              return (
                <motion.div
                  key={addOn.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant={addOn.isActive ? 'default' : 'secondary'}>
                          {addOn.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(addOn);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAddOn(addOn.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-lg">{addOn.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Image Preview */}
                        {addOn.images && addOn.images.length > 0 ? (
                          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            <Slider {...sliderSettings}>
                              {addOn.images.map((imageUrl, index) => (
                                <div key={index} className="aspect-video">
                                  <img
                                    src={imageUrl}
                                    alt={`${addOn.name} - Image ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </Slider>
                          </div>
                        ) : (
                          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-gray-400" />
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Category:</span>
                            <Badge className={getCategoryColor(addOn.category)}>
                              <CategoryIcon className="w-3 h-3 mr-1" />
                              {addOn.category.charAt(0).toUpperCase() + addOn.category.slice(1)}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Price:</span>
                            <span className="font-medium text-green-600">
                              ${addOn.price.toFixed(2)}
                            </span>
                          </div>

                          {addOn.maxQuantity && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Max Quantity:</span>
                              <span className="font-medium">{addOn.maxQuantity}</span>
                            </div>
                          )}

                          {addOn.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {addOn.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Add-on</DialogTitle>
            <DialogDescription>
              Update add-on information, pricing, and images.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => {
              if (selectedAddOn) {
                handleUpdateAddOn(selectedAddOn.id, data);
                setShowEditModal(false);
              }
            })} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Add-on Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Surfboard Rental" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="equipment">Equipment</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="food">Food & Beverage</SelectItem>
                          <SelectItem value="transport">Transportation</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          min={0}
                          step={0.01}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Quantity (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          min={1}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the add-on service or equipment..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image Upload Section */}
              <div className="space-y-4">
                <div>
                  <FormLabel>Add-on Images</FormLabel>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="addon-image-upload-edit"
                      disabled={uploadingImage}
                    />
                    <label
                      htmlFor="addon-image-upload-edit"
                      className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                    >
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          {uploadingImage ? 'Uploading...' : 'Click to upload images (JPG/PNG, max 5MB)'}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Image Preview */}
                {form.watch('images') && form.watch('images').length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {form.watch('images').map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Add-on image ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const currentImages = form.getValues('images');
                            form.setValue('images', currentImages.filter((_, i) => i !== index));
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Add-on</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
