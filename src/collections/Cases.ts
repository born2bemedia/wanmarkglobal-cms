import { handleDocumentTranslation } from '@/services/translationService'
import type { CollectionConfig } from 'payload'
import slugify from 'slugify'

export const Cases: CollectionConfig = {
  slug: 'cases',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true, // Allows public (unauthenticated) read access
    create: ({ req }) => req.user?.role === 'admin', // Only allow admins to create
    update: ({ req }) => req.user?.role === 'admin', // Only allow admins to update
    delete: ({ req }) => req.user?.role === 'admin', // Only allow admins to delete
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      unique: true,
      hooks: {
        beforeChange: [
          async ({ data }) => {
            if (data?.title) {
              return slugify(data.title, { lower: true, strict: true })
            }
          },
        ],
      },
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'Subtitle',
      localized: true,
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      label: 'Thumbnail',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Background Image',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'challenge',
      type: 'textarea',
      label: 'Challenge',
      localized: true,
    },
    {
      name: 'strategy',
      type: 'textarea',
      label: 'Strategy',
      localized: true,
    },
    {
      name: 'result',
      type: 'textarea',
      label: 'Result',
      localized: true,
    },

    {
      name: 'firstSection',
      type: 'group',
      fields: [
        {
          name: 'text',
          type: 'textarea',
          label: 'Text',
          localized: true,
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Image',
        },
      ],
    },

    {
      name: 'secondSection',
      type: 'group',
      fields: [
        {
          name: 'text',
          type: 'textarea',
          label: 'Text',
          localized: true,
        },
        {
          name: 'subtitle',
          type: 'text',
          label: 'Subtitle',
          localized: true,
        },
      ],
    },
    {
      name: 'thirdSection',
      type: 'group',
      fields: [
        {
          name: 'subtitle',
          type: 'text',
          label: 'Subtitle',
          localized: true,
        },
        {
          name: 'strategies',
          type: 'array',
          label: 'Strategies',
          required: true,
          minRows: 1,
          maxRows: 5,
          fields: [
            {
              name: 'icon',
              type: 'upload',
              label: 'Icon',
              relationTo: 'media',
              required: false,
            },
            {
              name: 'subtitle',
              type: 'text',
              label: 'Subtitle',
              required: true,
              localized: true,
            },
            {
              name: 'text',
              type: 'text',
              label: 'Text',
              required: true,
              localized: true,
            },
          ],
        },
      ],
    },
    {
      name: 'fourthSection',
      type: 'group',
      fields: [
        {
          name: 'text',
          type: 'textarea',
          label: 'Text',
          localized: true,
        },
        {
          name: 'subtitle',
          type: 'text',
          label: 'Subtitle',
          localized: true,
        },
      ],
    },
    {
      name: 'fifthSection',
      type: 'group',
      fields: [
        {
          name: 'subtitle',
          type: 'text',
          label: 'Subtitle',
          localized: true,
        },
        {
          name: 'text',
          type: 'textarea',
          label: 'Text',
          localized: true,
        },
      ],
    },
    {
      name: 'ctaSection',
      type: 'group',
      fields: [
        {
          name: 'subtitle',
          type: 'text',
          label: 'Subtitle',
          localized: true,
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Image',
        },
      ],
    },
    {
      name: 'metaTags',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Title',
          localized: true,
        },
        {
          name: 'description',
          type: 'text',
          label: 'Description',
          localized: true,
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Image',
        },
      ],
    },
  ],
  endpoints: [
    {
      path: '/:id/translate-lt',
      method: 'post',
      handler: async (req) => {
        try {
          if (!req.user || req.user.role !== 'admin') {
            return new Response(JSON.stringify({ message: 'Forbidden' }), {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const urlParts = (req as any).url?.split('/') || []
          const id = urlParts[urlParts.length - 2]

          if (!id) {
            return new Response(JSON.stringify({ message: 'ID is required' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const defaultLocale = 'en'
          const result = await (req as any).payload.findByID({
            collection: 'cases',
            id,
            locale: defaultLocale,
            depth: 2,
          })
          console.log('📄 Result found:', result)
          const doc = result

          console.log('📄 Document found:', doc)

          await handleDocumentTranslation(doc, 'cases', 'update', req as any)

          return new Response(JSON.stringify({ ok: true }), {
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (e) {
          console.error('translate-lt error', e)
          return new Response(JSON.stringify({ ok: false, error: String(e) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
    },
  ],
}
