import { DiscordAlerting } from './alertings/discord.js'
import { DockerWarden } from './docker-warden/DockerWarden.js'
import dotenv from 'dotenv'

dotenv.config()

const warden = new DockerWarden()

const discordWebhook = process.env.DISCORD_WEBHOOK_URL || ''

async function init() {
    const connectionSuccessawait = await warden.testConnection()
    if (!connectionSuccessawait) {
        console.error('Docker connection failed. Exiting.')
        return
    }

    warden.addAlerting(new DiscordAlerting(discordWebhook))

    await warden.checkForUpdates()
}

init()
