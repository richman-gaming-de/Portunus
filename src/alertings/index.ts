export class Alerting {
    async info(config: { title?: string; message: string }) {
        console.warn(
            'Alerting base class info method called. This should be overridden.'
        )
    }

    async warn(config: { title?: string; message: string }) {
        console.warn(
            'Alerting base class warn method called. This should be overridden.'
        )
    }

    async alert(config: { title?: string; message: string }) {
        console.warn(
            'Alerting base class alert method called. This should be overridden.'
        )
    }

    async error(config: { title?: string; message: string }) {
        console.warn(
            'Alerting base class error method called. This should be overridden.'
        )
    }
}
