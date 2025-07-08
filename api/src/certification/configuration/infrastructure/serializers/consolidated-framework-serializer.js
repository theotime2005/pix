import jsonapiSerializer from 'jsonapi-serializer';

const { Serializer } = jsonapiSerializer;

const serialize = function (currentConsolidatedFramework) {
  return new Serializer('certification-consolidated-framework', {
    attributes: ['complementaryCertificationKey', 'version', 'areas'],
    transform(currentConsolidatedFramework) {
      return { ...currentConsolidatedFramework, id: currentConsolidatedFramework.complementaryCertificationKey };
    },
    areas: {
      ref: 'id',
      included: true,
      attributes: ['title', 'code', 'color', 'frameworkId', 'competences'],
      competences: {
        ref: 'id',
        included: true,
        attributes: ['name', 'index', 'thematics'],
        thematics: {
          ref: 'id',
          included: true,
          attributes: ['name', 'index', 'tubes'],
          tubes: {
            ref: 'id',
            included: true,
            attributes: ['name', 'practicalTitle', 'level', 'mobile', 'tablet', 'skills'],
            skills: {
              ref: 'id',
              included: true,
              attributes: ['difficulty'],
            },
          },
        },
      },
    },
  }).serialize(currentConsolidatedFramework);
};

export { serialize };
