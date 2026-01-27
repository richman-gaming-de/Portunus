import axios from "axios"

interface DockerHubRepositoryResponse {
    description: string
}

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

export async function getDockerHubImage(imageName: string) {
    try {
        // Skip private registries like ghcr.io for now
        if (imageName.includes('ghcr.io')) {
            console.log(
                `Skipping registry check for ghcr image: ${imageName}`
            )
            return null
        }

        // Format: docker.io/library/mariadb:latest oder mariadb:latest
        const [name, tag = 'latest'] = imageName.split(':')
        const normalizedName = name.includes('/') ? name : `library/${name}`

        // Docker Hub API
        const response = await axios.get<DockerHubRepositoryResponse>(
            `https://hub.docker.com/v2/repositories/${normalizedName}/`,
            {
                headers: {
                    Accept: 'application/json'
                }
            }
        )

        const tagResponse = await axios.get<DockerHubTagResponse>(
            `https://hub.docker.com/v2/repositories/${normalizedName}/tags/${tag}/`,
            {
                headers: {
                    Accept: 'application/json'
                }
            }
        )

        return {
            name: imageName,
            description: response.data.description,
            tagResponse: tagResponse.data as DockerHubTagResponse,
            lastUpdated: tagResponse.data.last_updated,
            images: tagResponse.data.images
        }
    } catch (err) {
        console.error(
            `Error fetching image info from registry:`,
            err.message
        )
        return null
    }
}
