/**
 * The help articles /search looks through, seeded into D1 on the first query. Replace them with
 * your own content: anything with an id, a title and a body can be indexed the same way.
 */
export const articles: { id: string; title: string; body: string }[] = [
  {
    id: 'refunds',
    title: 'Refunds',
    body: 'We refund any charge within 30 days of the invoice. Open Billing, pick the invoice and choose Request refund; the amount returns to the card that paid it within five business days.',
  },
  {
    id: 'cancel',
    title: 'Cancelling a subscription',
    body: 'Cancel from Billing at any time. The plan stays active until the end of the period you paid for, and nothing is charged after that.',
  },
  {
    id: 'invoices',
    title: 'Invoices and receipts',
    body: 'Every charge produces an invoice in Billing. Add a tax number and a billing address there, and they appear on every invoice from then on.',
  },
  {
    id: 'change-plan',
    title: 'Changing plans',
    body: 'Upgrade or downgrade from Billing. An upgrade is prorated and charged at once; a downgrade takes effect at the next renewal.',
  },
  {
    id: 'payment-failed',
    title: 'When a payment fails',
    body: 'If a card is declined we retry three times over a week and email the account owner each time. Update the card in Billing to settle the balance.',
  },
  {
    id: 'sso',
    title: 'Single sign-on with SAML',
    body: 'Enterprise workspaces can require sign-in through an identity provider such as Okta or Entra ID. Upload the provider metadata under Security, then test with one account before enforcing it.',
  },
  {
    id: 'two-factor',
    title: 'Two-step verification',
    body: 'Turn on an authenticator app under Profile, Security. Keep the recovery codes somewhere safe: they are the only way back in if the phone is lost.',
  },
  {
    id: 'password-reset',
    title: 'Resetting a password',
    body: 'Choose Forgot password on the sign-in page. The link we email works once and expires after an hour.',
  },
  {
    id: 'invite',
    title: 'Inviting teammates',
    body: 'Admins invite people from Members by email. Each invitation expires after seven days and can be resent.',
  },
  {
    id: 'roles',
    title: 'Roles and permissions',
    body: 'Owners manage billing and security, admins manage members and projects, and members work inside the projects they are added to.',
  },
  {
    id: 'remove-member',
    title: 'Removing someone from the workspace',
    body: 'An admin removes a member from Members. Their projects stay, reassigned to the admin, and their access ends immediately.',
  },
  {
    id: 'export-data',
    title: 'Exporting your data',
    body: 'Download every project as CSV or JSON from Settings, Data. Large workspaces receive an email with a download link when the archive is ready.',
  },
  {
    id: 'delete-account',
    title: 'Deleting a workspace',
    body: 'The owner deletes the workspace under Settings. Data is kept for 30 days in case of a mistake, then erased permanently.',
  },
  {
    id: 'api-keys',
    title: 'API keys',
    body: 'Create keys under Settings, API. A key is shown once; store it as a secret, and rotate it by creating a new key before revoking the old one.',
  },
  {
    id: 'rate-limits',
    title: 'API rate limits',
    body: 'Each key may make 600 requests a minute. A request over the limit receives status 429 with a Retry-After header saying when to try again.',
  },
  {
    id: 'webhooks',
    title: 'Webhooks',
    body: 'Subscribe a URL to events under Settings, Webhooks. Each delivery is signed with your secret; verify the signature before trusting the body.',
  },
  {
    id: 'uptime',
    title: 'Status and incidents',
    body: 'Live service status and past incidents are on the status page. Subscribe there to hear about outages and maintenance by email.',
  },
  {
    id: 'data-region',
    title: 'Where data is stored',
    body: 'Choose the EU or US region when creating a workspace. Data at rest stays in that region, and it cannot be moved later.',
  },
  {
    id: 'gdpr',
    title: 'Privacy and GDPR requests',
    body: 'Request a copy of personal data, or its deletion, from Profile, Privacy. We answer within 30 days, as the regulation requires.',
  },
  {
    id: 'dark-mode',
    title: 'Dark mode and themes',
    body: 'Switch between light and dark themes under Profile, Appearance, or follow the operating system setting automatically.',
  },
  {
    id: 'keyboard',
    title: 'Keyboard shortcuts',
    body: 'Press the question mark anywhere to list shortcuts. Command K opens the command menu to jump to any page or action.',
  },
  {
    id: 'notifications',
    title: 'Email notifications',
    body: 'Choose which updates arrive by email under Profile, Notifications, or pause them all for a while.',
  },
  {
    id: 'mobile',
    title: 'Using the mobile app',
    body: 'The iOS and Android apps sign in with the same account and receive push notifications for mentions and assignments.',
  },
  {
    id: 'import',
    title: 'Importing from a spreadsheet',
    body: 'Upload a CSV under Settings, Data, Import. Map each column to a field, preview the first rows, then run the import; errors are listed per row.',
  },
]
