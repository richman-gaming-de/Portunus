import axios from 'axios'
import { Alerting } from './index.js'

interface EmbedConfig {
    title: string
    description: string
    color?: number
}

export class DiscordAlerting extends Alerting {
    protected webhookUrl: string

    constructor(webhookUrl: string) {
        super()
        this.webhookUrl = webhookUrl
    }

    async info(config: { title?: string; message: string }) {
        const embeds = [
            {
                title: config.title || 'Portunus Info',
                description: config.message,
                color: 3447003 // Blue color
            }
        ]

        try {
            await this.sendWebhook(embeds)
            console.log(`Info sent to Discord successfully`)
        } catch (err) {
            console.error(`Error sending Discord Info:`, err.message)
        }
    }

    async warn(config: { title?: string; message: string }) {
        const embeds = [
            {
                title: config.title || 'Portunus Warning',
                description: config.message,
                color: 16762112 // Yellow color
            }
        ]

        try {
            await this.sendWebhook(embeds)
            console.log(`Warning sent to Discord successfully`)
        } catch (err) {
            console.error(`Error sending Discord Warning:`, err.message)
        }
    }

    async alert(config: { title?: string; message: string }) {
        const embeds = [
            {
                title: config.title || 'Portunus Alert',
                description: config.message,
                color: 16731392 // Orange color
            }
        ]

        try {
            await this.sendWebhook(embeds)
            console.log(`Alert sent to Discord successfully`)
        } catch (err) {
            console.error(`Error sending Discord Alert:`, err.message)
        }
    }

    async error(config: { title?: string; message: string }) {
        const embeds = [
            {
                title: config.title || 'Portunus Error',
                description: config.message,
                color: 16711680 // Red color
            }
        ]

        try {
            await this.sendWebhook(embeds)
            console.log(`Error sent to Discord successfully`)
        } catch (err) {
            console.error(`Error sending Discord Error:`, err.message)
        }
    }

    private formatTitle(title: string, maxLength: number) {
        if (title.length <= maxLength) {
            return title
        }
        return title.substring(0, maxLength - 3) + '...'
    }

    private truncateMessage(message: string, maxLength: number) {
        if (message.length <= maxLength) {
            return message
        }
        return message.substring(0, maxLength - 3) + '...'
    }

    private async sendWebhook(embedConfigs: EmbedConfig[]) {
        const payload = {
            username: 'Portunus Alerting',
            avatar_url: 'https://cdn.richman-gaming.de/portunus/logo.png',
            embeds: embedConfigs.map((embed) => ({
                title: this.formatTitle(embed.title, 256),
                description: this.truncateMessage(embed.description, 2048),
                color: embed.color || 3447003,
                timestamp: new Date().toISOString()
            }))
        }
        try {
            axios.post(this.webhookUrl, payload)
        } catch (err) {
            console.error(`Error sending Discord Webhook:`, err.message)
        }
    }
}
