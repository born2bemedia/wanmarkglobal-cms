import type { CollectionConfig } from 'payload'
import slugify from 'slugify'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Product Title',
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
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      label: 'Icon',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'price',
      type: 'number',
      label: 'Price',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Category',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      label: 'Excerpt',
    },
    {
      name: 'color',
      type: 'text',
      label: 'Color',
    },
    {
      name: 'includes',
      type: 'richText',
      label: 'Includes',
    },
  ],
}
