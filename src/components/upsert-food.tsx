'use client';

import { type Food } from '@/server/db/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileEdit, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUploadThing } from '@/lib/uploadthing';
import { Checkbox } from './ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';

const formSchema = z.object({
  name: z.string().min(2).max(50),
  image: z.string().optional(),
  deliverable: z.boolean(),
  tags: z.enum(['Veggie', 'Vegan', '-']),
  cheeseometer: z.number().int().min(0).max(5),
  effort: z.number().int().min(0).max(10),
});

export function UpsertFood({ existingFood }: { existingFood?: Food }) {
  const isUpdating = existingFood ? true : false;

  const { mutate } = useSWRConfig();
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const $ut = useUploadThing('imageUploader');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingFood?.name ?? '',
      image: existingFood?.image ?? '',
      deliverable: existingFood?.deliverable ?? false,
      tags:
        // Using as is not working somehow
        existingFood?.tags === 'Veggie'
          ? 'Veggie'
          : existingFood?.tags === 'Vegan'
            ? 'Vegan'
            : '-',
      cheeseometer: existingFood?.cheeseometer ?? 0,
      effort: existingFood?.effort ?? 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);

    toast.loading(`${isUpdating ? 'Updating' : 'Creating'} '${values.name}'`, {
      duration: 100000,
      id: 'upsert-begin',
    });

    const res = await fetch(
      `/api/food${isUpdating && existingFood ? '/' + existingFood.id : ''}`,
      {
        method: isUpdating ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          image: values.image,
          deliverable: values.deliverable,
          tags: values.tags,
          cheeseometer: values.cheeseometer,
          effort: values.effort,
        }),
      },
    );

    setIsSaving(false);
    toast.dismiss('upsert-begin');

    if (res.status !== 200) {
      const data = (await res.json()) as { message: string };
      toast.error(
        `Failed ${isUpdating ? 'updating' : 'creating'} '${values.name}': ${data.message}`,
      );
      return;
    }

    toast.success(`${isUpdating ? 'Updated' : 'Created'} '${values.name}'`);
    await mutate('/api/food');
    setOpen(false);
  }

  const onImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return;
    }

    setIsSaving(true);
    toast.loading('Uploading image', {
      duration: 100000,
      id: 'upload-begin',
    });

    const selectedFiles = Array.from(e.target.files);
    const result = await $ut.startUpload(selectedFiles);

    toast.dismiss('upload-begin');
    setIsSaving(false);
    if (!result) {
      toast.error('Failed to upload image');
      return;
    }

    toast.success('Uploaded image');
    form.setValue('image', result[0]?.serverData.fileUrl);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size={isUpdating ? 'sm' : 'default'}
          className="mr-1 sm:mr-0">
          {isUpdating ? (
            <FileEdit className="w-4 h-4 mr-2" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          {isUpdating ? 'Edit' : 'Create'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isUpdating ? 'Edit' : 'Create'}</DialogTitle>
          <DialogDescription>
            Fill out the details for your food.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter food name"
                      {...field}
                      className="col-span-3"
                    />
                  </FormControl>
                  <FormMessage className="col-start-2 col-span-4" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Image</FormLabel>
                  <FormControl>
                    <>
                      <Input
                        placeholder="Enter food name"
                        disabled={field.disabled}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        type="file"
                        accept="image/*"
                        onChange={onImageChange}
                        multiple={
                          ($ut.routeConfig?.image?.maxFileCount ?? 1) > 1
                        }
                        className="col-span-3 cursor-pointer"
                      />
                      <input className="sr-only" {...field} />
                    </>
                  </FormControl>
                  <FormMessage className="col-start-2 col-span-4" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deliverable"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Deliverable</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 items-center col-span-3">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <FormLabel>Is deliverable?</FormLabel>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="effort"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Effort</FormLabel>
                  <Select
                    onValueChange={(e) => field.onChange(Number(e))}
                    defaultValue={field.value.toString()}>
                    <FormControl>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select effort" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="7">7</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="9">9</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="col-start-2 col-span-4" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Tags</FormLabel>
                  <Select
                    name="tags"
                    onValueChange={field.onChange}
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select dietary tag" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Vegan">Vegan</SelectItem>
                      <SelectItem value="Veggie">Veggie</SelectItem>
                      <SelectItem value="-">None</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="col-start-2 col-span-4" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cheeseometer"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Cheesometer</FormLabel>
                  <Select
                    onValueChange={(e) => field.onChange(Number(e))}
                    defaultValue={field.value.toString()}>
                    <FormControl>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select cheeseometer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="col-start-2 col-span-4" />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                Save Food
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
