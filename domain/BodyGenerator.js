var contentInstanceBodyGeneration = function (sensored_value) {
    var bodyObject = new Object();
    var rootForAttr = new Object();

    rootForAttr['con'] =  sensored_value;
    bodyObject['m2m:cin'] = rootForAttr;

    return bodyObject;
};

exports.contentInstanceBodyGeneratorForJSON = function (sensored_value) {
    return contentInstanceBodyGeneration(sensored_value);
};