import type { CollectionOptions, DeepLTranslationSettings } from './types'
import { DeepLService } from './deeplService'

/**
 * Get nested field value from object using dot notation
 */
function getNestedFieldValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    return current && typeof current === 'object' && current !== null && key in current
      ? (current as Record<string, unknown>)[key]
      : undefined
  }, obj)
}

/**
 * Set nested field value in object using dot notation
 */
function setNestedFieldValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.')
  const lastKey = keys.pop()

  if (!lastKey) return

  let current = obj
  for (const key of keys) {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }

  current[lastKey] = value
}

/**
 * Process RichText nodes recursively for translation
 */
async function processRichTextNode(
  node: Record<string, unknown>,
  deeplService: DeepLService,
  targetLanguage: string,
  sourceLanguage: string,
  settings: DeepLTranslationSettings,
): Promise<void> {
  try {
    // Handle text nodes
    if (node.type === 'text' && node.text && typeof node.text === 'string' && node.text.trim()) {
      try {
        const translatedText = await deeplService.translateText(
          node.text,
          targetLanguage,
          sourceLanguage,
          settings,
        )
        node.text = translatedText
      } catch (error) {
        console.error(`Failed to translate text: "${node.text}"`, error)
      }
      return
    }

    // Handle nodes with children
    if (node.children && Array.isArray(node.children)) {
      for (const childNode of node.children) {
        await processRichTextNode(
          childNode as Record<string, unknown>,
          deeplService,
          targetLanguage,
          sourceLanguage,
          settings,
        )
      }
    }
  } catch (error) {
    console.error('Error processing richText node:', error)
  }
}

export async function translateCollection({
  req,
  doc,
  collection,
  collectionOptions,
  codes,
  settings,
  sourceLanguage,
}: {
  req: Record<string, unknown>
  doc: Record<string, unknown>
  collection: Record<string, unknown>
  collectionOptions: CollectionOptions
  codes?: string[]
  settings?: DeepLTranslationSettings
  sourceLanguage?: string
}) {
  const sourceLanguageI =
    sourceLanguage ||
    (doc.sourceLanguage as string) ||
    (req.payload as any).config.localization?.defaultLocale ||
    'en'

  // Get available locales
  const localCodes: string[] = (req.payload as any).config.localization?.localeCodes || ['en']

  // Initialize DeepL service
  const deeplService = new DeepLService({
    deeplApiKey: process.env.DEEPL_API_KEY,
  })

  const translationPromises = localCodes
    .filter(
      (targetLanguage) =>
        targetLanguage !== sourceLanguageI && (!codes || codes.includes(targetLanguage)),
    )
    .map(async (targetLanguage: string) => {
      try {
        // Check if target document already exists
        await (req.payload as any).findByID({
          collection: collection.slug,
          id: doc.id,
          locale: targetLanguage,
          fallbackLocale: false,
          limit: 0,
          depth: 0,
        })

        const dataForUpdate: Record<string, unknown> = {}

        // Translate each field individually
        for (const fieldName of collectionOptions.fields) {
          try {
            // Handle nested field paths (e.g., 'firstSection.text')
            const fieldValue = getNestedFieldValue(doc, fieldName)

            if (fieldValue !== undefined && fieldValue !== null) {
              if (typeof fieldValue === 'string' && fieldValue.trim()) {
                // Simple string field
                const translatedText = await deeplService.translateText(
                  fieldValue,
                  targetLanguage,
                  sourceLanguageI,
                  settings || {},
                )
                setNestedFieldValue(dataForUpdate, fieldName, translatedText)
              } else if (fieldValue && typeof fieldValue === 'object' && (fieldValue as any).root) {
                // RichText field
                try {
                  const richTextContent = fieldValue as any

                  if (richTextContent.root && richTextContent.root.children) {
                    // Create a deep copy of the structure
                    const cleanRichText = JSON.parse(JSON.stringify(richTextContent))

                    // Process each child element recursively
                    for (const child of cleanRichText.root.children) {
                      await processRichTextNode(
                        child,
                        deeplService,
                        targetLanguage,
                        sourceLanguageI,
                        settings || {},
                      )
                    }

                    setNestedFieldValue(dataForUpdate, fieldName, cleanRichText)
                  } else {
                    // Fallback: keep original structure
                    setNestedFieldValue(dataForUpdate, fieldName, { ...(fieldValue as any) })
                  }
                } catch (error) {
                  console.error(`Failed to process RichText field ${fieldName}:`, error)
                  setNestedFieldValue(dataForUpdate, fieldName, { ...(fieldValue as any) })
                }
              } else if (Array.isArray(fieldValue)) {
                // Handle array fields (like strategies)
                const translatedArray = []
                for (const item of fieldValue) {
                  if (typeof item === 'object' && item !== null) {
                    const translatedItem = { ...(item as any) }
                    // Translate string fields within array items
                    for (const [key, value] of Object.entries(item)) {
                      if (typeof value === 'string' && value.trim()) {
                        try {
                          const translatedText = await deeplService.translateText(
                            value,
                            targetLanguage,
                            sourceLanguageI,
                            settings || {},
                          )
                          translatedItem[key] = translatedText
                        } catch (error) {
                          console.error(`Failed to translate array item field ${key}:`, error)
                        }
                      }
                    }
                    translatedArray.push(translatedItem)
                  } else {
                    translatedArray.push(item)
                  }
                }
                setNestedFieldValue(dataForUpdate, fieldName, translatedArray)
              }
            }
          } catch (error) {
            console.error(`Translation failed for field ${fieldName}:`, error)
            const originalValue = getNestedFieldValue(doc, fieldName)
            if (originalValue !== undefined) {
              setNestedFieldValue(dataForUpdate, fieldName, originalValue)
            }
          }
        }

        return { dataNew: dataForUpdate, targetLanguage }
      } catch (error) {
        console.error(`Translation failed for locale ${targetLanguage}:`, error)
        return null
      }
    })

  const translationResults = await Promise.all(translationPromises)
  const validResults = translationResults.filter((result) => result !== null)

  for (const translatedContent of validResults) {
    if (translatedContent) {
      try {
        const existingDoc = await (req.payload as any).findByID({
          collection: collection.slug,
          id: doc.id,
          locale: translatedContent.targetLanguage,
          fallbackLocale: false,
        })

        // Clean the data to remove any circular references
        const cleanData = { ...translatedContent.dataNew }

        // For RichText fields, ensure they don't have circular references
        for (const key in cleanData) {
          if (
            cleanData[key] &&
            typeof cleanData[key] === 'object' &&
            (cleanData[key] as any).root
          ) {
            try {
              cleanData[key] = JSON.parse(JSON.stringify(cleanData[key]))
            } catch (error) {
              console.warn(`Could not clean RichText field ${key}, using original:`, error)
              const originalField = (doc as any)[key]
              if (originalField && typeof originalField === 'object' && originalField.root) {
                cleanData[key] = {
                  root: {
                    children: originalField.root.children || [],
                  },
                }
              }
            }
          }
        }

        if (existingDoc) {
          // Update existing document
          await (req.payload as any).update({
            collection: collection.slug,
            id: doc.id,
            data: cleanData,
            locale: translatedContent.targetLanguage,
            depth: 0,
            overrideAccess: true,
            context: {
              skipTranslate: true,
              skipSlug: true,
            },
          })
        } else {
          // Create new localized document
          // First, get the original document to copy non-translatable fields
          const originalDoc = await (req.payload as any).findByID({
            collection: collection.slug,
            id: doc.id,
            locale: sourceLanguageI,
            fallbackLocale: false,
          })

          // Create base data with all non-translatable fields from original
          const baseData: Record<string, unknown> = {}

          // Copy all fields from original document
          for (const [key, value] of Object.entries(originalDoc)) {
            // Skip fields that are being translated
            const isTranslatableField = collectionOptions.fields.some(
              (field) => field === key || field.startsWith(key + '.'),
            )

            if (
              !isTranslatableField &&
              key !== 'id' &&
              key !== 'createdAt' &&
              key !== 'updatedAt'
            ) {
              baseData[key] = value
            }
          }

          // Ensure all required fields are present by copying from original if not translated
          const finalData = { ...baseData, ...cleanData }

          // For nested fields, ensure the parent structure exists
          for (const fieldName of collectionOptions.fields) {
            if (fieldName.includes('.')) {
              const parts = fieldName.split('.')
              const parentField = parts[0]

              if (!finalData[parentField]) {
                finalData[parentField] = getNestedFieldValue(originalDoc, parentField) || {}
              }
            }
          }

          await (req.payload as any).create({
            collection: collection.slug,
            data: {
              ...finalData,
              _status: 'draft',
            },
            locale: translatedContent.targetLanguage,
            depth: 0,
            overrideAccess: true,
            context: {
              skipTranslate: true,
              skipSlug: true,
            },
          })
        }
      } catch (error) {
        console.error(
          `Failed to update translation for locale ${translatedContent.targetLanguage}:`,
          error,
        )
      }
    }
  }
}
