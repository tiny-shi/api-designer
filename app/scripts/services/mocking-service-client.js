(function () {
  'use strict';

  angular.module('ramlEditorApp')
    .service('mockingServiceClient', function mockingServiceClientFactory(
      $http,
      $q,
      $window,
      $rootScope,
      resolveUri
    ) {
      var self = this;
      var SEPARATOR = '/';

      self.proxy   = null;
      self.baseUri = 'https://qax.anypoint.mulesoft.com/mocking/api/v1';

      function mockingIds() {
        var regExp = /^#\/organizations\/([A-Za-z0-9-]+)\/dashboard\/apis\/([0-9-]+)\/versions\/([0-9-]+).*$/;
        var match = $window.location.hash.match(regExp);

        if (match === null || !match[1] || !match[2] || !match[3]) {
          return [];
        }

        return match.slice(1);
      }

      self.buildURL = function buildURL() {
        var args = ['sources', 'manager', 'apis'].concat(mockingIds()).concat(Array.prototype.slice.call(arguments, 0));
        var url   = self.baseUri + SEPARATOR + args.join(SEPARATOR);
        var proxy = self.proxy || $window.RAML.Settings.proxy;

        if (proxy) {
          url = proxy + resolveUri(url);
        }

        return url;
      };

      function getToken() {
        try {
          return JSON.parse(localStorage.user).token || '';
        } catch (e) {
          return '';
        }
      }

      function customHeader(file) {
        return {
          'MS2-Authorization': getToken(),
          'MS2-Main-File': encodeURI((file && file.name) || '')
        };
      }

      self.enableMock = function createMock(file) {
        return $http.post(self.buildURL('link'), null, {headers: customHeader(file)})
          .then(function (mock) {
            const mockId = mock.data.id;
            return $http.get(self.buildURL(), { headers: customHeader(file) })
              .then(function (mockMetadata) {
                var baseUriPath = mockMetadata.data && mockMetadata.data.metadata && mockMetadata.data.metadata.baseUriPath;
                return self.baseUri + '/links/' + mockId  + baseUriPath;
              });
          });
      };

      self.deleteMock = function deleteMock(file) {
        return $http.delete(self.buildURL(), { headers:customHeader(file) });
      };

      $rootScope.$on('event:evict-mocking', function(event, file) {
        self.deleteMock(file);
      });
    })
  ;
})();
