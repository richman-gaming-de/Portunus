import { getGHCRInfo } from './getGHCRInfo.js'
import { getDockerHubInfo } from './getDockerHubInfo.js'

export interface ImageInfo {
    name: string
    latestDigest: string
    allDigests: string[]
    lastUpdated: string
    imageSize: number
}

export async function getImageInfo(imageName: string): Promise<ImageInfo | null> {
    try {
        if (imageName.startsWith('ghcr.io/')) {
            return await getGHCRInfo(imageName)
        } else {
            return await getDockerHubInfo(imageName)
        }
    } catch (err) {
        console.error(`General Fetch Error for ${imageName}:`, err.message)
        return null
    }
}
