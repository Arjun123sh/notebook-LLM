import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDF } from '@/lib/utils/source-processing';
import { withApiHandler } from '@/lib/api-handler';

export const POST = withApiHandler(async (req: NextRequest) => {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
        throw new Error('No file provided');
    }

    const arrayBuffer = await file.arrayBuffer();
    const text = await extractTextFromPDF(arrayBuffer);

    return NextResponse.json({ text });
});
