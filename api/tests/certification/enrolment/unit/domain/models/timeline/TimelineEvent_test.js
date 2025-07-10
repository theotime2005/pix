import { TimelineEvent } from '../../../../../../../src/certification/enrolment/domain/models/timeline/TimelineEvent.js';
import { EntityValidationError } from '../../../../../../../src/shared/domain/errors.js';
import { catchErrSync, expect } from '../../../../../../test-helper.js';

describe('Unit | Certification | Enrolment | Domain | Models | TimelineEvent', function () {
  it('should create a timeline event', function () {
    // given
    const data = { when: new Date() };

    // when
    const timeline = new TimelineEvent(data);

    // then
    expect(timeline).to.be.instanceOf(TimelineEvent);
    expect(timeline).to.deep.equal({ when: data.when });
  });

  it('should throw an error when trying to construct an invalid timeline event', function () {
    // given
    const notAnEvent = { when: 'a bad date' };

    // when
    const error = catchErrSync((badData) => new TimelineEvent(badData))(notAnEvent);

    // then
    expect(error).to.be.instanceOf(EntityValidationError);
  });
});
