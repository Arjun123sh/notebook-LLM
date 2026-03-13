import { NextRequest, NextResponse } from 'next/server';

type ApiHandler = (req: NextRequest) => Promise<NextResponse>;

export function withApiHandler(handler: ApiHandler): ApiHandler {
    return async (req: NextRequest) => {
        try {
            return await handler(req);
        } catch (error: any) {
            console.error(`API Error [${req.nextUrl.pathname}]:`, error);

            const status = error.status || 500;
            const message = error.message || 'Internal Server Error';

            return NextResponse.json(
                { error: message },
                { status }
            );
        }
    };
}
