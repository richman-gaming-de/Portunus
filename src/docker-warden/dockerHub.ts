import axios from "axios"

interface DockerHubRepositoryResponse {
    description: string
}
interface DockerHubImage {
    size: number
    digest: string
}

interface DockerHubTagResponse {
    last_updated: string
    images: DockerHubImage[]
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
            lastUpdated: tagResponse.data.last_updated,
            imageSize: tagResponse.data.images?.[0]?.size || 0,
            digest: tagResponse.data.images?.[0]?.digest
        }
    } catch (err) {
        console.error(
            `Error fetching image info from registry:`,
            err.message
        )
        return null
    }
}
