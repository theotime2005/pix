import { CombinedCourse } from '../../../../../src/quest/domain/models/CombinedCourse.js';
import * as combinedCourseSerializer from '../../../../../src/quest/infrastructure/serializers/combined-course-serializer.js';
import { expect } from '../../../../test-helper.js';

describe('Quest | Unit | Infrastructure | Serializers | combined-course', function () {
  it('#serialize', function () {
    // given
    const combinedCourse = new CombinedCourse({ id: 1, name: 'Mon parcours', code: 'COMBINIX1', organizationId: 1 });

    // when
    const serializedCombinedCourse = combinedCourseSerializer.serialize(combinedCourse);

    // then
    expect(serializedCombinedCourse).to.deep.equal({
      data: {
        attributes: {
          name: 'Mon parcours',
          code: 'COMBINIX1',
          'organization-id': 1,
          status: 'not-started',
        },
        type: 'combined-courses',
        id: '1',
      },
    });
  });
});
