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

helpers.stageToInternalId = (stage) => {
    const stageIdMap = {
        interviewing: 411851999,
        offered: 411852000,
        accepted: 411900861,
        rejected: 411900862,
        expired: 411900863,
        enrolled: 411900864,
        withdrawn: 411900865,
        "course cancelled": 411900866,
        applied: 417475574,
    };

    for (const id in stageIdMap) {
        if (stageIdMap.hasOwnProperty(id) && id === stage.toLowerCase()) {
            return stageIdMap[id];
        }
    }

    return {
        error: `No ID found for stage: ${stage}`,
    };
};

module.exports = helpers;
