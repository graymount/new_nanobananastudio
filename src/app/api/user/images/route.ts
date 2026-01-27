import { NextRequest, NextResponse } from 'next/server';

import { AITaskStatus } from '@/extensions/ai';
import { deleteAITask, getAITasks, getAITasksCount } from '@/shared/models/ai_task';
import { getUserInfo } from '@/shared/models/user';

export interface UserImage {
  id: string;
  taskId: string;
  imageUrl: string;
  prompt: string;
  model: string;
  provider: string;
  createdAt: string;
}

export interface UserImagesResponse {
  code: number;
  message: string;
  data: {
    images: UserImage[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserInfo();
    if (!user) {
      return NextResponse.json(
        { code: 401, message: 'Unauthorized', data: null },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Get user's successful image tasks
    const aiTasks = await getAITasks({
      userId: user.id,
      mediaType: 'image',
      status: AITaskStatus.SUCCESS,
      page,
      limit,
    });

    const total = await getAITasksCount({
      userId: user.id,
      mediaType: 'image',
      status: AITaskStatus.SUCCESS,
    });

    // Extract images from taskInfo
    const images: UserImage[] = [];
    for (const task of aiTasks) {
      if (task.taskInfo) {
        try {
          const taskInfo = JSON.parse(task.taskInfo);
          const taskImages = taskInfo.images || [];
          for (let i = 0; i < taskImages.length; i++) {
            const img = taskImages[i];
            if (img.imageUrl) {
              images.push({
                id: `${task.id}-${i}`,
                taskId: task.id,
                imageUrl: img.imageUrl,
                prompt: task.prompt,
                model: task.model,
                provider: task.provider,
                createdAt: task.createdAt.toISOString(),
              });
            }
          }
        } catch (e) {
          // Skip invalid taskInfo
        }
      }
    }

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        images,
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user images:', error);
    return NextResponse.json(
      { code: 500, message: error.message || 'Internal server error', data: null },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserInfo();
    if (!user) {
      return NextResponse.json(
        { code: 401, message: 'Unauthorized', data: null },
        { status: 401 }
      );
    }

    const { taskId } = await request.json();
    if (!taskId) {
      return NextResponse.json(
        { code: 400, message: 'Task ID is required', data: null },
        { status: 400 }
      );
    }

    const deleted = await deleteAITask(taskId, user.id);
    if (!deleted) {
      return NextResponse.json(
        { code: 404, message: 'Image not found or not authorized', data: null },
        { status: 404 }
      );
    }

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: { deleted: true },
    });
  } catch (error: any) {
    console.error('Error deleting user image:', error);
    return NextResponse.json(
      { code: 500, message: error.message || 'Internal server error', data: null },
      { status: 500 }
    );
  }
}
