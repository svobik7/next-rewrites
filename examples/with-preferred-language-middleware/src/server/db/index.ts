import 'server-only'
import type { Article, Author, WithAuthor } from './types'

async function loadDB() {
  const rawData = await import('./db.json')
  return rawData
}

export async function fetchDictionary(locale: string) {
  const db = await loadDB()
  return db.dictionaries.find((dictionary) => dictionary.locale === locale)
}

export async function fetchAuthorByUsername(
  username: string
): Promise<Author | undefined> {
  const db = await loadDB()
  return db.authors.find((author) => author.username === username)
}

export async function fetchAuthors(limit?: number): Promise<Author[]> {
  const db = await loadDB()

  if (limit) {
    return db.authors.slice(0, limit)
  }

  return db.authors
}

export async function fetchArticleBySlug(
  slug: string
): Promise<Article | undefined> {
  console.log('fetchArticleBySlug', slug)
  const db = await loadDB()
  const withAuthor = await withAuthorFactory()

  const article = db.articles.find((article) =>
    article.slug.find((articleSlug) => articleSlug.value === slug)
  )

  return article ? withAuthor(article) : undefined
}

export async function fetchArticles(limit?: number): Promise<Article[]> {
  const db = await loadDB()
  const withAuthor = await withAuthorFactory()

  return db.articles.slice(0, limit ?? db.articles.length).map(withAuthor)
}

async function withAuthorFactory() {
  const db = await loadDB()

  return <T extends { authorId: number }>(article: T): WithAuthor<T> => {
    return {
      ...article,
      author: db.authors.find(({ id }) => id === article.authorId),
    }
  }
}
