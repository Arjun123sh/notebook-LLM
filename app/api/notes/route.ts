import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/services/storage.service';
import { withApiHandler } from '@/lib/api-handler';

export const GET = withApiHandler(async (req: NextRequest) => {
    const notebookId = req.nextUrl.searchParams.get('notebookId');
    if (!notebookId) throw new Error('notebookId required');

    const notes = await storageService.getNotes(notebookId);
    return NextResponse.json({ notes });
});

export const POST = withApiHandler(async (req: NextRequest) => {
    const { notebookId, title, content } = await req.json();
    if (!notebookId || !content) throw new Error('notebookId and content required');

    const note = await storageService.createNote(notebookId, title, content);
    return NextResponse.json({ note });
});

export const DELETE = withApiHandler(async (req: NextRequest) => {
    const { id } = await req.json();
    if (!id) throw new Error('id required');

    await storageService.deleteNote(id);
    return NextResponse.json({ success: true });
});
