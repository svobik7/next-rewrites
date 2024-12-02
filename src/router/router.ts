import { compile, match } from 'path-to-regexp'
import type { Route, RouteParams, RouterSchema } from '~/types'
import { getLocaleFactory } from '~/utils/locale-utils'
import { sanitizeSchema } from '~/utils/schema-utils'
import { StaticRouter } from './static-router'

/**
 * Router class that extends StaticRouter to provide dynamic routing capabilities.
 */
export class Router extends StaticRouter {
  private schema: RouterSchema

  /**
   * Constructor for the Router class
   * @param {RouterSchema} schema - The routing schema
   */

  constructor(schema: RouterSchema) {
    super()
    this.schema = sanitizeSchema(schema)
  }

  /**
   * Creates href by finding route by given name and compiles its href with given params
   * @param {string} name - The name of the route
   * @param {RouteParams} params - Parameters for the route
   * @returns {string} - The compiled href
   */

  public getHref(name: string, params: RouteParams = {}): string {
    const { locale = StaticRouter.getLocale(), ...hrefParams } = params

    Object.keys(hrefParams).forEach((key) => {
      if (hrefParams[key] === '' || hrefParams[key] === null) {
        delete hrefParams[key]
      }
    })

    const route = this.findRouteByLocaleAndName(
      Array.isArray(locale) ? locale.join('_') : locale,
      name
    )
    return formatHref(compileHref(route?.href || '', hrefParams))
  }

  /**
   * Retrieves locale of given href
   * @param {string} href - The href to extract locale from
   * @returns {string} - The extracted locale
   */

  public getLocaleFromHref(href: string): string {
    const getLocale = getLocaleFactory({
      locales: this.schema.locales,
      defaultLocale: this.schema.defaultLocale,
    })
    return getLocale(href)
  }

  /**
   * Finds route matching given href
   * @param {string} href - The href to find route for
   * @returns {Route | undefined} - The found route or undefined
   */

  public getRouteFromHref(href: string): Route | undefined {
    const locale = this.getLocaleFromHref(href)
    return this.findRouteByLocaleAndHref(locale, href)
  }

  /**
   * Gets all routes for a given locale
   * @param {string} locale - The locale for which to get routes
   * @returns {Route[]} - The sorted array of routes
   */

  private getLocalizedRoutes(locale: string) {
    return this.schema.routes[locale] || []
  }

  /**
   * Finds a route for a given locale and route name
   * @param {string} locale - The locale for which to find the route
   * @param {string} name - The name of the route
   * @returns {Route | undefined} - The found route or undefined
   */

  private findRouteByLocaleAndName(locale: string, name: string) {
    return this.getLocalizedRoutes(locale).find(
      (route: Route) => route.name === name
    )
  }

  /**
   * Finds a route for a given locale and href
   * @param {string} locale - The locale for which to find the route
   * @param {string} href - The href of the route
   * @returns {Route | undefined} - The found route or undefined
   */

  private findRouteByLocaleAndHref(locale: string, href: string) {
    return this.getLocalizedRoutes(locale).find((route: Route) => {
      const isMatch = match(route.href, { decode: decodeURIComponent })
      return isMatch(href)
    })
  }
}

/**
 * Puts given params to their appropriate places in given href
 * @param {string} href - The href template
 * @param {RouteParams} params - The parameters to insert into href
 * @returns {string} - The compiled href
 */

export function compileHref(href: string, params: RouteParams): string {
  let compiledHref = ''
  try {
    const getHref = compile(href, {
      encode: encodeURIComponent,
    })
    compiledHref = getHref(params)
  } catch {
    compiledHref = href
  }
  return compiledHref
}

/**
 * Removes duplicated or trailing slashes from given href and puts the slash at the beginning
 * @param {...string[]} hrefSegments - Segments of the href
 * @returns {string} - The formatted href
 */

export function formatHref(...hrefSegments: string[]): string {
  const href = hrefSegments
    .join('/')
    .replace(/\/\/+/g, '/')
    .replace(/\/$/, '')
    .replaceAll('%2F', '/')
  return href.startsWith('/') ? href : `/${href}`
}
