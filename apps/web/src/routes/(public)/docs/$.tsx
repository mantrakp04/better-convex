import { createFileRoute, notFound } from '@tanstack/react-router';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { createServerFn } from '@tanstack/react-start';
import { source } from '@/lib/source';
import browserCollections from 'fumadocs-mdx:collections/browser';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { baseOptions } from '@/lib/layout.shared';
import { useFumadocsLoader } from 'fumadocs-core/source/client';
import { Suspense, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import * as fs from 'node:fs/promises';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/(public)/docs/$')({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split('/') ?? [];
    const data = await serverLoader({ data: slugs });
    await clientLoader.preload(data.path);
    return data;
  },
});

const serverLoader = createServerFn({
  method: 'GET',
})
  .inputValidator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs);
    if (!page) throw notFound();

    return {
      path: page.path,
      slugs,
      pageTree: await source.serializePageTree(source.getPageTree()),
    };
  });

const getMarkdownContent = createServerFn({
  method: 'GET',
})
  .inputValidator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const basePath = 'content/docs';
    const filePath = slugs.length === 0
      ? `${basePath}/index.mdx`
      : `${basePath}/${slugs.join('/')}.mdx`;

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch {
      // Try with /index.mdx for directory paths
      const indexPath = `${basePath}/${slugs.join('/')}/index.mdx`;
      const content = await fs.readFile(indexPath, 'utf-8');
      return content;
    }
  });

function CopyMarkdownButton({ slugs }: { slugs: string[] }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const content = await getMarkdownContent({ data: slugs });
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy markdown:', error);
    }
  };

  return (
    <Button
      onClick={handleCopy}
      variant="ghost"
      title="Copy Markdown"
      size="lg"
      className="w-36 justify-start"
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? 'Copied' : 'Copy Markdown'}
    </Button>
  );
}

const clientLoader = browserCollections.docs.createClientLoader({
  component(
    { toc, frontmatter, default: MDX },
    props: {
      className?: string;
      slugs: string[];
    },
  ) {
    return (
      <DocsPage toc={toc} className={props.className}>
        <div className="flex items-center justify-between gap-2">
          <DocsTitle>{frontmatter.title}</DocsTitle>
          <CopyMarkdownButton slugs={props.slugs} />
        </div>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <DocsBody>
          <MDX
            components={{
              ...defaultMdxComponents,
            }}
          />
        </DocsBody>
      </DocsPage>
    );
  },
});

function Page() {
  const data = useFumadocsLoader(Route.useLoaderData());

  return (
    <DocsLayout {...baseOptions()} tree={data.pageTree}>
      <Suspense>
        {clientLoader.useContent(data.path, {
          className: '',
          slugs: data.slugs,
        })}
      </Suspense>
    </DocsLayout>
  );
}