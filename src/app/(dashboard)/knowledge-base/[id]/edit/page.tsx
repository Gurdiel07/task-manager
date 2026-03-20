import ArticleEditClient from './article-edit-client';

export default async function ArticleEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ArticleEditClient id={id} />;
}
