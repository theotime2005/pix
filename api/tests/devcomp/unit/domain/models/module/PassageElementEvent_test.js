import { PassageElementEventInstantiationError } from '../../../../../../src/devcomp/domain/errors.js';
import { PassageElementEvent } from '../../../../../../src/devcomp/domain/models/passage-events/PassageElementEvent.js';
import { DomainError } from '../../../../../../src/shared/domain/errors.js';
import { catchErrSync, expect } from '../../../../../test-helper.js';

describe('Unit | Devcomp | Domain | Models | Module | PassageElementEvent', function () {
  describe('#constructor', function () {
    it('should not be able to create a PassageElementEvent directly', function () {
      // given
      const id = Symbol('id');
      const occurredAt = new Date();
      const createdAt = Symbol('date');
      const passageId = 3;

      // when
      const error = catchErrSync(
        () =>
          new PassageElementEvent({
            id,
            type: 'PassageElementEvent',
            occurredAt,
            createdAt,
            passageId,
          }),
      )();

      // then
      expect(error).to.be.instanceOf(PassageElementEventInstantiationError);
    });

    it('should throw an error if elementId is not present', function () {
      // given
      class FakePassageElementEvent extends PassageElementEvent {}

      // when
      const error = catchErrSync(
        () =>
          new FakePassageElementEvent({
            id: Symbol('id'),
            type: 'PassageElementEvent',
            occurredAt: new Date(),
            createdAt: new Date(),
            passageId: 123,
          }),
      )();

      // then
      expect(error).to.be.instanceOf(DomainError);
      expect(error.message).to.equal('The elementId property is required for a PassageElementEvent');
    });

    it('should throw an error if elementId is invalid', function () {
      // given
      class FakePassageElementEvent extends PassageElementEvent {}

      // when
      const error = catchErrSync(
        () =>
          new FakePassageElementEvent({
            id: Symbol('id'),
            type: 'PassageElementEvent',
            occurredAt: new Date(),
            createdAt: new Date(),
            passageId: 123,
            elementId: 'abcd',
          }),
      )();

      // then
      expect(error).to.be.instanceOf(DomainError);
      expect(error.message).to.equal('The elementId property should be exactly 36 characters long');
    });
  });
});
