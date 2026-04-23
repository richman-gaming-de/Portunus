import dotenv from 'dotenv'
import SMTPConnection from 'nodemailer/lib/smtp-connection'

dotenv.config()

export interface PortunusConfig {
    cron:  string
    timezone: string
    alerting: {
        discord: {
            webhookUrl?: string
        }
        nodemailer: SMTPConnection.Options
    },
    database: {}
}

export function portunusConfig(): PortunusConfig {
    return {
        cron: process.env.CRON || '0 0 * * *',
        timezone: 'Europe/Berlin',

        alerting: {
            discord: {
                webhookUrl: process.env.DISCORD_WEBHOOK_URL,
            },
            nodemailer: { // View https://nodemailer.com/smtp/ for more information like well-known email services like "gmail" or "outlook".
                host: process.env.MAIL_HOST,
                auth: {
                    user: process.env.MAIL_USERNAME,
                    pass: process.env.MAIL_PASSWORD
                },
                secure: true
            }
        },

        database: {}
    }
}
