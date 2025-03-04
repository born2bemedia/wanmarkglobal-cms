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
    },
    {
      name: 'strategy',
      type: 'textarea',
      label: 'Strategy',
    },
    {
      name: 'result',
      type: 'textarea',
      label: 'Result',
    },

    {
      name: 'firstSection',
      type: 'group',
      fields: [
        {
          name: 'text',
          type: 'textarea',
          label: 'Text',
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
        },
        {
          name: 'subtitle',
          type: 'text',
          label: 'Subtitle',
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
            },
            {
              name: 'text',
              type: 'text',
              label: 'Text',
              required: true,
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
        },
        {
          name: 'subtitle',
          type: 'text',
          label: 'Subtitle',
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
        },
        {
          name: 'text',
          type: 'textarea',
          label: 'Text',
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
}
