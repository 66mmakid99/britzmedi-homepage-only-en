// Slack Webhook Integration for Lead Notifications

export interface SlackLeadNotification {
  companyName: string;
  contactName: string;
  email: string;
  country: string;
  jobTitle: string;
  interestedProducts: string[];
  leadScore: number;
  leadGrade: string;
  message?: string;
  companyWebsite?: string;
}

export async function sendSlackNotification(
  lead: SlackLeadNotification,
  webhookUrl: string
): Promise<boolean> {
  if (!webhookUrl) {
    console.warn('Slack webhook URL not configured');
    return false;
  }

  const gradeEmoji = {
    A: ':fire:',
    B: ':star:',
    C: ':seedling:',
    D: ':snowflake:'
  }[lead.leadGrade] || ':question:';

  const gradeColor = {
    A: '#10b981', // green
    B: '#f59e0b', // amber
    C: '#3b82f6', // blue
    D: '#6b7280'  // gray
  }[lead.leadGrade] || '#6b7280';

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${gradeEmoji} New Lead: ${lead.companyName}`,
        emoji: true
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Contact:*\n${lead.contactName}`
        },
        {
          type: 'mrkdwn',
          text: `*Job Title:*\n${lead.jobTitle}`
        },
        {
          type: 'mrkdwn',
          text: `*Email:*\n<mailto:${lead.email}|${lead.email}>`
        },
        {
          type: 'mrkdwn',
          text: `*Country:*\n:flag-${lead.country.toLowerCase()}: ${lead.country}`
        }
      ]
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Lead Score:*\n${lead.leadScore}/100 (Grade ${lead.leadGrade})`
        },
        {
          type: 'mrkdwn',
          text: `*Interested In:*\n${lead.interestedProducts.join(', ')}`
        }
      ]
    }
  ];

  // Add company website if provided
  if (lead.companyWebsite) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Company Website:* <${lead.companyWebsite}|${lead.companyWebsite}>`
      }
    } as any);
  }

  // Add message if provided
  if (lead.message) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Message:*\n>${lead.message.slice(0, 500)}${lead.message.length > 500 ? '...' : ''}`
      }
    } as any);
  }

  // Add action buttons
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'View in Dashboard',
          emoji: true
        },
        url: 'https://britzmedi.com/admin/leads',
        style: 'primary'
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Send Email',
          emoji: true
        },
        url: `mailto:${lead.email}?subject=Re: BRITZMEDI Inquiry`
      }
    ]
  } as any);

  const payload = {
    attachments: [
      {
        color: gradeColor,
        blocks
      }
    ]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Slack notification failed:', response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Slack notification error:', error);
    return false;
  }
}

// Quick notification for high-priority leads
export async function sendUrgentLeadAlert(
  lead: SlackLeadNotification,
  webhookUrl: string
): Promise<boolean> {
  if (lead.leadGrade !== 'A') {
    return false; // Only send urgent alerts for A-grade leads
  }

  const urgentPayload = {
    text: `:rotating_light: *URGENT: Hot Lead Alert!*\n\n*${lead.companyName}* (${lead.country}) - ${lead.contactName} (${lead.jobTitle})\nScore: ${lead.leadScore}/100\n\nRespond immediately!`
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(urgentPayload)
    });
    return response.ok;
  } catch {
    return false;
  }
}
