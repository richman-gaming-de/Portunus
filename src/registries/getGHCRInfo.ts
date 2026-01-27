import axios from "axios"
import { ImageInfo } from "./getImageInfo.js"

export async function getGHCRInfo(imageName: string): Promise<ImageInfo | null> {
    // Format: ghcr.io/owner/repo:tag
    const [fullPath, tag = 'latest'] = imageName.split(':')
    const repositoryPath = fullPath.replace('ghcr.io/', '')

    // 1. Token holen (Notwendig für 401 Fehler-Vermeidung)
    const tokenRes = await axios.get(`https://ghcr.io/token?scope=repository:${repositoryPath}:pull`) as { data: { token: string } }
    const token = tokenRes.data.token

    // 2. Manifest abrufen
    const manifestUrl = `https://ghcr.io/v2/${repositoryPath}/manifests/${tag}`
    const response = await axios.get(manifestUrl, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.v2+json'
        }
    })

    // GHCR liefert den Master-Digest im Header 'docker-content-digest'
    const masterDigest = response.headers['docker-content-digest']
    const manifest = response.data as { manifests?: any[], layers?: any[] }

    // Alle Digests sammeln (Index + Layer/Manifests)
    const subDigests = manifest.manifests 
        ? manifest.manifests.map((m: any) => m.digest) 
        : (manifest.layers ? [masterDigest] : [])

    return {
        name: imageName,
        latestDigest: masterDigest,
        allDigests: [masterDigest, ...subDigests],
        lastUpdated: new Date().toISOString(), // GHCR Manifeste haben oft kein Datum im Header
        imageSize: manifest.layers?.reduce((acc: number, l: any) => acc + l.size, 0) || 0
    }
}