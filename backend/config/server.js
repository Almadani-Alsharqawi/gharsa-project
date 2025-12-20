module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  // الرابط العام للمشروع
  url: env('STRAPI_URL', 'https://strapi.gharsa.ly'),
  proxy: true, // تفعيل البروكسي بشكل إجباري
  admin: {
    // تحديد رابط الأدمن بوضوح كما في الحل الذي وجدته
    url: env('STRAPI_ADMIN_URL', '/admin'),
    auth: {
      secret: env('ADMIN_JWT_SECRET'),
    },
  },
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
