const axios = require('axios');

class WebhookAlerter {
  constructor() {
    this.webhooks = {
      slack: process.env.SLACK_WEBHOOK_URL,
      discord: process.env.DISCORD_WEBHOOK_URL,
      teams: process.env.TEAMS_WEBHOOK_URL
    };
  }

  async sendAlert(level, message, details = {}) {
    const alert = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
      source: 'Ctrl-Alt-Play Security Monitor'
    };

    // Send to configured webhooks
    const promises = [];

    if (this.webhooks.slack) {
      promises.push(this.sendSlackAlert(alert));
    }

    if (this.webhooks.discord) {
      promises.push(this.sendDiscordAlert(alert));
    }

    if (this.webhooks.teams) {
      promises.push(this.sendTeamsAlert(alert));
    }

    await Promise.allSettled(promises);
  }

  async sendSlackAlert(alert) {
    if (!this.webhooks.slack) return;

    const color = this.getColorForLevel(alert.level);
    const payload = {
      attachments: [{
        color,
        title: `🚨 Security Alert - ${alert.level}`,
        text: alert.message,
        fields: [
          {
            title: 'Timestamp',
            value: alert.timestamp,
            short: true
          },
          {
            title: 'Source',
            value: alert.source,
            short: true
          }
        ],
        footer: 'Ctrl-Alt-Play Security Monitor'
      }]
    };

    try {
      await axios.post(this.webhooks.slack, payload);
    } catch (error) {
      console.error('Failed to send Slack alert:', error.message);
    }
  }

  async sendDiscordAlert(alert) {
    if (!this.webhooks.discord) return;

    const color = this.getDiscordColorForLevel(alert.level);
    const payload = {
      embeds: [{
        title: `🚨 Security Alert - ${alert.level}`,
        description: alert.message,
        color,
        timestamp: alert.timestamp,
        footer: {
          text: alert.source
        }
      }]
    };

    try {
      await axios.post(this.webhooks.discord, payload);
    } catch (error) {
      console.error('Failed to send Discord alert:', error.message);
    }
  }

  async sendTeamsAlert(alert) {
    if (!this.webhooks.teams) return;

    const payload = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: `Security Alert - ${alert.level}`,
      themeColor: this.getColorForLevel(alert.level),
      sections: [{
        activityTitle: `🚨 Security Alert - ${alert.level}`,
        activitySubtitle: alert.source,
        text: alert.message,
        facts: [
          {
            name: 'Timestamp',
            value: alert.timestamp
          },
          {
            name: 'Level',
            value: alert.level
          }
        ]
      }]
    };

    try {
      await axios.post(this.webhooks.teams, payload);
    } catch (error) {
      console.error('Failed to send Teams alert:', error.message);
    }
  }

  getColorForLevel(level) {
    switch (level) {
      case 'HIGH': return '#ff0000';
      case 'MEDIUM': return '#ff9900';
      case 'INFO': return '#0099ff';
      default: return '#999999';
    }
  }

  getDiscordColorForLevel(level) {
    switch (level) {
      case 'HIGH': return 16711680; // Red
      case 'MEDIUM': return 16753920; // Orange
      case 'INFO': return 39423; // Blue
      default: return 10066329; // Grey
    }
  }
}

module.exports = { WebhookAlerter };
