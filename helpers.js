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
        "course is not active": 476977084,
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

helpers.getAge = (dateString) => {
    if (!dateString) return undefined;

    var parts = dateString.split("/");
    var day = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    var year = parseInt(parts[2], 10);

    var today = new Date();
    var birthDate = new Date(year, month - 1, day); // Note: Month is 0-based in JavaScript Date object
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

module.exports = helpers;

