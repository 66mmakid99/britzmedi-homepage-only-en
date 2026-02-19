// Email notifications for blog approval workflow using Resend

interface SendEmailOptions {
  apiKey: string;
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ apiKey, to, subject, html, from }: SendEmailOptions): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: from || 'BRITZMEDI Global <noreply@britzmedi.com>',
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[Email] Send failed:', errText);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Email] Error:', err);
    return false;
  }
}

/**
 * Send approval request email
 */
export async function sendApprovalEmail(
  apiKey: string,
  to: string,
  post: {
    id: string;
    title: string;
    excerpt: string;
    featured_image?: string;
  },
  approvalToken: string,
  baseUrl: string
): Promise<boolean> {
  const approveUrl = `${baseUrl}/api/blog/approve?token=${approvalToken}&action=approve`;
  const rejectUrl = `${baseUrl}/api/blog/approve?token=${approvalToken}&action=reject`;
  const editUrl = `${baseUrl}/admin/youtube-to-blog/${post.id}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1e293b; padding: 20px; border-radius: 12px 12px 0 0;">
        <h2 style="color: white; margin: 0; font-size: 18px;">BRITZMEDI Blog - Approval Required</h2>
      </div>

      <div style="border: 1px solid #e2e8f0; border-top: 0; padding: 24px; border-radius: 0 0 12px 12px;">
        <h3 style="margin: 0 0 12px; color: #1e293b;">${post.title}</h3>

        ${post.featured_image ? `
          <img src="${post.featured_image}" alt="${post.title}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 16px;" />
        ` : ''}

        <p style="color: #64748b; line-height: 1.6;">${post.excerpt}</p>

        <div style="margin-top: 24px; display: flex; gap: 12px;">
          <a href="${approveUrl}" style="display: inline-block; padding: 10px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Approve
          </a>
          <a href="${rejectUrl}" style="display: inline-block; padding: 10px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Reject
          </a>
          <a href="${editUrl}" style="display: inline-block; padding: 10px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Edit
          </a>
        </div>

        <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">
          This approval link expires in 7 days.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    apiKey,
    to,
    subject: `[Blog Approval] ${post.title}`,
    html,
  });
}
