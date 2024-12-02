import type { Metadata } from 'next'
import type {
  GeneratePageMetadataProps,
  GeneratePageStaticParamsProps,
  PageProps,
} from 'next-roots'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getProductLinkParams } from 'src/features/blog/utils/getProductLinkParams'
import { getProductMetadata } from 'src/features/blog/utils/getProductMetadata'
import {
  getAllProductTranslations,
  getProductTranslation,
  getProductTranslationFactory,
} from 'src/features/blog/utils/getProductTranslation'
import { Detail } from 'src/features/common/components/Detail'
import { Links } from 'src/features/common/components/Links'
import { List } from 'src/features/common/components/List'
import { fetchProductBySlug, fetchProducts } from 'src/server/db'
import { Product } from 'src/server/db/types'
import { getHomeHref, getPageHref, getProductsHref } from 'src/server/router'
import { getDictionary } from 'src/server/utils/getDictionary'

type ProductDetailPageProps = {
  pageLocale: string
  product?: Product
}

async function ProductDetailPage({
  pageLocale,
  product,
}: ProductDetailPageProps) {
  const t = await getDictionary(pageLocale)

  if (!product) {
    return notFound()
  }

  const allProductTranslations = getAllProductTranslations(product)
  const currentProductTranslation = getProductTranslation({
    product,
    locale: pageLocale,
  })

  if (!currentProductTranslation) {
    return notFound()
  }

  const href = getProductsHref({ product: currentProductTranslation })

  const pageHref = await getPageHref()

  if (pageHref !== href) {
    return redirect(href)
  }

  return (
    <Detail
      title={currentProductTranslation.title}
      content={currentProductTranslation.content}
      alternatives={
        <Links
          header={t('common.NotYourLanguage?')}
          items={allProductTranslations.map(getProductLinkParams)}
        />
      }
      buttonBack={
        <Link
          href={getHomeHref(currentProductTranslation.locale)}
          role="button"
          className="rounded bg-indigo-600 px-4 py-2 text-base font-semibold leading-7 text-white"
        >
          {t('article.BtnBack')}
        </Link>
      }
    />
  )
}

type ProductParams = Promise<{ slugs: string }>

export default async function ProductPage({
  params,
  locale,
}: PageProps<ProductParams>) {
  const translateProduct = getProductTranslationFactory(locale)

  const awaitedParams = await params

  if (awaitedParams.slugs) {
    const product = await fetchProductBySlug(awaitedParams.slugs)
    return <ProductDetailPage product={product} pageLocale={locale} />
  } else {
    const productsList = await fetchProducts()
    return (
      <List
        items={productsList.map(translateProduct).map((product) => ({
          id: product.id,
          content: product.content,
          title: product.title,
          createdAt: product.createdAt,
          href: getProductsHref({ product: product }),
        }))}
      />
    )
  }
}

export async function generateMetadata({
  locale,
  params,
}: GeneratePageMetadataProps<ProductParams>): Promise<Metadata> {
  const t = await getDictionary(locale)

  const product = await fetchProductBySlug((await params).slugs)

  if (product) {
    return getProductMetadata(product, locale)
  }

  return { title: t('products.title'), description: t('products.content') }
}

export async function generateStaticParams({
  pageLocale,
}: GeneratePageStaticParamsProps) {
  const products = await fetchProducts()

  return products
    .map((product) => ({
      slugs: product.slug
        .find((slug) => slug.locale === pageLocale)
        ?.value.split('/'),
    }))
    .filter((product) => product.slugs)
}
