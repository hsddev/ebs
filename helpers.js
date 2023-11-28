let helpers = {};

helpers.separateList = (array, by) => {
    const list = [];
    let arrayToAdd = [];

    for (const [id, item] of array.entries()) {
        arrayToAdd.push(item);

        if (arrayToAdd.length === by) {
            list.push(arrayToAdd);
            arrayToAdd = [];
        } else {
            if (id === array.length - 1) {
                list.push(arrayToAdd);
                arrayToAdd = null;
            }
        }
    }

    return list;
};

module.exports = helpers;
