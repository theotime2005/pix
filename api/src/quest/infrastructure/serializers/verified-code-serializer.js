import jsonapiSerializer from 'jsonapi-serializer';

const { Serializer } = jsonapiSerializer;

const serialize = function (verifiedCode) {
  return new Serializer('verified-codes', {
    attributes: ['type', 'courseTypes'],
    courseTypes: {
      ref: 'id',
      included: true,
      polymorphic: true,
    },
  }).serialize(verifiedCode);
};

export { serialize };
