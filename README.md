# Portunus - Hüter der Ports, Wächter der Container
More than just a Watchtower. Unlock the full potential of your Docker fleet.

Als eine art Docker-Warden soll Portunus laufende Docker container auf einem System überwachen und eine Benachrichtigung senden, wenn eine Neuere Version released wurde. Je nach einstellung sendet er die Benachrichtigung Einmal oder in einem Zeitlichen intervall maximal N mal über den ausgewählten weg.

Für die Benachrichtigung solen unter anderem folgende wege zur verfügung stehen:
- Webhook
- Discord (Webhook angepasst für Discord)
- E-Mail

## Techstack
- NodeJS
  - dockerode
  - nodemailer
  - node-cron
  - axios
