import ArticleDetailClient from './article-detail-client';

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ArticleDetailClient id={id} />;
}
