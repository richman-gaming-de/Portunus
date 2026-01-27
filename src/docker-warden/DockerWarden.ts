import Docker from 'dockerode'
import { Alerting, AlertingMessage } from '../alertings'
import { getDockerHubImage, DockerHubTagResponse } from './dockerHub.js'
import { getGHCRImage } from './ghcr.js'

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

        let messages: AlertingMessage[] = []

        for (const containerInfo of containerInfoList) {
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
                    messages.push({
                        title: `Container ${name} - Check Skipped`,
                        description: `Could not determine image name (no tags or digests found)`,
                        type: 'warn'
                    })
                    continue
                }

                console.log(`Checking for updates for image: ${imageName}...`)

                // Get image info from registry without pulling
                const registryInfo = await this.getImageInfoFromRegistry(imageName)
                if (registryInfo) {
                    // Compare with local image digest
                    const localDigest = imageInspectInfo.RepoDigests[0].split('@')[1]
                    console.log('>>>>>>>>>>DEBUG<<<<<<<<<<')
                    console.log('Local Digest:', localDigest)
                    console.log('Registry Digest:', registryInfo.tagResponse.digest)
                    console.log('Registry Images:', registryInfo.images)
                    console.log('<<<<<<<<<<DEBUG>>>>>>>>>>')


                    if (registryInfo.tagResponse.digest === localDigest || registryInfo.images.some(img => img.digest === localDigest)) {
                        console.log(`Image ${imageName} is already up to date`)
                        messages.push({
                            title: `Container ${name} - No Update Available`,
                            description: `Image is up to date\nImage: ${imageName}`,
                            type: 'success'
                        })
                    } else {
                        console.log(`New version available for ${imageName}`)
                        messages.push({
                            title: `Container ${name} - Update Available`,
                            description: `New version available\nImage: ${imageName}\nLast Updated: ${registryInfo.lastUpdated}`,
                            type: 'info',
                            fields: [
                                {
                                    name: 'Local Digest',
                                    value: localDigest,
                                    inline: false
                                }
                            ]
                        })
                    }
                } else {
                    messages.push({
                        title: `Container ${name} - Check Failed`,
                        description: `Could not fetch image info from registry\nImage: ${imageName}`,
                        type: 'warn'
                    })
                }
            } catch (err) {
                console.error(`Error checking updates for image:`, err.message)
                messages.push({
                    title: `Container ${containerInfo.Names[0].substring(1)} - Check Failed`,
                    description: `Error checking updates: ${err.message}`,
                    type: 'error'
                })
            }
        }

        this.alertings.forEach((alerting) => {
            alerting.sendStack(messages)
        })
    }

    private async getImageInfoFromRegistry(imageName: string): Promise<{
        name: string
        description: string
        lastUpdated: string
        tagResponse: DockerHubTagResponse | undefined
        images: {
            size: any
            digest: any
        }[]
    }> {
        if (imageName.split('/').length > 2) {
            // Private registry
            switch (imageName.split('/')[0]) {
                case 'ghcr.io':
                    return getGHCRImage(imageName)
                default:
                    console.log(
                        `Unsupported private registry for image: ${imageName}`
                    )
                    return null
            }
        }

        return getDockerHubImage(imageName)
    }

    addAlerting(alerting: Alerting) {
        this.alertings.push(alerting)
    }
}
