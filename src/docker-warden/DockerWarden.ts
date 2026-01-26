import Docker from 'dockerode'
import axios from 'axios'
import { Alerting } from '../alertings'

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

export class DockerWarden {
    private docker: Docker
    protected alertings: Alerting[] = []

    constructor() {
        this.docker = new Docker()
    }

    async testConnection() {
        try {
            await this.docker.version()
            return true
        } catch (err) {
            console.error('Error testing DockerConnection:', err.message)
            return false
        }
    }

    async getDockerVersion() {
        try {
            const versionInfo = await this.docker.version()
            return versionInfo.Version
        } catch (err) {
            console.error('Error getting Docker version:', err.message)
            return null
        }
    }

    async getContainerInfos() {
        try {
            const containers = await this.docker.listContainers()
            return containers
        } catch (err) {
            console.error('Error listing Docker containers:', err.message)
            return []
        }
    }

    async checkForUpdates() {
        const containerInfoList = await this.getContainerInfos()

        containerInfoList.forEach(async (containerInfo) => {
            const imageID = containerInfo.ImageID
            const name = containerInfo.Names[0].substring(1)

            try {
                // Get the image object to retrieve the original repository name
                const image = this.docker.getImage(imageID)
                const imageInspectInfo = await image.inspect()

                // Try to get image name from RepoTags first, then RepoDigests
                let imageName: string | undefined

                if (imageInspectInfo.RepoTags?.[0]) {
                    imageName = imageInspectInfo.RepoTags[0]
                } else if (imageInspectInfo.RepoDigests?.[0]) {
                    imageName = imageInspectInfo.RepoDigests[0].split('@')[0]
                }

                if (!imageName) {
                    console.warn(
                        `Could not determine image name for container ${name}`
                    )
                    this.alertings.forEach((alerting) => {
                        alerting.warn({
                            message: `Could not determine image name (no tags or digests found)`,
                            title: `Container ${name} - Check Skipped`
                        })
                    })
                    return
                }

                console.log(`Checking for updates for image: ${imageName}...`)

                // Get image info from registry without pulling
                const registryInfo =
                    await this.getImageInfoFromRegistry(imageName)
                if (registryInfo) {
                    console.log('Image Info from Registry:', registryInfo)

                    // Compare with local image digest
                    const localDigest = imageInspectInfo.RepoDigests[0]
                    const registryDigest = registryInfo.digest

                    if (localDigest === registryDigest) {
                        console.log(`Image ${imageName} is already up to date`)
                        this.alertings.forEach((alerting) => {
                            alerting.info({
                                message: `Image is up to date`,
                                title: `Container ${name} - No Update Available`
                            })
                        })
                    } else {
                        console.log(`New version available for ${imageName}`)
                        this.alertings.forEach((alerting) => {
                            alerting.alert({
                                message: `New version available\nLast Updated: ${registryInfo.lastUpdated}\nSize: ${(registryInfo.imageSize / 1024 / 1024).toFixed(2)} MB`,
                                title: `Container ${name} - Update Available`
                            })
                        })
                    }
                } else {
                    this.alertings.forEach((alerting) => {
                        alerting.error({
                            message: `Could not fetch image info from registry`,
                            title: `Container ${name} - Check Failed`
                        })
                    })
                }
            } catch (err) {
                console.error(`Error checking updates for image:`, err.message)
                this.alertings.forEach((alerting) => {
                    alerting.error({
                        message: `Error checking updates: ${err.message}`,
                        title: `Container ${name} - Check Failed`
                    })
                })
            }
        })
    }

    private async getImageInfoFromRegistry(imageName: string) {
        try {
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

    addAlerting(alerting: Alerting) {
        this.alertings.push(alerting)
    }

    async debug() {
        this.alertings.forEach((alerting) => {
            alerting.info({
                message: 'DockerWarden debug alert',
                title: 'Debug'
            })
            alerting.warn({
                message: 'DockerWarden debug warning',
                title: 'Debug'
            })
            alerting.alert({
                message: 'DockerWarden debug alert',
                title: 'Debug'
            })
            alerting.error({
                message: 'DockerWarden debug error',
                title: 'Debug'
            })
        })
    }
}
