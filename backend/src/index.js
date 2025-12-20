'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register({ strapi }) {
    // إجبار النظام على اعتبار الاتصال مشفراً لحل مشكلة السيكيوور كوكيز في v5
    strapi.server.use(async (ctx, next) => {
      if (ctx.req && ctx.req.socket) {
        ctx.req.socket.encrypted = true;
      }
      await next();
    });
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   */
  bootstrap(/*{ strapi }*/) {},
};
