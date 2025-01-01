import { zodResolver } from '@hookform/resolvers/zod';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const formSchema = z.object({
  sort: z.enum(['asc', 'desc']),
  amount: z.number().min(1).max(100),
  cheeseometer: z.number().int().min(0).max(5).optional(),
  deliverable: z.boolean().optional(),
  tags: z.enum(['Veggie', 'Vegan', '-']).optional(),
  effort: z.number().int().min(0).max(10).optional(),
});

export default function FilterDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const amount = Number(searchParams.get('amount') ?? 40);
  const sort = searchParams.get('sort') ?? '';
  const effort = searchParams.get('effort');
  const deliverable = searchParams.get('deliverable');
  const cheeseometer = searchParams.get('cheeseometer');
  const tags = searchParams.get('tags');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount,
      sort: sort === 'desc' ? 'desc' : 'asc',
      effort: effort ? Number(effort) : undefined,
      deliverable: deliverable ? deliverable === 'yes' : undefined,
      cheeseometer: cheeseometer ? Number(cheeseometer) : undefined,
      tags: tags === 'Veggie' || tags === 'Vegan' ? tags : '-',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    current.set('amount', values.amount.toString());
    current.set('sort', values.sort);
    current.set('effort', values.effort?.toString() ?? '');
    current.set('deliverable', values.deliverable?.toString() ?? '');
    current.set('cheeseometer', values.cheeseometer?.toString() ?? '');
    current.set('tags', values.tags ?? '');

    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);

    setOpen(false);
  }

  function clearFilter() {
    toast.info('Filters cleared');
    router.push(pathname);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mr-3 ml-2">Filter Dishes</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filter Dishes</DialogTitle>
          <DialogDescription>
            Customize your food search with the following options.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="sort"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Sort</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select cheeseometer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="col-start-2 col-span-4" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Amount</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter amount"
                      name={field.name}
                      disabled={field.disabled}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      defaultValue={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      type="number"
                      className="col-span-3"
                    />
                  </FormControl>
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
                    defaultValue={field.value?.toString()}>
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
              name="effort"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Effort</FormLabel>
                  <Select
                    onValueChange={(e) => field.onChange(Number(e))}
                    defaultValue={field.value?.toString()}>
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

            <DialogFooter>
              <Button
                className="w-full"
                variant="outline"
                onClick={clearFilter}>
                Clear Filters
              </Button>
              <Button className="w-full mb-4 sm:mb-0" type="submit">
                Apply Filters
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
