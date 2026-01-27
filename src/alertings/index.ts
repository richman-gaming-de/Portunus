export interface AlertField {
    name: string
    value: string
    inline?: boolean
}

export interface AlertingMessage {
    title: string
    description: string
    type?: 'success' | 'info' | 'warn' | 'error'
    fields?: AlertField[]
}

export class Alerting {
    async sendStack(messages: AlertingMessage[]) {
        console.warn(
            'Alerting base class sendStack method called. This should be overridden.'
        )
    }

    async error(config: { title?: string; message: string }) {
        console.warn(
            'Alerting base class error method called. This should be overridden.'
        )
    }
}
