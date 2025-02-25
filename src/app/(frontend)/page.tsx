'use client'
import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import React, { useEffect } from 'react'
import { fileURLToPath } from 'url'

import config from '@/payload.config'
import './styles.css'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/admin')
  }, [router])

  return <div className="home"></div>
}
