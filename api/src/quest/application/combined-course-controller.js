import { requestResponseUtils } from '../../shared/infrastructure/utils/request-response-utils.js';
import { usecases } from '../domain/usecases/index.js';
import * as combinedCourseSerializer from '../infrastructure/serializers/combined-course-serializer.js';

const getByCode = async function (request, _) {
  const { code } = request.query.filter;

  const combinedCourse = await usecases.getCombinedCourseByCode({ code });
  return combinedCourseSerializer.serialize(combinedCourse);
};

const start = async function (request, h, dependencies = { requestResponseUtils }) {
  const userId = dependencies.requestResponseUtils.extractUserIdFromRequest(request);
  const code = request.params.code;

  await usecases.startCombinedCourse({
    userId,
    code,
  });

  return h.response().code(204);
};

const combinedCourseController = {
  getByCode,
  start,
};

export { combinedCourseController };
