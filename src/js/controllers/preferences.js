'use strict';

angular.module('copayApp.controllers').controller('preferencesController',
  function($scope, $rootScope, $filter, $timeout, $modal, $log, lodash, configService, profileService, uxLanguage) {
    var config = configService.getSync();
    this.unitName = config.wallet.settings.unitName;
    this.bwsurl = config.bws.url;
    this.currentLanguageName = uxLanguage.getCurrentLanguageName();
    this.selectedAlternative = {
      name: config.wallet.settings.alternativeName,
      isoCode: config.wallet.settings.alternativeIsoCode
    }; 
    $scope.spendUnconfirmed = config.wallet.spendUnconfirmed;
    $scope.glideraEnabled = config.glidera.enabled;
    $scope.glideraTestnet = config.glidera.testnet;
    var fc = profileService.focusedClient;
    if (fc) {
      $scope.encrypt = fc.hasPrivKeyEncrypted();
      this.externalSource = fc.getPrivKeyExternalSourceName() == 'ledger' ? "Ledger" : null;
      // TODO externalAccount
      //this.externalIndex = fc.getExternalIndex();
    }

    var unwatchSpendUnconfirmed = $scope.$watch('spendUnconfirmed', function(newVal, oldVal) {
      if (newVal == oldVal) return;
      var opts = {
        wallet: {
          spendUnconfirmed: newVal
        }
      };
      configService.set(opts, function(err) {
        $rootScope.$emit('Local/SpendUnconfirmedUpdated');
        if (err) $log.debug(err);
      });
    });

    var unwatch = $scope.$watch('encrypt', function(val) {
      var fc = profileService.focusedClient;
      if (!fc) return;

      if (val && !fc.hasPrivKeyEncrypted()) {
        $rootScope.$emit('Local/NeedsPassword', true, function(err, password) {
          if (err || !password) {
            $scope.encrypt = false;
            return;
          }
          profileService.setPrivateKeyEncryptionFC(password, function() {
            $scope.encrypt = true;
          });
        });
      } else {
        if (!val && fc.hasPrivKeyEncrypted())  {
          profileService.unlockFC(function(err){
            if (err) {
              $scope.encrypt = true;
              return;
            }
            profileService.disablePrivateKeyEncryptionFC(function(err) {
              if (err) {
                $scope.encrypt = true;
                $log.error(err);
                return;
              }
              $scope.encrypt = false;
            });
          });
        }
      }
    });

    var unwatchGlideraEnabled = $scope.$watch('glideraEnabled', function(newVal, oldVal) {
      if (newVal == oldVal) return;
      var opts = {
        glidera: {
          enabled: newVal
        }
      };
      configService.set(opts, function(err) {
        $rootScope.$emit('Local/GlideraUpdated');
        if (err) $log.debug(err);
      });
    });

    var unwatchGlideraTestnet = $scope.$watch('glideraTestnet', function(newVal, oldVal) {
      if (newVal == oldVal) return;
      var opts = {
        glidera: {
          testnet: newVal
        }
      };
      configService.set(opts, function(err) {
        $rootScope.$emit('Local/GlideraUpdated');
        if (err) $log.debug(err);
      });
    });

    $scope.$on('$destroy', function() {
      unwatch();
      unwatchSpendUnconfirmed();
      unwatchGlideraEnabled();
      unwatchGlideraTestnet();
    });
  });
