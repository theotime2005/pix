import { setupTest } from 'ember-qunit';
import { module, test } from 'qunit';

module('Unit | Service | Access Storage', function (hooks) {
  setupTest(hooks);

  let service;

  hooks.beforeEach(function () {
    service = this.owner.lookup('service:access-storage');
    service.clearAll();
  });

  hooks.afterEach(function () {
    service.clearAll();
  });

  module('#hasUserSeenJoinPage', function () {
    test('returns false as default value', function (assert) {
      const service = this.owner.lookup('service:access-storage');
      const organizationId = 1;

      const hasUserSeenJoinPage = service.hasUserSeenJoinPage(organizationId);

      assert.false(hasUserSeenJoinPage);
    });

    test('returns true when it has been set to true', function (assert) {
      const service = this.owner.lookup('service:access-storage');
      const organizationId = 1;
      service.setHasUserSeenJoinPage(organizationId);

      const hasUserSeenJoinPage = service.hasUserSeenJoinPage(organizationId);

      assert.ok(hasUserSeenJoinPage);
    });
  });

  module('associationDone', function () {
    test('returns false as default value', function (assert) {
      const service = this.owner.lookup('service:access-storage');
      const organizationId = 1;

      const isAssociationDone = service.isAssociationDone(organizationId);

      assert.false(isAssociationDone);
    });

    test('returns true when it has been set to true', function (assert) {
      const service = this.owner.lookup('service:access-storage');
      const organizationId = 1;
      service.setAssociationDone(organizationId);

      const isAssociationDone = service.isAssociationDone(organizationId);

      assert.ok(isAssociationDone);
    });
  });
});
