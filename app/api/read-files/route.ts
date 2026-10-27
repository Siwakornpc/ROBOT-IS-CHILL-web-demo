import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const textExtensions = new Set(['.md', '.txt']);

function isWithinRoot(root: string, target: string) {
    const relativePath = path.relative(root, target);
    return relativePath === '' || (relativePath !== '..' && !relativePath.startsWith(`..${path.sep}`) && !path.isAbsolute(relativePath));
}

export async function GET(request: Request) {
    try {
        const requestedPath = new URL(request.url).searchParams.get('path') ?? 'docs';
        const root = await fs.realpath(process.cwd());
        const resolvedPath = path.resolve(root, requestedPath);

        if (!isWithinRoot(root, resolvedPath)) {
            return NextResponse.json({ error: 'Path is outside the project directory' }, { status: 403 });
        }

        const targetPath = await fs.realpath(resolvedPath);

        if (!isWithinRoot(root, targetPath)) {
            return NextResponse.json({ error: 'Path is outside the project directory' }, { status: 403 });
        }

        const stats = await fs.stat(targetPath);

        if (stats.isDirectory()) {
            const entries = await fs.readdir(targetPath, { withFileTypes: true });
            const files = entries
                .filter(entry => entry.isFile() && textExtensions.has(path.extname(entry.name).toLowerCase()))
                .map(entry => entry.name);

            return NextResponse.json({ files });
        }

        if (!stats.isFile() || !textExtensions.has(path.extname(targetPath).toLowerCase())) {
            return NextResponse.json({ error: 'Only Markdown and text files can be read' }, { status: 415 });
        }

        const text = await fs.readFile(targetPath, 'utf8');
        return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return NextResponse.json({ error: 'Path not found' }, { status: 404 });
        }

        return NextResponse.json({ error: 'Could not read path' }, { status: 500 });
    }
}