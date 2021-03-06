(function () {
  'use strict';

  angular.module('exceptionless.intercom', [
    'angular-intercom',

    'app.config',
    'exceptionless.objectid'
  ])
  .config(function ($intercomProvider, INTERCOM_APPID) {
      if (!INTERCOM_APPID) {
        return;
      }

      $intercomProvider.appID(INTERCOM_APPID);
      $intercomProvider.asyncLoading(true);
  });
}());
