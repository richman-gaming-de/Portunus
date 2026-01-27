import { DiscordAlerting } from './alertings/discord.js'
import { DockerWarden } from './DockerWarden.js'
import { CronJob } from 'cron'
import { portunusConfig } from './config.js'

const config = portunusConfig()

const warden = new DockerWarden()

const discordWebhook = process.env.DISCORD_WEBHOOK_URL || ''

new CronJob(config.cron, async () => {
    // läuft jeden Tag um Mitternacht
    console.log('Running scheduled DockerWarden checkForUpdates...')

    await warden.checkForUpdates()
}, null, true, config.timezone)

async function init() {
    const connectionSuccessawait = await warden.testConnection()
    if (!connectionSuccessawait) {
        console.error('Docker connection failed. Exiting.')
        return
    }

    warden.addAlerting(new DiscordAlerting(discordWebhook))

    console.log('Initialization complete. Starting scheduled jobs...')
}

init()
