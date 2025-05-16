import { Prisma } from '@prisma/client';

declare global {
  namespace PrismaJson {
    type ProjectShare = {
      projectId: number;
      userId: number;
      permissions: string[];
    };

    type ProjectMaterial = {
      projectId: number;
      materialId: number;
      quantity: number;
      unit: string;
    };
  }
}

declare module '@prisma/client' {
  interface PrismaClient {
    projectShare: Prisma.ProjectShareDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>;
    projectMaterial: Prisma.ProjectMaterialDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>;
  }

  interface ProjectCreateInput {
    projectStatus?: string;
  }

  interface ProjectUpdateInput {
    projectStatus?: string;
  }

  interface MaterialInclude {
    material?: boolean | Prisma.MaterialArgs;
  }

  interface CommentInclude {
    user?: boolean | Prisma.UserArgs;
  }
}

export {};
