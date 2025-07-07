import jsonapiSerializer from 'jsonapi-serializer';

const { Serializer } = jsonapiSerializer;

const serialize = function (verifiedCode) {
  const courseType = verifiedCode.courseTypes?.[0];
  const relationshipType = courseType?.type;
  const id = verifiedCode.code;

  return new Serializer('verified-codes', {
    type: 'verified-codes',
    id,
    attributes: {},
    relationships: {
      courseTypes: {
        data: relationshipType ? [{ type: relationshipType, id }] : [],
      },
    },
  }).serialize(verifiedCode);
};

export { serialize };
