import path from 'path'
import type { CliParams, Config } from '~/cli/types'
import { isDirectory, makeDir, readFile } from '~/utils/fs-utils'
import { ConfigError } from './errors'

export const PKG_NAME = 'next-roots'
export const DEFAULT_ORIGIN_DIR = './roots'
export const DEFAULT_LOCALIZE_DIR = './app'

function getPathFactory(dirName: string) {
  return (fileName = '') => path.join(dirName, fileName)
}

function getContentsFactory(getAbsolutePath: (fileName: string) => string) {
  return (fileName: string): string => readFile(getAbsolutePath(fileName))
}

export function getConfig(cliParams: CliParams): Config {
  const distRoot = path.join(cliParams.packageDir, 'dist')

  const getOriginAbsolutePath = getPathFactory(cliParams.originDir)
  const getLocalizedAbsolutePath = getPathFactory(cliParams.localizedDir)

  const originDir = getOriginAbsolutePath()

  if (!isDirectory(originDir)) {
    throw new ConfigError(
      `Invalid "originDir" path. Directory "${originDir}" does not exist.`
    )
  }

  const localizedDir = getLocalizedAbsolutePath()

  if (!isDirectory(localizedDir)) {
    makeDir(localizedDir)
  }

  if (!isDirectory(localizedDir)) {
    throw new ConfigError(
      `Invalid "localizedDir" path. Directory "${localizedDir}" neither exists nor be created.`
    )
  }

  const getDistAbsolutePath = getPathFactory(distRoot)
  const getCacheAbsolutePath = getPathFactory(path.join(distRoot, 'cache'))

  const defaultLocale = cliParams.defaultLocale || cliParams.locales.at(0) || ''

  if (!cliParams.locales.includes(defaultLocale)) {
    throw new ConfigError(
      'Invalid or empty "defaultLocale". Must be one of given "locales".'
    )
  }

  const getOriginContents = getContentsFactory(getOriginAbsolutePath)

  return Object.freeze({
    locales: cliParams.locales,
    defaultLocale,
    prefixDefaultLocale: cliParams.prefixDefaultLocale,
    getLocalizedAbsolutePath,
    getOriginAbsolutePath,
    getDistAbsolutePath,
    getCacheAbsolutePath,
    getOriginContents,
    afterGenerate: cliParams.afterGenerate,
  })
}
