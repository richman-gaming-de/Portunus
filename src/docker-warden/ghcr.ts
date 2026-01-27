import axios from 'axios'

interface GHCRManifest {
    layers: Array<{ size: number }>
    created?: string
}

export async function getGHCRImage(imageName: string) {
    try {
        // Input: ghcr.io/owner/repo:tag
        const [fullPath, tag = 'latest'] = imageName.split(':')
        const parts = fullPath.split('/')
        
        if (parts.length < 3) {
            console.error(`Invalid GHCR image name format: ${imageName}`)
            return null
        }

        const owner = parts[1]
        const repo = parts.slice(2).join('/')
        const repositoryPath = `${owner}/${repo}`

        const tokenUrl = `https://ghcr.io/token?scope=repository:${repositoryPath}:pull`
        const tokenResponse = await axios.get(tokenUrl) as { data: { token: string } }
        const token = tokenResponse.data.token

        console.log(`Fetching GHCR image info for ${repositoryPath}:${tag}...`)
        
        const response = await axios.get(
            `https://ghcr.io/v2/${repositoryPath}/manifests/${tag}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json'
                }
            }
        )

        const manifest = response.data as GHCRManifest

        const imageSize = manifest.layers 
            ? manifest.layers.reduce((acc: number, layer: any) => acc + layer.size, 0)
            : 0

        const digest = response.headers['docker-content-digest'] || response.headers['etag']

        return {
            name: imageName,
            description: repositoryPath,
            lastUpdated: manifest.created || new Date().toISOString(),
            tagResponse: undefined,
            images: [ {
                size: imageSize,
                digest: digest
            } ]
        }

    } catch (err: any) {
        console.error(
            `Error fetching GHCR image info from registry:`,
            err.response?.status === 401 ? 'Unauthorized (Token-Handshake failed)' : err.message
        )
        return null
    }
}
