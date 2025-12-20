module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  // الرابط الخارجي ضروري لعمل الـ Cookies والـ Reset Password بشكل سليم
  url: env('STRAPI_URL', 'https://strapi.gharsa.ly'),
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  // تفعيل الوثوق في البروكسي (Traefik) لقراءة الـ SSL والـ Cookies
  proxy: env.bool('STRAPI_PROXY', true),
});