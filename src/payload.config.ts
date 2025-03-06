// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Policies } from './collections/Policies'
import { Categories } from './collections/Categories'
import { Products } from './collections/Products'
import Orders from './collections/Orders'
import { Cases } from './collections/Cases'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { google } from 'googleapis'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground',
)

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
})

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Policies, Categories, Products, Orders, Cases],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  cors: {
    origins: [`${process.env.LOCAL_FRONT_URL}`, `${process.env.WEB_FRONT_URL}`], // Allowed frontend origins
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
      ssl: {
        rejectUnauthorized: false,
      },
    },
  }),
  sharp,
  plugins: [
    vercelBlobStorage({
      enabled: true,
      collections: {
        media: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
  email: nodemailerAdapter({
    defaultFromName: 'Modulixo',
    defaultFromAddress: 'noreply@3dellium.com',
    transportOptions: {
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_FROM, // Your Gmail email address
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: async () => {
          const { token } = await oauth2Client.getAccessToken()
          return token
        },
      },
    },
  }),
})
