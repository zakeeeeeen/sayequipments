'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { saveFile, deleteFile } from '@/lib/file-upload'

let __cacheSettings: any = null
let __cacheSettingsAt = 0
let __cacheLocations: any[] | null = null
let __cacheLocationsAt = 0
const __ttl = 60000

// --- General Settings (WhatsApp & About) ---

export async function getSiteSettings() {
  if (__cacheSettings && Date.now() - __cacheSettingsAt < __ttl) {
    return __cacheSettings
  }
  try {
    const settings = await prisma.sitesettings.findFirst()
    if (settings) {
      __cacheSettings = settings
      __cacheSettingsAt = Date.now()
      return settings
    }

    // Fallback: Try raw query with lowercase table
    const rawSettings = await prisma.$queryRaw<any[]>`SELECT * FROM sitesettings LIMIT 1`
    if (rawSettings && rawSettings.length > 0) {
      __cacheSettings = rawSettings[0]
      __cacheSettingsAt = Date.now()
      return __cacheSettings
    }
  } catch (error) {
    console.error("Failed to fetch site settings:", error)
    // Try raw query as last resort in catch block
    try {
      const rawSettings = await prisma.$queryRaw<any[]>`SELECT * FROM sitesettings LIMIT 1`
      if (rawSettings && rawSettings.length > 0) {
        __cacheSettings = rawSettings[0]
        __cacheSettingsAt = Date.now()
        return __cacheSettings
      }
    } catch (e) {
      console.error("Raw query for sitesettings also failed:", e)
    }
  }

  const fallback = {
    whatsappNumber: "6281234567890",
    aboutTitle: "Tentang SayEquipment",
    aboutDescription: "",
    heroBackgroundImage: null,
    aboutBackgroundImage: null,
    address: null,
    googleMapsUrl: null,
    operationalHours: null,
    instagram: null
  }
  __cacheSettings = fallback
  __cacheSettingsAt = Date.now()
  return fallback
}

export async function updateContactSettings(data: {
  whatsappNumber: string
  address: string
  googleMapsUrl: string
  operationalHours: string
  instagram: string
}) {
  const settings = await prisma.sitesettings.findFirst()
  
  if (settings) {
    await prisma.sitesettings.update({
      where: { id: settings.id },
      data: {
        whatsappNumber: data.whatsappNumber,
        address: data.address,
        googleMapsUrl: data.googleMapsUrl,
        operationalHours: data.operationalHours,
        instagram: data.instagram,
        updatedAt: new Date()
      }
    })
  } else {
    await prisma.sitesettings.create({
      data: {
        id: crypto.randomUUID(),
        ...data,
        updatedAt: new Date()
      }
    })
  }
  __cacheSettings = null
  __cacheSettingsAt = 0
  revalidatePath('/cart')
  revalidatePath('/about')
  revalidatePath('/contact')
  revalidatePath('/admin/settings')
}

// Deprecated: use updateContactSettings instead
export async function updateWhatsappNumber(number: string) {
  return updateContactSettings({
    whatsappNumber: number,
    address: "",
    googleMapsUrl: "",
    operationalHours: "",
    instagram: ""
  })
}

export async function updateAboutInfo(formData: FormData) {
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const imageFile = formData.get('image') as File

  const settings = await prisma.sitesettings.findFirst()
  
  let imagePath = undefined
  if (imageFile && imageFile.size > 0) {
    if (settings?.aboutBackgroundImage) {
      await deleteFile(settings.aboutBackgroundImage)
    }
    imagePath = await saveFile(imageFile)
  }

  if (settings) {
    await prisma.sitesettings.update({
      where: { id: settings.id },
      data: { 
        aboutTitle: title,
        aboutDescription: description,
        ...(imagePath && { aboutBackgroundImage: imagePath }),
        updatedAt: new Date()
      }
    })
  } else {
    await prisma.sitesettings.create({
      data: { 
        id: crypto.randomUUID(),
        aboutTitle: title,
        aboutDescription: description,
        aboutBackgroundImage: imagePath,
        updatedAt: new Date()
      }
    })
  }
  __cacheSettings = null
  __cacheSettingsAt = 0
  revalidatePath('/about')
  revalidatePath('/admin/settings')
}

export async function updateHeroInfo(formData: FormData) {
  const imageFile = formData.get('image') as File
  
  if (!imageFile || imageFile.size === 0) {
    return
  }

  const settings = await prisma.sitesettings.findFirst()
  
  let imagePath = undefined
  if (settings?.heroBackgroundImage) {
    await deleteFile(settings.heroBackgroundImage)
  }
  imagePath = await saveFile(imageFile)

  if (settings) {
    await prisma.sitesettings.update({
      where: { id: settings.id },
      data: { 
        heroBackgroundImage: imagePath,
        updatedAt: new Date()
      }
    })
  } else {
    await prisma.sitesettings.create({
      data: { 
        id: crypto.randomUUID(),
        heroBackgroundImage: imagePath,
        updatedAt: new Date()
      }
    })
  }
  __cacheSettings = null
  __cacheSettingsAt = 0
  revalidatePath('/')
  revalidatePath('/admin/settings')
}

// --- Locations ---

export async function getLocations() {
  if (__cacheLocations && Date.now() - __cacheLocationsAt < __ttl) {
    return __cacheLocations
  }
  try {
    const rows = await prisma.location.findMany({
      orderBy: { createdAt: 'asc' }
    })
    __cacheLocations = rows
    __cacheLocationsAt = Date.now()
    return rows
  } catch (error) {
    console.error("Failed to fetch locations:", error)
    try {
      const rows = await prisma.$queryRaw<any[]>`SELECT * FROM location ORDER BY createdAt ASC`
      __cacheLocations = rows
      __cacheLocationsAt = Date.now()
      return rows
    } catch (e) {
      console.error("Raw query for location failed:", e)
      return []
    }
  }
}

export async function createLocation(data: { name: string, address: string, mapUrl: string }) {
  await prisma.location.create({
    data: {
      ...data,
      id: crypto.randomUUID(),
      updatedAt: new Date()
    }
  })
  __cacheLocations = null
  __cacheLocationsAt = 0
  revalidatePath('/about')
  revalidatePath('/contact')
  revalidatePath('/admin/settings')
}

export async function updateLocation(id: string, data: { name: string, address: string, mapUrl: string }) {
  await prisma.location.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date()
    }
  })
  __cacheLocations = null
  __cacheLocationsAt = 0
  revalidatePath('/about')
  revalidatePath('/contact')
  revalidatePath('/admin/settings')
}

export async function deleteLocation(id: string) {
  await prisma.location.delete({
    where: { id }
  })
  __cacheLocations = null
  __cacheLocationsAt = 0
  revalidatePath('/about')
  revalidatePath('/contact')
  revalidatePath('/admin/settings')
}

// Helper for backward compatibility
export async function getWhatsappNumber() {
  const settings = await getSiteSettings()
  return settings.whatsappNumber
}
