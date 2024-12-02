import type { GeneratePageStaticParamsProps, PageProps } from 'next-roots'
import { notFound } from 'next/navigation'
import { AuthorDetail } from 'src/features/blog/components/AuthorDetail'
import { getArticleLinkParams } from 'src/features/blog/utils/getArticleLinkParams'
import { getArticleTranslationFactory } from 'src/features/blog/utils/getArticleTranslation'
import { getAuthorLinkParams } from 'src/features/blog/utils/getAuthorLinkParams'
import {
  getAllAuthorTranslations,
  getAuthorTranslation,
} from 'src/features/blog/utils/getAuthorTranslation'
import BackButton from 'src/features/common/components/BackButton'
import { Links } from 'src/features/common/components/Links'
import Modal from 'src/features/common/components/Modal'
import {
  fetchArticles,
  fetchAuthorByUsername,
  fetchAuthors,
} from 'src/server/db'
import { getDictionary } from 'src/server/utils/getDictionary'

type AuthorParams = Promise<{ author: string }>

export default async function AuthorPage({
  params,
  locale,
}: PageProps<AuthorParams>) {
  const author = await fetchAuthorByUsername((await params).author)

  if (!author) {
    return notFound()
  }

  const allAuthorTranslations = getAllAuthorTranslations(author)
  const currentAuthorTranslation = getAuthorTranslation({
    author,
    locale,
  })

  if (!currentAuthorTranslation) {
    return notFound()
  }

  const articles = await fetchArticles()
  const authorArticles = articles.filter(
    ({ authorId }) => authorId === author.id
  )

  const getArticleTranslation = getArticleTranslationFactory(locale)
  const authorArticlesTranslations = authorArticles.map(getArticleTranslation)

  const t = await getDictionary(locale)

  return (
    <Modal>
      <AuthorDetail
        author={currentAuthorTranslation}
        articles={
          <Links
            header={t('author.PublishedArticles')}
            items={authorArticlesTranslations.map(getArticleLinkParams)}
          />
        }
        alternatives={
          <Links
            header={t('common.NotYourLanguage?')}
            items={allAuthorTranslations.map(getAuthorLinkParams)}
          />
        }
        buttonBack={<BackButton>{t('author.BtnHome')}</BackButton>}
      />
    </Modal>
  )
}

export async function generateStaticParams({
  pageLocale,
}: GeneratePageStaticParamsProps) {
  const authors = await fetchAuthors()
  return authors.map((a) => ({
    author: a.username,
  }))
}
