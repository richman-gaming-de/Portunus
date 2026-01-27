import axios from 'axios'
import { Alerting, AlertingMessage } from './index.js'

// 32768 -> Green

export interface EmbedField {
    name: string
    value: string
    inline?: boolean
}

export interface EmbedConfig {
    title: string
    description: string
    color?: number
    fields?: EmbedField[]
}

const colorCodeMapDec = new Map<string, number>([
    ['success', 32768], // Green
    ['info', 3447003], // Blue
    ['warn', 16731392], // Orange
    ['error', 16711680] // Red
])

export class DiscordAlerting extends Alerting {
    protected webhookUrl: string

    constructor(webhookUrl: string) {
        super()
        this.webhookUrl = webhookUrl
    }

    async sendStack(messages: AlertingMessage[]) {
        const embeds: EmbedConfig[] = messages.map((msg) => {
            return {
                title: msg.title,
                description: msg.description,
                color: colorCodeMapDec.get(msg.type),
                fields: msg.fields
            }
        })

        this.sendWebhook(embeds)
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
                timestamp: new Date().toISOString(),
                fields: embed.fields?.map((field) => ({
                    name: this.formatTitle(field.name, 256),
                    value: this.truncateMessage(field.value, 1024),
                    inline: field.inline || false
                }))
            }))
        }

        try {
            axios.post(this.webhookUrl, payload)
        } catch (err) {
            console.error(`Error sending Discord Webhook:`, err.message)
        }
    }
}
