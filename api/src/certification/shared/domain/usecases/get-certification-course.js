const getCertificationCourse = async function ({
  certificationCourseId,
  verificationCode,
  certificationCourseRepository,
}) {
  return certificationCourseRepository.get({ id: certificationCourseId, verificationCode });
};

export { getCertificationCourse };
