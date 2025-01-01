import { ratelimit } from '@/server/ratelimit';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createUploadthing } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';

import type { FileRouter } from 'uploadthing/next';

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: '8MB', maxFileCount: 1 } })
    .middleware(async () => {
      const user = await auth();
      if (!user.userId) {
        throw new UploadThingError('Unauthorized');
      }

      const clerk = await clerkClient();
      const fullUserData = await clerk.users.getUser(user.userId);

      if (fullUserData.publicMetadata.admin !== true) {
        throw new UploadThingError('User Does Not Have Upload Permissions');
      }

      const { success } = await ratelimit.limit(user.userId);
      if (!success) {
        throw new UploadThingError('Ratelimited');
      }

      return { userId: user.userId };
    })
    .onUploadComplete(({ file }) => {
      return { fileUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
