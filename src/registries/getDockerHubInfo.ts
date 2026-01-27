import axios from 'axios'
import { ImageInfo } from './getImageInfo.js'

export interface DockerHubTagResponse {
    creator: number
    id: number
    images: DockerHubImage[]
    last_updated: string
    last_updater: number
    last_updater_username: string
    name: string
    repository: number
    full_size: number
    v2: boolean
    tag_status: string
    tag_last_pulled: string
    tag_last_pushed: string
    media_type: string
    content_type: string
    digest: string 
}

export interface DockerHubImage {
    architecture: string
    features: string
    variant: string | null
    digest: string
    os: string
    os_features: string
    os_version: string | null
    size: number
    status: string
    last_pulled: string
    last_pushed: string
}

export async function getDockerHubInfo(imageName: string): Promise<ImageInfo | null> {
    const [name, tag = 'latest'] = imageName.split(':')
    const normalizedName = name.includes('/') ? name : `library/${name}`
    const url = `https://hub.docker.com/v2/repositories/${normalizedName}/tags/${tag}/`

    const response = await axios.get<DockerHubTagResponse>(url)
    const data = response.data

    return {
        name: imageName,
        latestDigest: data.digest, // Der Fat-Manifest Digest
        allDigests: [data.digest, ...data.images.map(img => img.digest)],
        lastUpdated: data.last_updated,
        imageSize: data.full_size
    }
}