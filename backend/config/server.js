module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  // Enable proxy mode for proper SSL and cookie handling behind reverse proxy
  // This ensures Strapi trusts X-Forwarded-* headers from Nginx
  proxy: true,
});
