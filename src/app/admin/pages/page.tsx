'use client'

import React, { useState, useEffect, useCallback } from 'react';

export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, FileText, Eye, Globe, Code } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Database page type
interface DatabasePage {
  id: string;
  slug: string;
  title: string;
  content: any; // JSONB field
  published: boolean;
  created_at: string;
  updated_at: string;
}

// Admin page type
interface AdminPage {
  id: string;
  slug: string;
  title: string;
  content: any;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Form schema for page creation/editing
const PageFormSchema = z.object({
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  title: z.string().min(1, 'Title is required'),
  published: z.boolean(),
  // Content is handled separately due to complex structure
});

type PageFormData = z.infer<typeof PageFormSchema>;

// Content editor schemas for different page types
const HomeContentSchema = z.object({
  hero: z.object({
    title: z.string(),
    subtitle: z.string(),
    backgroundImage: z.string(),
    cta: z.array(z.object({
      label: z.string(),
      href: z.string(),
    })),
  }),
  videoEmbed: z.object({
    src: z.string(),
    poster: z.string(),
    provider: z.string(),
  }).optional(),
  featureCards: z.array(z.object({
    title: z.string(),
    image: z.string(),
    href: z.string(),
  })).optional(),
});

export default function PagesManagement() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPage, setSelectedPage] = useState<AdminPage | null>(null);
  const [pages, setPages] = useState<AdminPage[]>([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [errorPages, setErrorPages] = useState<string | null>(null);
  const [contentJSON, setContentJSON] = useState<string>('{}');
  const [contentEditMode, setContentEditMode] = useState<'visual' | 'json'>('visual');

  // Fetch pages from Supabase
  const fetchPages = useCallback(async () => {
    try {
      setLoadingPages(true);
      setErrorPages(null);

      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pages:', error);
        setErrorPages(error.message);
        toast.error(`Failed to load pages: ${error.message}`);
        setPages([]);
        return;
      }

      if (data && data.length > 0) {
        const formattedPages = data.map(page => ({
          id: page.id,
          slug: page.slug,
          title: page.title,
          content: page.content,
          published: page.published,
          createdAt: new Date(page.created_at),
          updatedAt: new Date(page.updated_at),
        }));
        setPages(formattedPages);
      } else {
        setPages([]);
      }
    } catch (error: any) {
      console.error('Error fetching pages:', error);
      setErrorPages(error.message || 'Failed to load pages');
      toast.error(`Failed to load pages: ${error.message}`);
      setPages([]);
    } finally {
      setLoadingPages(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();

    // Set up real-time subscription
    const pagesSubscription = supabase
      .channel('pages_changes_admin')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'pages' },
        (payload) => {
          console.log('Pages change detected:', payload);
          fetchPages();
        }
      )
      .subscribe();

    return () => {
      pagesSubscription.unsubscribe();
    };
  }, [fetchPages]);

  const form = useForm<PageFormData>({
    resolver: zodResolver(PageFormSchema),
    defaultValues: {
      slug: '',
      title: '',
      published: false,
    },
  });

  const editForm = useForm<PageFormData>({
    resolver: zodResolver(PageFormSchema),
    defaultValues: {
      slug: '',
      title: '',
      published: false,
    },
  });

  const handleCreatePage = async (data: PageFormData) => {
    try {
      // Check for duplicate slug
      const existingPage = pages.find(page =>
        page.slug.toLowerCase() === data.slug.toLowerCase()
      );

      if (existingPage) {
        toast.error(`A page with slug "${data.slug}" already exists`);
        return;
      }

      let parsedContent = {};
      try {
        parsedContent = JSON.parse(contentJSON);
      } catch (e) {
        toast.error('Invalid JSON in content field');
        return;
      }

      const { error } = await supabase
        .from('pages')
        .insert({
          slug: data.slug,
          title: data.title,
          content: parsedContent,
          published: data.published,
        });

      if (error) throw new Error(error.message);

      toast.success('Page created successfully');
      setShowCreateModal(false);
      form.reset();
      setContentJSON('{}');
      fetchPages();
    } catch (error: any) {
      toast.error(`Failed to create page: ${error.message}`);
    }
  };

  const handleUpdatePage = async (pageId: string, data: PageFormData, content: any) => {
    try {
      const updateData: any = {
        slug: data.slug,
        title: data.title,
        content: content,
        published: data.published,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('pages')
        .update(updateData)
        .eq('id', pageId);

      if (error) throw new Error(error.message);

      toast.success('Page updated successfully');
      await fetchPages();
    } catch (error: any) {
      toast.error(`Failed to update page: ${error.message}`);
      throw error;
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', pageId);

      if (error) throw new Error(error.message);

      toast.success('Page deleted successfully');
      fetchPages();
    } catch (error: any) {
      toast.error(`Failed to delete page: ${error.message}`);
    }
  };

  const openEditModal = (page: AdminPage) => {
    setSelectedPage(page);
    editForm.reset({
      slug: page.slug,
      title: page.title,
      published: page.published,
    });
    setContentJSON(JSON.stringify(page.content, null, 2));
    setShowEditModal(true);
  };

  // Visual editor for home page
  const renderHomeContentEditor = (content: any, setContent: (content: any) => void) => {
    const homeContent = content || {
      hero: {
        title: '',
        subtitle: '',
        backgroundImage: '',
        cta: [{ label: 'EXPLORE', href: '/rooms' }],
      },
      featureCards: [],
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Hero Section</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Subtitle</label>
              <Input
                value={homeContent.hero?.subtitle || ''}
                onChange={(e) => {
                  const updated = {
                    ...homeContent,
                    hero: { ...homeContent.hero, subtitle: e.target.value },
                  };
                  setContent(updated);
                  setContentJSON(JSON.stringify(updated, null, 2));
                }}
                placeholder="e.g., A WAVE AWAY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Textarea
                value={homeContent.hero?.title || ''}
                onChange={(e) => {
                  const updated = {
                    ...homeContent,
                    hero: { ...homeContent.hero, title: e.target.value },
                  };
                  setContent(updated);
                  setContentJSON(JSON.stringify(updated, null, 2));
                }}
                placeholder="Main hero title"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Background Image URL</label>
              <Input
                value={homeContent.hero?.backgroundImage || ''}
                onChange={(e) => {
                  const updated = {
                    ...homeContent,
                    hero: { ...homeContent.hero, backgroundImage: e.target.value },
                  };
                  setContent(updated);
                  setContentJSON(JSON.stringify(updated, null, 2));
                }}
                placeholder="/images/hero/main.jpg"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Feature Cards</h3>
          <div className="space-y-3">
            {(homeContent.featureCards || []).map((card: any, index: number) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Card Title"
                      value={card.title || ''}
                      onChange={(e) => {
                        const updated = { ...homeContent };
                        updated.featureCards[index].title = e.target.value;
                        setContent(updated);
                        setContentJSON(JSON.stringify(updated, null, 2));
                      }}
                    />
                    <Input
                      placeholder="Image URL"
                      value={card.image || ''}
                      onChange={(e) => {
                        const updated = { ...homeContent };
                        updated.featureCards[index].image = e.target.value;
                        setContent(updated);
                        setContentJSON(JSON.stringify(updated, null, 2));
                      }}
                    />
                    <Input
                      placeholder="Link URL"
                      value={card.href || ''}
                      onChange={(e) => {
                        const updated = { ...homeContent };
                        updated.featureCards[index].href = e.target.value;
                        setContent(updated);
                        setContentJSON(JSON.stringify(updated, null, 2));
                      }}
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const updated = { ...homeContent };
                        updated.featureCards.splice(index, 1);
                        setContent(updated);
                        setContentJSON(JSON.stringify(updated, null, 2));
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              variant="outline"
              onClick={() => {
                const updated = { ...homeContent };
                if (!updated.featureCards) updated.featureCards = [];
                updated.featureCards.push({ title: '', image: '', href: '' });
                setContent(updated);
                setContentJSON(JSON.stringify(updated, null, 2));
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Feature Card
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (loadingPages) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading pages...</div>
      </div>
    );
  }

  if (errorPages) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        Failed to load pages: {errorPages}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pages & Content</h1>
          <p className="text-gray-600">Manage website pages and content</p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create New Page
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Page</DialogTitle>
              <DialogDescription>
                Add a new page to your website with custom content.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreatePage)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Page Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., about-us" {...field} />
                        </FormControl>
                        <FormDescription>URL-friendly identifier (lowercase, hyphens only)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Page Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., About Us" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="published"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Published</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <div>
                  <label className="block text-sm font-medium mb-2">Page Content (JSON)</label>
                  <Textarea
                    value={contentJSON}
                    onChange={(e) => setContentJSON(e.target.value)}
                    placeholder='{"hero": {"title": "Welcome", "subtitle": "..."}, "sections": []}'
                    className="font-mono text-sm min-h-[300px]"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter page content as JSON. Example: {`{"hero": {"title": "Welcome"}}`}
                  </p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Page</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {pages.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No pages found. Create your first page to get started.
            </div>
          ) : (
            pages.map((page) => (
              <motion.div
                key={page.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -4 }}
              >
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={page.published ? 'default' : 'secondary'}>
                        {page.published ? (
                          <><Globe className="w-3 h-3 mr-1" /> Published</>
                        ) : (
                          <><Eye className="w-3 h-3 mr-1" /> Draft</>
                        )}
                      </Badge>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(page);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePage(page.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{page.title}</CardTitle>
                    <p className="text-sm text-gray-500">/{page.slug}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <FileText className="w-4 h-4 mr-2" />
                        <span>Content sections: {Object.keys(page.content || {}).length}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Updated: {page.updatedAt.toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Page: {selectedPage?.title}</DialogTitle>
            <DialogDescription>
              Update page information and content.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(async (data) => {
              if (!selectedPage) return;
              try {
                let parsedContent = {};
                try {
                  parsedContent = JSON.parse(contentJSON);
                } catch (e) {
                  toast.error('Invalid JSON in content field');
                  return;
                }
                await handleUpdatePage(selectedPage.id, data, parsedContent);
                setShowEditModal(false);
              } catch (error) {
                // Error already handled
              }
            })} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., about-us" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., About Us" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="published"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Published</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <Tabs value={contentEditMode} onValueChange={(v) => setContentEditMode(v as 'visual' | 'json')}>
                <TabsList>
                  <TabsTrigger value="visual">Visual Editor</TabsTrigger>
                  <TabsTrigger value="json">JSON Editor</TabsTrigger>
                </TabsList>
                <TabsContent value="visual">
                  {selectedPage?.slug === 'home' ? (
                    (() => {
                      let parsedContent = {};
                      try {
                        parsedContent = JSON.parse(contentJSON);
                      } catch (e) {
                        parsedContent = selectedPage?.content || {};
                      }
                      return renderHomeContentEditor(parsedContent, (updated) => {
                        setContentJSON(JSON.stringify(updated, null, 2));
                      });
                    })()
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Visual editor is only available for the home page. Use JSON editor for other pages.
                      </p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="json">
                  <Textarea
                    value={contentJSON}
                    onChange={(e) => setContentJSON(e.target.value)}
                    placeholder='{"sections": []}'
                    className="font-mono text-sm min-h-[400px]"
                  />
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Page</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
